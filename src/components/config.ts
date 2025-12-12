// Game configuration and constants
export const CONFIG = {
  // World settings
  WORLD: {
    MAX_ENTITIES: 1000,
    BOUNDS: 20,
    GRID_SIZE: 20,
    MIN_HEIGHT: 5,
    MAX_HEIGHT: 15,
  },

  // Camera settings
  CAMERA: {
    FOV: 45,
    DISTANCE: 70,
    IDLE_TIMEOUT: 2000,
    ROTATION_SPEED: 0.001,
    DRAG_SENSITIVITY: 0.005,
    INITIAL_PHI: Math.PI / 3,
    INITIAL_THETA: 0,
    MIN_PHI: 0.1,
    MAX_PHI: Math.PI - 0.1,
    LOOK_AT_Y: 10,
  },

  // Entity settings
  ENTITY: {
    INITIAL_COUNT: 20,
    SCALE: 1,
    COLLISION_DISTANCE: 2,
    MOVEMENT_EASE: 0.015,
    RETARGET_PROBABILITY: 0.4,
    RETARGET_DISTANCE_THRESHOLD: 0.5,
  },

  // Animation settings
  ANIMATION: {
    BOB_SPEED: 0.002,
    BOB_AMOUNT: 0.3,
    SWAY_AMOUNT: 0.1,
    ROTATION_VARIANCE: 0.05,
    DAMAGE_FLASH_DURATION: 300,
    CRASH_ROTATION_SPEED: { x: 0.05, z: 0.03 },
  },

  // Team settings
  TEAMS: {
    COUNT: 2,
    COLORS: {
      1: 0xff4444, // Red
      2: 0x4444ff, // Blue
    },
  },

  // Visual settings
  VISUAL: {
    BACKGROUND_COLOR: 0x87ceeb, // Sky blue
    FOG_NEAR: 20,
    FOG_FAR: 100,
    DEAD_COLOR: 0x333333,
    AMBIENT_LIGHT: { color: 0xffffff, intensity: 0.6 },
    DIRECTIONAL_LIGHT: {
      color: 0xffffff,
      intensity: 0.8,
      position: [10, 20, 10],
    },
    HEMISPHERE_LIGHT: {
      skyColor: 0xffffff,
      groundColor: 0x444444,
      intensity: 0.4,
    },
  },

  // Asset settings
  ASSETS: {
    MODEL_PATH: "/Hot Air Balloon.glb",
    TARGET_MATERIAL_COLOR: 0xff0000, // Only recolor red materials
  },

  // Health settings
  HEALTH: {
    INITIAL: 1,
    DEAD: 0,
    FALL_TARGET_Y: -2,
  },
};

export type TeamId = 1 | 2;
