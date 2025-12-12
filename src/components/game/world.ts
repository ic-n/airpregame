import { createWorld } from "bitecs";
import type { World, WorldComponents } from "../types";
import { CONFIG } from "../config";

export const createComponents = (maxEntities: number): WorldComponents => ({
  Position: {
    x: new Float32Array(maxEntities),
    y: new Float32Array(maxEntities),
    z: new Float32Array(maxEntities),
  },
  Velocity: {
    x: new Float32Array(maxEntities),
    y: new Float32Array(maxEntities),
    z: new Float32Array(maxEntities),
  },
  Target: {
    x: new Float32Array(maxEntities),
    y: new Float32Array(maxEntities),
    z: new Float32Array(maxEntities),
  },
  Team: {
    Value: new Uint8Array(maxEntities),
  },
  Health: {
    Value: new Uint8Array(maxEntities),
  },
});

export const initializeWorld = (): World => {
  return createWorld({
    components: createComponents(CONFIG.WORLD.MAX_ENTITIES),
    time: {
      delta: 0,
      elapsed: 0,
      then: performance.now(),
    },
  }) as World;
};
