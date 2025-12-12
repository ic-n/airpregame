import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { CONFIG, type TeamId } from "./config";
import type { CameraAngles, MousePosition, EntityData } from "./types";
import { initializeWorld } from "./game/world";
import { AssetManager } from "./game/AssetManager";
import {
  createScene,
  createLighting,
  createCamera,
  createRenderer,
  setupResizeHandler,
} from "./game/scene";
import {
  createTimeSystem,
  createMovementSystem,
  createCollisionSystem,
  createCameraSystem,
} from "./game/systems";
import { createInputHandlers, attachInputHandlers } from "./game/input";
import { createEntity, destroyEntity } from "./game/entity";
import "../styles/global.css";

export default function Game() {
  const [entityCount, setEntityCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<ReturnType<typeof initializeWorld> | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const entitiesRef = useRef<Map<number, EntityData>>(new Map());
  const assetManagerRef = useRef<AssetManager>(new AssetManager());

  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef<MousePosition>({ x: 0, y: 0 });
  const cameraAngleRef = useRef<CameraAngles>({
    theta: CONFIG.CAMERA.INITIAL_THETA,
    phi: CONFIG.CAMERA.INITIAL_PHI,
  });
  const lastInteractionRef = useRef(Date.now());

  // Initialize game
  useEffect(() => {
    if (!containerRef.current) return;

    const world = initializeWorld();
    worldRef.current = world;

    const scene = createScene();
    sceneRef.current = scene;
    createLighting(scene);

    const camera = createCamera();
    cameraRef.current = camera;

    const renderer = createRenderer();
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    // Create systems
    const systems = [
      createTimeSystem(world),
      createMovementSystem(world, entitiesRef),
      createCollisionSystem(world, entitiesRef),
      createCameraSystem(
        camera,
        isDraggingRef,
        cameraAngleRef,
        lastInteractionRef
      ),
    ];

    // Setup input
    const inputHandlers = createInputHandlers(
      isDraggingRef,
      previousMouseRef,
      cameraAngleRef,
      lastInteractionRef
    );
    const cleanupInput = attachInputHandlers(
      renderer.domElement,
      inputHandlers
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      systems.forEach((system) => system());
      renderer.render(scene, camera);
    };
    animate();

    // Setup resize handler
    const cleanupResize = setupResizeHandler(camera, renderer);

    setIsLoading(false);

    // Cleanup
    return () => {
      cleanupInput();
      cleanupResize();
      entitiesRef.current.forEach((_, eid) =>
        destroyEntity(eid, scene, entitiesRef)
      );
      assetManagerRef.current.dispose();
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Add entity
  const addBalloon = async () => {
    if (!worldRef.current || !sceneRef.current) return;

    const eid = await createEntity(
      worldRef.current,
      sceneRef.current,
      entitiesRef,
      (team: TeamId) => assetManagerRef.current.loadBalloonModel(team)
    );

    setEntityCount((prev) => prev + 1);
  };

  // Add initial entities
  useEffect(() => {
    if (!isLoading) {
      const addInitialEntities = async () => {
        const promises = Array.from(
          { length: CONFIG.ENTITY.INITIAL_COUNT },
          () => addBalloon()
        );
        await Promise.all(promises);
      };
      addInitialEntities();
    }
  }, [isLoading]);

  return (
    <>
      <div ref={containerRef} className="fixed inset-0" />

      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="text-white text-2xl">Loading balloons...</div>
        </div>
      )}

      <div className="fixed top-4 left-4 z-10 bg-black/80 text-white p-4 rounded backdrop-blur-sm">
        <div className="mb-4">
          <div className="text-lg font-bold mb-2">Hot Air Balloon Battle</div>
          <div className="text-sm mb-1">
            <span className="inline-block w-3 h-3 bg-red-500 mr-2"></span>
            Red Team vs
            <span className="inline-block w-3 h-3 bg-blue-500 mx-2"></span>
            Blue Team
          </div>
          <div className="text-sm">Active Balloons: {entityCount}</div>
        </div>
        <button
          onClick={addBalloon}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
        >
          Add Balloon
        </button>
      </div>

      <div className="fixed bottom-4 left-4 z-10 bg-black/80 text-white p-3 rounded backdrop-blur-sm text-xs">
        <div>🖱️ Drag to rotate camera</div>
        <div>🎈 Balloons fight when they collide</div>
      </div>
    </>
  );
}
