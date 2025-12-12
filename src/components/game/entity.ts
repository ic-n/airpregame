import * as THREE from "three";
import { addEntity, addComponent } from "bitecs";
import type { World, EntityData, EntityPosition } from "../types";
import { CONFIG, type TeamId } from "../config";
import { randomPosition, randomInRange } from "../utils";

export const createEntityComponents = (
  world: World,
  eid: number,
  team: TeamId
): EntityPosition => {
  const { Position, Velocity, Target, Health, Team } = world.components;

  addComponent(world, eid, Position);
  addComponent(world, eid, Velocity);
  addComponent(world, eid, Target);
  addComponent(world, eid, Health);
  addComponent(world, eid, Team);

  const startX = randomPosition(CONFIG.WORLD.BOUNDS);
  const startY = randomInRange(
    CONFIG.WORLD.MIN_HEIGHT,
    CONFIG.WORLD.MAX_HEIGHT
  );
  const startZ = randomPosition(CONFIG.WORLD.BOUNDS);

  Position.x[eid] = startX;
  Position.y[eid] = startY;
  Position.z[eid] = startZ;

  Target.x[eid] = randomPosition(CONFIG.WORLD.BOUNDS);
  Target.y[eid] = randomInRange(
    CONFIG.WORLD.MIN_HEIGHT,
    CONFIG.WORLD.MAX_HEIGHT
  );
  Target.z[eid] = randomPosition(CONFIG.WORLD.BOUNDS);

  Team.Value[eid] = team;
  Health.Value[eid] = CONFIG.HEALTH.INITIAL;

  return { startX, startY, startZ };
};

export const createEntity = async (
  world: World,
  scene: THREE.Scene,
  entitiesRef: React.MutableRefObject<Map<number, EntityData>>,
  loadModel: (team: TeamId) => Promise<THREE.Group>
): Promise<number> => {
  const eid = addEntity(world);
  const team: TeamId = Math.round(
    Math.random() * (CONFIG.TEAMS.COUNT - 1) + 1
  ) as TeamId;

  const { startX, startY, startZ } = createEntityComponents(world, eid, team);

  const model = await loadModel(team);
  model.position.set(startX, startY, startZ);
  scene.add(model);

  const entityData: EntityData = {
    group: model,
    originalY: startY,
    timeOffset: Math.random() * Math.PI * 2,
    lastDamageTime: 0,
  };

  entitiesRef.current.set(eid, entityData);

  return eid;
};

export const destroyEntity = (
  eid: number,
  scene: THREE.Scene,
  entitiesRef: React.MutableRefObject<Map<number, EntityData>>
): void => {
  const entityData = entitiesRef.current.get(eid);
  if (!entityData) return;

  entityData.group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => mat.dispose());
      } else {
        child.material.dispose();
      }
    }
  });

  scene.remove(entityData.group);
  entitiesRef.current.delete(eid);
};
