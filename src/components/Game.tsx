import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { CONFIG, type TeamId } from "./config";
import type {
  CameraAngles,
  MousePosition,
  EntityData,
  KillFeedEntry,
} from "./types";
import { initializeWorld } from "./game/world";
import { AssetManager } from "./game/AssetManager";
import { HurricaneBackground } from "./game/HurricaneBackground";
import { ExplosionSystem } from "./game/explosion";
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
import { createStatsSystem, type TeamStats } from "./game/stats";
import { createInputHandlers, attachInputHandlers } from "./game/input";
import { createEntity, destroyEntity } from "./game/entity";
import "../styles/global.css";

type GameState = "selection" | "playing" | "finished";

export default function Game() {
  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState>("selection");
  const [selectedTeam, setSelectedTeam] = useState<TeamId | null>(null);
  const [winningTeam, setWinningTeam] = useState<TeamId | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStats>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });
  const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<ReturnType<typeof initializeWorld> | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const entitiesRef = useRef<Map<number, EntityData>>(new Map());
  const assetManagerRef = useRef<AssetManager>(new AssetManager());
  const hurricaneRef = useRef<HurricaneBackground | null>(null);
  const explosionRef = useRef<ExplosionSystem | null>(null);

  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef<MousePosition>({ x: 0, y: 0 });
  const cameraAngleRef = useRef<CameraAngles>({
    theta: CONFIG.CAMERA.INITIAL_THETA,
    phi: CONFIG.CAMERA.INITIAL_PHI,
  });
  const lastInteractionRef = useRef(Date.now());
  const cameraDistanceRef = useRef(CONFIG.CAMERA.DISTANCE);
  const cameraShakeRef = useRef({ intensity: 0, duration: 0, elapsed: 0 });
  const killCamRef = useRef<{
    active: boolean;
    targetPos: THREE.Vector3 | null;
    startTime: number;
    originalDistance: number;
  }>({
    active: false,
    targetPos: null,
    startTime: 0,
    originalDistance: CONFIG.CAMERA.DISTANCE,
  });

  // Handle kill event
  const handleKill = (
    killerTeam: number,
    victimTeam: number,
    position: { x: number; y: number; z: number }
  ) => {
    // Add to kill feed
    const newEntry: KillFeedEntry = {
      id: `${Date.now()}-${Math.random()}`,
      killerTeam,
      victimTeam,
      timestamp: Date.now(),
    };

    setKillFeed((prev) => {
      const updated = [newEntry, ...prev].slice(
        0,
        CONFIG.KILL_FEED.MAX_ENTRIES
      );
      return updated;
    });

    // Trigger camera shake
    cameraShakeRef.current = {
      intensity: CONFIG.CAMERA_SHAKE.INTENSITY,
      duration: CONFIG.CAMERA_SHAKE.DURATION,
      elapsed: 0,
    };
  };

  // Handle collision (for explosions)
  const handleCollision = (
    position: { x: number; y: number; z: number },
    color: number
  ) => {
    if (explosionRef.current) {
      const pos = new THREE.Vector3(position.x, position.y, position.z);
      explosionRef.current.createExplosion(pos, color);
    }
  };

  // Activate kill cam
  const activateKillCam = (position: { x: number; y: number; z: number }) => {
    killCamRef.current = {
      active: true,
      targetPos: new THREE.Vector3(position.x, position.y, position.z),
      startTime: Date.now(),
      originalDistance: cameraDistanceRef.current,
    };
  };

  // Initialize game
  useEffect(() => {
    if (!containerRef.current) return;

    const world = initializeWorld();
    worldRef.current = world;

    const scene = createScene();
    sceneRef.current = scene;
    createLighting(scene);

    const hurricane = new HurricaneBackground(scene);
    hurricaneRef.current = hurricane;

    const explosion = new ExplosionSystem(scene);
    explosionRef.current = explosion;

    const camera = createCamera();
    cameraRef.current = camera;

    const renderer = createRenderer();
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    // Create systems
    const systems = [
      createTimeSystem(world),
      createMovementSystem(world, entitiesRef),
      createCollisionSystem(world, entitiesRef, handleKill, handleCollision),
      createStatsSystem(world, setTeamStats),
      createCameraSystem(
        camera,
        isDraggingRef,
        cameraAngleRef,
        lastInteractionRef,
        cameraDistanceRef,
        cameraShakeRef
      ),
    ];

    // Setup input
    const inputHandlers = createInputHandlers(
      isDraggingRef,
      previousMouseRef,
      cameraAngleRef,
      lastInteractionRef,
      cameraDistanceRef
    );
    const cleanupInput = attachInputHandlers(
      renderer.domElement,
      inputHandlers
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      systems.forEach((system) => system());
      if (hurricaneRef.current) {
        hurricaneRef.current.update(world.time.delta);
      }
      if (explosionRef.current) {
        explosionRef.current.update(world.time.delta);
      }

      // Handle kill cam
      if (
        killCamRef.current.active &&
        killCamRef.current.targetPos &&
        cameraRef.current
      ) {
        const elapsed = Date.now() - killCamRef.current.startTime;
        const progress = Math.min(elapsed / CONFIG.KILL_CAM.DURATION, 1);

        // Smooth zoom in
        const targetDistance =
          killCamRef.current.originalDistance - CONFIG.KILL_CAM.ZOOM_AMOUNT;
        cameraDistanceRef.current =
          killCamRef.current.originalDistance -
          (killCamRef.current.originalDistance - targetDistance) * progress;

        // Look at kill position
        const lookAtY = killCamRef.current.targetPos.y;
        cameraRef.current.lookAt(0, lookAtY, 0);

        if (progress >= 1) {
          killCamRef.current.active = false;
        }
      }

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
      if (hurricaneRef.current) {
        hurricaneRef.current.dispose();
      }
      if (explosionRef.current) {
        explosionRef.current.dispose();
      }
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

  // Monitor game state
  useEffect(() => {
    if (gameState !== "playing") return;

    const aliveTeams = Object.entries(teamStats)
      .filter(([_, count]) => count > 0)
      .map(([id, _]) => parseInt(id) as TeamId);

    if (aliveTeams.length === 1) {
      setWinningTeam(aliveTeams[0]);

      // Trigger kill cam if we have a recent kill
      if (killFeed.length > 0) {
        const lastKill = killFeed[0];
        // Get approximate position from world - we'll use center for now
        // In a real scenario, you'd want to track the last kill position
        activateKillCam({ x: 0, y: 10, z: 0 });
      }

      setTimeout(() => {
        setGameState("finished");
      }, CONFIG.KILL_CAM.DURATION + 500);
    } else if (aliveTeams.length === 0) {
      // All teams died (unlikely but possible)
      setTimeout(() => {
        setGameState("finished");
      }, 1500);
    }
  }, [teamStats, gameState, killFeed]);

  const handleTeamSelect = (team: TeamId) => {
    setSelectedTeam(team);
  };

  const handleStartGame = () => {
    if (selectedTeam) {
      setGameState("playing");
    }
  };

  const handlePlayAgain = () => {
    setSelectedTeam(null);
    setWinningTeam(null);
    setGameState("selection");
    // Reload page to reset everything
    window.location.reload();
  };

  return (
    <>
      <div ref={containerRef} className="fixed inset-0" />

      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="text-white text-2xl">Loading balloons...</div>
        </div>
      )}

      {/* Team Selection Screen */}
      {!isLoading && gameState === "selection" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="bg-neutral-800 text-white p-8 rounded-lg max-w-md w-full mx-4">
            <h1 className="text-3xl font-bold mb-2 text-center">
              Storm Protocol
            </h1>
            <p className="text-neutral-400 text-center mb-6">
              Pick your team and watch the battle unfold
            </p>

            <div className="space-y-3 mb-6">
              {Object.entries(CONFIG.TEAMS.COLORS).map(([id, color]) => {
                const teamId = parseInt(id) as TeamId;
                const isSelected = selectedTeam === teamId;
                return (
                  <button
                    key={id}
                    onClick={() => handleTeamSelect(teamId)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-white bg-neutral-700 scale-105"
                        : "border-neutral-600 hover:border-neutral-500 hover:bg-neutral-750"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-6 h-6 rounded"
                        style={{
                          backgroundColor:
                            "#" + color.toString(16).padStart(6, "0"),
                        }}
                      ></span>
                      <span className="text-xl font-bold">Team {id}</span>
                      {isSelected && (
                        <span className="ml-auto text-green-400">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleStartGame}
              disabled={!selectedTeam}
              className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
                selectedTeam
                  ? "bg-white text-black hover:bg-neutral-200"
                  : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
              }`}
            >
              {selectedTeam ? "Start Battle" : "Select a Team"}
            </button>
          </div>
        </div>
      )}

      {/* Stats Panel - Show during playing */}
      {gameState === "playing" && (
        <div className="fixed top-4 left-4 z-10 bg-neutral-800 text-white px-4 py-2 rounded backdrop-blur-sm">
          <div>
            <div className="text-lg font-bold mb-2">Storm Protocol</div>
            {Object.entries(CONFIG.TEAMS.COLORS).map(([id, color]) => {
              const teamId = parseInt(id);
              const alive = teamStats[teamId] || 0;
              const isYourTeam = teamId === selectedTeam;
              return (
                <div
                  key={id}
                  className={`text-sm mb-1 flex items-center justify-between gap-4 ${
                    isYourTeam ? "font-bold" : ""
                  }`}
                >
                  <div className="flex items-center">
                    <span
                      className="inline-block w-3 h-3 mr-2 rounded-sm"
                      style={{
                        backgroundColor:
                          "#" + color.toString(16).padStart(6, "0"),
                      }}
                    ></span>
                    <span>
                      Team {id}
                      {isYourTeam && (
                        <span className="ml-1 text-green-400 text-xs">★</span>
                      )}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-right">
                    {alive} alive
                  </div>
                </div>
              );
            })}
            <div className="text-xs text-neutral-400 mt-2 pt-2 border-t border-neutral-700">
              Total: {Object.values(teamStats).reduce((a, b) => a + b, 0)}{" "}
              balloons
            </div>

            {/* Kill Feed */}
            {killFeed.length > 0 && (
              <div className="mt-3 pt-3 border-t border-neutral-700 relative">
                <div className="text-xs font-bold text-neutral-400 mb-2">
                  KILL FEED
                </div>
                <div className="relative">
                  {killFeed.map((entry, index) => {
                    const killerColor =
                      CONFIG.TEAMS.COLORS[entry.killerTeam as TeamId];
                    const victimColor =
                      CONFIG.TEAMS.COLORS[entry.victimTeam as TeamId];
                    const opacity = 1 - index * 0.15;

                    return (
                      <div
                        key={entry.id}
                        className="text-xs mb-1.5 flex items-center gap-1.5"
                        style={{ opacity }}
                      >
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-sm"
                          style={{
                            backgroundColor:
                              "#" + killerColor.toString(16).padStart(6, "0"),
                          }}
                        ></span>
                        <span className="text-neutral-300 font-bold">
                          Team {entry.killerTeam}
                        </span>
                        <span className="text-neutral-500 text-[10px]">→</span>
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-sm"
                          style={{
                            backgroundColor:
                              "#" + victimColor.toString(16).padStart(6, "0"),
                          }}
                        ></span>
                        <span className="text-neutral-400">
                          Team {entry.victimTeam}
                        </span>
                      </div>
                    );
                  })}
                  {/* Gradient overlay */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent, rgb(38, 38, 38))",
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Result Screen */}
      {gameState === "finished" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="bg-neutral-800 text-white p-8 rounded-lg max-w-md w-full mx-4">
            {winningTeam && (
              <>
                <div className="text-center mb-6">
                  {winningTeam === selectedTeam ? (
                    <>
                      <h2 className="text-4xl font-bold mb-2 text-green-400">
                        You Won!
                      </h2>
                      <p className="text-neutral-400">
                        Your prediction was correct!
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-4xl font-bold mb-2 text-red-400">
                        You Lost!
                      </h2>
                      <p className="text-neutral-400">Better luck next time!</p>
                    </>
                  )}
                </div>

                <div className="bg-neutral-700 p-4 rounded-lg mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-neutral-400">Your Team:</span>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded"
                        style={{
                          backgroundColor:
                            "#" +
                            CONFIG.TEAMS.COLORS[selectedTeam!]
                              .toString(16)
                              .padStart(6, "0"),
                        }}
                      ></span>
                      <span className="font-bold">Team {selectedTeam}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Winner:</span>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded"
                        style={{
                          backgroundColor:
                            "#" +
                            CONFIG.TEAMS.COLORS[winningTeam]
                              .toString(16)
                              .padStart(6, "0"),
                        }}
                      ></span>
                      <span className="font-bold">Team {winningTeam}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!winningTeam && (
              <>
                <div className="text-6xl mb-4 text-center">🌪️</div>
                <h2 className="text-4xl font-bold mb-2 text-center">
                  Storm's Fury!
                </h2>
                <p className="text-neutral-400 text-center mb-6">
                  All balloons were lost to the hurricane!
                </p>
              </>
            )}

            <button
              onClick={handlePlayAgain}
              className="w-full py-3 rounded-lg font-bold text-lg bg-white text-black hover:bg-neutral-200 transition-all"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 left-4 z-10 bg-neutral-800 text-white px-3 py-2 rounded backdrop-blur-sm text-xs">
        <div>- Drag to rotate camera</div>
        <div>- Balloons fight when they collide</div>
      </div>
    </>
  );
}
