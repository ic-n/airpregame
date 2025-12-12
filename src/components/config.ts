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
    DISTANCE: 50,
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
    SCALE: 0.15,
    COLLISION_DISTANCE: 1,
    MOVEMENT_EASE: 0.015,
    RETARGET_PROBABILITY: 0.35,
    RETARGET_DISTANCE_THRESHOLD: 0.01,
    PARTICLES_COUNT: 4800,
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
      1: 0x7b19e9,
      2: 0xe4de14,
    },
  },

  // Visual settings
  VISUAL: {
    BACKGROUND_COLOR: 0x333333,
    FOG_NEAR: 25,
    FOG_FAR: 65,
    FOG_COLOR: 0x333333,
    AMBIENT_LIGHT: { color: 0x444444, intensity: 7 },
    DIRECTIONAL_LIGHT: {
      color: 0xffffff,
      intensity: 5,
      position: [10, 30, 10],
    },
    HEMISPHERE_LIGHT: {
      skyColor: 0x5a7fb8,
      groundColor: 0x1a0f2e,
      intensity: 30,
    },
  },

  // Asset settings
  ASSETS: {
    MODEL_PATH: "/Hot Air Balloon.glb",
    TARGET_MATERIAL_COLOR_A: 0x009be6, // do not touch
    TARGET_MATERIAL_COLOR_B: 0xf53f30, // do not touch
    // model values
    // 0x009be6 - blue stripes of airbaloon
    // 0xf53f30 - red stripes of airbaloon
    // 0xff5519 - red gas container basket parts
    // 0x455965 - blue gas container basket parts
    // 0x795545 - dark brown basket parts
    // 0xffcd89 - light brown basket parts
  },

  // Health settings
  HEALTH: {
    INITIAL: 1,
    DEAD: 0,
    FALL_TARGET_Y: -20,
  },
};

export type TeamId = 1 | 2;
