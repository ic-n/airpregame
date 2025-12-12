import * as THREE from "three";
import { query, type QueryResult } from "bitecs";
import type { World, EntityData, CameraAngles, System } from "../types";
import { CONFIG } from "../config";
import {
  getComponentValue,
  setComponentValue,
  addComponentValue,
  calculateDistance,
  getRandomLivingEntity,
  randomPosition,
  randomInRange,
} from "../utils";

// Time System
export const createTimeSystem = (world: World): System => {
  return () => {
    const now = performance.now();
    world.time.delta = now - world.time.then;
    world.time.elapsed += world.time.delta;
    world.time.then = now;
  };
};

// Movement System
export const createMovementSystem = (
  world: World,
  entitiesRef: React.MutableRefObject<Map<number, EntityData>>
): System => {
  return () => {
    const { Position, Velocity, Target, Health } = world.components;
    const entities = query(world, [Position, Velocity, Target, Health]);

    for (const eid of entities) {
      const pos = getComponentValue(Position, eid);
      const target = getComponentValue(Target, eid);

      // Calculate velocity with easing
      const delta = {
        x: (target.x - pos.x) * CONFIG.ENTITY.MOVEMENT_EASE,
        y: (target.y - pos.y) * CONFIG.ENTITY.MOVEMENT_EASE,
        z: (target.z - pos.z) * CONFIG.ENTITY.MOVEMENT_EASE,
      };
      setComponentValue(Velocity, eid, delta);
      addComponentValue(Position, eid, delta);

      const entityData = entitiesRef.current.get(eid);
      if (!entityData) continue;

      if (Health.Value[eid] === CONFIG.HEALTH.DEAD) {
        handleDeadEntity(eid, Target, entityData);
      } else {
        const distance = calculateDistance(0, 0, 0, delta.x, delta.y, delta.z);
        handleLivingEntity(eid, entities, Position, Target, Health, distance);
      }

      updateEntityTransform(entityData, Position, eid, world.time.elapsed);
    }
  };
};

const handleDeadEntity = (
  eid: number,
  Target: { x: Float32Array; y: Float32Array; z: Float32Array },
  entityData: EntityData
): void => {
  Target.y[eid] = CONFIG.HEALTH.FALL_TARGET_Y;

  entityData.group.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      materials.forEach((mat) => {
        mat.color.lerp(new THREE.Color(CONFIG.VISUAL.BACKGROUND_COLOR), 0.5);
      });
    }
  });
};

const handleLivingEntity = (
  eid: number,
  entities: QueryResult,
  Position: { x: Float32Array; y: Float32Array; z: Float32Array },
  Target: { x: Float32Array; y: Float32Array; z: Float32Array },
  Health: { Value: Uint8Array },
  distance: number
): void => {
  if (distance >= CONFIG.ENTITY.RETARGET_DISTANCE_THRESHOLD) return;

  if (Math.random() < CONFIG.ENTITY.RETARGET_PROBABILITY) {
    // Pick random entity, reroll if it's dead
    const gen = () => {
      const at = Math.round(Math.random() * (entities.length - 1));
      return entities[at];
    };

    let destId = gen();
    while (eid !== destId && Health.Value[destId] === 0) {
      destId = gen();
    }

    Target.x[eid] = Position.x[destId];
    Target.y[eid] = Position.y[destId];
    Target.z[eid] = Position.z[destId];
  } else {
    Target.x[eid] = (Math.random() - 0.5) * 10;
    Target.y[eid] = Math.random() * 10;
    Target.z[eid] = (Math.random() - 0.5) * 10;
  }
};

const updateEntityTransform = (
  entityData: EntityData,
  Position: { x: Float32Array; y: Float32Array; z: Float32Array },
  eid: number,
  elapsed: number
): void => {
  const { group, timeOffset } = entityData;
  const pos = getComponentValue(Position, eid);

  // Floating bob animation
  const bobOffset =
    Math.sin(elapsed * CONFIG.ANIMATION.BOB_SPEED + timeOffset) *
    CONFIG.ANIMATION.BOB_AMOUNT;

  group.position.set(pos.x, pos.y + bobOffset, pos.z);

  // Rotation animation
  if (pos.y > 0) {
    // Gentle swaying
    group.rotation.z =
      Math.sin(elapsed * CONFIG.ANIMATION.BOB_SPEED * 0.5 + timeOffset) *
      CONFIG.ANIMATION.SWAY_AMOUNT;
    group.rotation.x =
      Math.cos(elapsed * CONFIG.ANIMATION.BOB_SPEED * 0.3 + timeOffset) *
      CONFIG.ANIMATION.SWAY_AMOUNT *
      0.5;
  } else {
    // Crashing spin
    group.rotation.x += CONFIG.ANIMATION.CRASH_ROTATION_SPEED.x;
    group.rotation.z += CONFIG.ANIMATION.CRASH_ROTATION_SPEED.z;
  }
};

// Collision System
export const createCollisionSystem = (
  world: World,
  entitiesRef: React.MutableRefObject<Map<number, EntityData>>
): System => {
  return () => {
    const { Position, Health } = world.components;
    const entities = query(world, [Position, Health]);

    for (let i = 0; i < entities.length; i++) {
      const eid1 = entities[i];
      if (Health.Value[eid1] === CONFIG.HEALTH.DEAD) continue;

      for (let j = i + 1; j < entities.length; j++) {
        const eid2 = entities[j];
        if (Health.Value[eid2] === CONFIG.HEALTH.DEAD) continue;

        const pos1 = getComponentValue(Position, eid1);
        const pos2 = getComponentValue(Position, eid2);
        const distance = calculateDistance(
          pos1.x,
          pos1.y,
          pos1.z,
          pos2.x,
          pos2.y,
          pos2.z
        );

        if (distance < CONFIG.ENTITY.COLLISION_DISTANCE) {
          handleCollision(eid1, eid2, Health, entitiesRef);
        }
      }
    }
  };
};

const handleCollision = (
  eid1: number,
  eid2: number,
  Health: { Value: Uint8Array },
  entitiesRef: React.MutableRefObject<Map<number, EntityData>>
): void => {
  const loser = Math.random() > 0.5 ? eid1 : eid2;
  Health.Value[loser] -= 1;

  const entityData = entitiesRef.current.get(loser);
  if (entityData) {
    applyDamageFlash(entityData);
  }
};

const applyDamageFlash = (entityData: EntityData): void => {
  entityData.lastDamageTime = Date.now();

  entityData.group.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((mat) => {
        const originalColor = mat.color.clone();
        mat.color.set(0xffffff);

        setTimeout(() => {
          mat.color.copy(originalColor);
        }, CONFIG.ANIMATION.DAMAGE_FLASH_DURATION);
      });
    }
  });
};

// Camera System
export const createCameraSystem = (
  camera: THREE.PerspectiveCamera,
  isDraggingRef: React.MutableRefObject<boolean>,
  cameraAngleRef: React.MutableRefObject<CameraAngles>,
  lastInteractionRef: React.MutableRefObject<number>,
  cameraDistanceRef: React.MutableRefObject<number>
): System => {
  return () => {
    const timeSinceInteraction = Date.now() - lastInteractionRef.current;
    const isIdle = timeSinceInteraction > CONFIG.CAMERA.IDLE_TIMEOUT;

    if (isIdle && !isDraggingRef.current) {
      cameraAngleRef.current.theta += CONFIG.CAMERA.ROTATION_SPEED;
    }

    updateCameraPosition(camera, cameraAngleRef.current, cameraDistanceRef);
  };
};

const updateCameraPosition = (
  camera: THREE.PerspectiveCamera,
  angles: CameraAngles,
  cameraDistanceRef: React.MutableRefObject<number>
): void => {
  const { theta, phi } = angles;
  const radius = cameraDistanceRef.current;

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  camera.position.set(x, y, z);
  camera.lookAt(0, CONFIG.CAMERA.LOOK_AT_Y, 0);
};
