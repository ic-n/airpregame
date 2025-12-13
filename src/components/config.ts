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
    MAX_PHI: Math.PI * 0.6 - 0.1,
    LOOK_AT_Y: 10,
  },

  // Entity settings
  ENTITY: {
    INITIAL_COUNT: 4 * 8,
    SCALE: 0.15,
    COLLISION_DISTANCE: 1,
    MOVEMENT_EASE: 0.015,
    RETARGET_PROBABILITY: 0.75,
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
    COUNT: 4,
    COLORS: {
      1: 0xff6188,
      2: 0xfc9867,
      //2: 0xffd866,
      //2: 0xa9dc76,
      3: 0x78dce8,
      4: 0xab9df2,
    },
    NAMES: {
      1: "Fire",
      2: "Earth",
      3: "Water",
      4: "Air",
    },
  },

  // Balloon names (assigned in order of creation)
  BALLOON_NAMES: [
    "Nick",
    "Egor",
    "Nikita",
    "Dave",
    "Alex",
    "Ivan",
    "Vlad",
    "Mike",
    "Boris",
    "Jack",
    "Dmitri",
    "Tom",
    "Sergei",
    "Ben",
    "Anton",
    "Chris",
    "Yuri",
    "Dan",
    "Pavel",
    "Sam",
    "Maxim",
    "Luke",
    "Oleg",
    "Matt",
    "Viktor",
    "Joe",
    "Andrei",
    "Rob",
    "Igor",
    "Steve",
    "Konstantin",
    "Pete",
  ],

  // Visual settings
  VISUAL: {
    BACKGROUND_COLOR: 0x171717,
    FOG_NEAR: 25,
    FOG_FAR: 65,
    FOG_COLOR: 0x171717,
    AMBIENT_LIGHT: { color: 0x444444, intensity: 10 },
    DIRECTIONAL_LIGHT: {
      color: 0xffffff,
      intensity: 5,
      position: [10, 30, 10],
    },
    HEMISPHERE_LIGHT: {
      skyColor: 0xffffff,
      groundColor: 0x000000,
      intensity: 1,
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

  // Kill feed settings
  KILL_FEED: {
    MAX_ENTRIES: 5,
    ENTRY_DURATION: 5000, // 5 seconds
  },

  // Camera shake settings
  CAMERA_SHAKE: {
    INTENSITY: 0.5,
    DURATION: 500,
    DECAY: 0.95,
  },

  // Explosion settings
  EXPLOSION: {
    PARTICLE_COUNT: 10,
    SPEED: 0.1,
    LIFETIME: 400,
    SIZE: 0.16,
  },

  // Kill cam settings
  KILL_CAM: {
    ZOOM_AMOUNT: 15,
    DURATION: 2000,
  },
};

export type TeamId = 1 | 2 | 3 | 4;
