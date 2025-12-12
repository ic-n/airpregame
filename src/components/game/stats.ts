import { query } from "bitecs";
import type { World, System } from "../types";
import { CONFIG } from "../config";

export interface TeamStats {
  [key: number]: number;
}

export const createStatsSystem = (
  world: World,
  onStatsUpdate: (stats: TeamStats) => void
): System => {
  let frameCount = 0;
  const UPDATE_FREQUENCY = 30; // Update every 30 frames (~0.5s at 60fps)

  return () => {
    frameCount++;
    if (frameCount < UPDATE_FREQUENCY) return;
    frameCount = 0;

    const { Position, Health, Team } = world.components;
    const entities = query(world, [Position, Health, Team]);

    const stats: TeamStats = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
    };

    for (const eid of entities) {
      if (Health.Value[eid] !== CONFIG.HEALTH.DEAD) {
        const teamId = Team.Value[eid];
        if (stats[teamId] !== undefined) {
          stats[teamId]++;
        }
      }
    }

    onStatsUpdate(stats);
  };
};
