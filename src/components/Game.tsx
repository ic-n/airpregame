import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { createWorld, addEntity, addComponent, query } from "bitecs";
import "../styles/global.css";

export default function Game() {
  const [cubeCount, setCubeCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<any>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cubesRef = useRef<Map<number, THREE.Mesh>>(new Map());

  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: 0, phi: Math.PI / 4 });
  const lastInteractionRef = useRef(Date.now());

  useEffect(() => {
    if (!containerRef.current) return;

    // Create bitECS world
    const world = createWorld({
      components: {
        Position: {
          x: new Float32Array(1000),
          y: new Float32Array(1000),
          z: new Float32Array(1000),
        },
        Velocity: {
          x: new Float32Array(1000),
          y: new Float32Array(1000),
          z: new Float32Array(1000),
        },
        Target: {
          x: new Float32Array(1000),
          y: new Float32Array(1000),
          z: new Float32Array(1000),
        },
        Team: {
          Value: new Uint8Array(1000),
        },
        Health: {
          Value: new Uint8Array(1000),
        },
      },
      time: {
        delta: 0,
        elapsed: 0,
        then: performance.now(),
      },
    });

    worldRef.current = world;

    // Three.js setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const cameraDistance = 15;
    camera.position.set(0, 5, cameraDistance);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Movement system with easing in 3D
    const movementSystem = (world: any) => {
      const { Position, Velocity, Target, Health } = world.components;
      const entities = query(world, [Position, Velocity, Target, Health]);
      const ease = 0.02;

      for (const eid of entities) {
        const dx = Target.x[eid] - Position.x[eid];
        const dy = Target.y[eid] - Position.y[eid];
        const dz = Target.z[eid] - Position.z[eid];

        Velocity.x[eid] = dx * ease;
        Velocity.y[eid] = dy * ease;
        Velocity.z[eid] = dz * ease;

        Position.x[eid] += Velocity.x[eid];
        Position.y[eid] += Velocity.y[eid];
        Position.z[eid] += Velocity.z[eid];

        const cube = cubesRef.current.get(eid);

        if (Health.Value[eid] === 0) {
          Target.y[eid] = -1;
          cube?.material.color.lerp(
            new THREE.Color().setHSL(0.05, 0.01, 0.01),
            0.25
          );
        } else {
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (distance < 0.1) {
            if (Math.random() < 0.35) {
              const gen = () => {
                const at = Math.round(Math.random() * (entities.length - 1));
                const v = entities[at];
                return v;
              };
              let destId = gen();
              while (eid != destId && Health.Value[destId] === 0) {
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
          }
        }

        if (cube) {
          cube.position.x = Position.x[eid];
          cube.position.y = Position.y[eid];
          cube.position.z = Position.z[eid];

          if (Position.y[eid] > 0) {
            cube.rotation.x += (Math.random() - 0.5) / 10;
            cube.rotation.y += (Math.random() - 0.5) / 10;
          } else {
            cube.material.color.lerp(
              new THREE.Color().setHSL(0.05, 0.01, 0.01),
              -Position.y[eid] / 1
            );
          }
        }
      }
    };

    const collisionSystem = (world: any) => {
      const { Position, Health } = world.components;
      const entities = query(world, [Position, Health]);

      for (let i = 0; i < entities.length; i++) {
        const pid = entities[i];
        if (Health.Value[pid] === 0) continue;

        for (let j = i + 1; j < entities.length; j++) {
          const tid = entities[j];
          if (Health.Value[tid] === 0) continue;

          const dx = Position.x[tid] - Position.x[pid];
          const dy = Position.y[tid] - Position.y[pid];
          const dz = Position.z[tid] - Position.z[pid];

          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance < 0.5) {
            const eid = Math.random() > 0.5 ? pid : tid;
            Health.Value[eid] -= 1;
          }
        }
      }
    };

    // Camera system
    const cameraSystem = () => {
      if (!cameraRef.current) return;

      const timeSinceInteraction = Date.now() - lastInteractionRef.current;
      const isIdle = timeSinceInteraction > 2000;

      if (isIdle && !isDraggingRef.current) {
        cameraAngleRef.current.theta += 0.001;
      }

      const radius = 30;
      const x =
        radius *
        Math.sin(cameraAngleRef.current.phi) *
        Math.cos(cameraAngleRef.current.theta);
      const y = radius * Math.cos(cameraAngleRef.current.phi);
      const z =
        radius *
        Math.sin(cameraAngleRef.current.phi) *
        Math.sin(cameraAngleRef.current.theta);

      cameraRef.current.position.set(x, y, z);
      cameraRef.current.lookAt(0, 5, 0);
    };

    // Time system
    const timeSystem = (world: any) => {
      const now = performance.now();
      const delta = now - world.time.then;
      world.time.delta = delta;
      world.time.elapsed += delta;
      world.time.then = now;
    };

    // Mouse handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
      lastInteractionRef.current = Date.now();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - previousMouseRef.current.x;
      const deltaY = e.clientY - previousMouseRef.current.y;

      cameraAngleRef.current.theta -= deltaX * 0.005;
      cameraAngleRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI - 0.1, cameraAngleRef.current.phi + deltaY * 0.005)
      );

      previousMouseRef.current = { x: e.clientX, y: e.clientY };
      lastInteractionRef.current = Date.now();
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Touch handlers
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMouseRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        lastInteractionRef.current = Date.now();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;

      const deltaX = e.touches[0].clientX - previousMouseRef.current.x;
      const deltaY = e.touches[0].clientY - previousMouseRef.current.y;

      cameraAngleRef.current.theta -= deltaX * 0.005;
      cameraAngleRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI - 0.1, cameraAngleRef.current.phi + deltaY * 0.005)
      );

      previousMouseRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      lastInteractionRef.current = Date.now();
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    renderer.domElement.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    renderer.domElement.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      timeSystem(world);
      movementSystem(world);
      collisionSystem(world);
      cameraSystem();

      renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    const handleResize = () => {
      if (!cameraRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      renderer.domElement.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);

      cubesRef.current.forEach((cube) => {
        cube.geometry.dispose();
        (cube.material as THREE.Material).dispose();
        scene.remove(cube);
      });
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  const addCube = () => {
    if (!worldRef.current || !sceneRef.current) return;

    const world = worldRef.current;
    const scene = sceneRef.current;
    const { Position, Velocity, Target, Health, Team } = world.components;
    const eid = addEntity(world);

    addComponent(world, eid, Position);
    addComponent(world, eid, Velocity);
    addComponent(world, eid, Target);
    addComponent(world, eid, Health);
    addComponent(world, eid, Team);

    const startX = (Math.random() - 0.5) * 10;
    const startY = 0;
    const startZ = (Math.random() - 0.5) * 10;

    Position.x[eid] = startX;
    Position.y[eid] = startY;
    Position.z[eid] = startZ;

    Target.x[eid] = (Math.random() - 0.5) * 10;
    Target.y[eid] = Math.random() * 10;
    Target.z[eid] = (Math.random() - 0.5) * 10;

    let team = 1;
    if (Math.random() > 0.5) team = 2;

    Team.Value[eid] = team;

    Health.Value[eid] = 1;

    const geometry = new THREE.SphereGeometry(0.5, 6, 3);
    const material = new THREE.MeshBasicMaterial({
      color: {
        0: new THREE.Color().setHSL(1, 1, 1),
        1: new THREE.Color().setHSL(0, 0.5, 0.5),
        2: new THREE.Color().setHSL(0.5, 0.5, 0.5),
      }[team],
      wireframe: true,
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(startX, startY, startZ);
    scene.add(cube);

    cubesRef.current.set(eid, cube);
    setCubeCount((prev) => prev + 1);
  };

  useEffect(() => {
    for (let i = 0; i < 200; i++) {
      addCube();
    }
  }, []);

  return (
    <>
      <div ref={containerRef} className="fixed inset-0" />
      <div className="fixed top-4 left-4 z-10 bg-black/80 text-white p-4 rounded">
        <div className="mb-2">
          <div className="text-sm">Cubes: {cubeCount}</div>
        </div>
        <button
          onClick={addCube}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Add Cube
        </button>
      </div>
    </>
  );
}
