import * as THREE from "three";

// ECS Component types
export interface WorldComponents {
  Position: ComponentData;
  Velocity: ComponentData;
  Target: ComponentData;
  Team: { Value: Uint8Array };
  Health: { Value: Uint8Array };
}

export interface ComponentData {
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

// World types
export interface World {
  components: WorldComponents;
  time: {
    delta: number;
    elapsed: number;
    then: number;
  };
}

// Camera types
export interface CameraAngles {
  theta: number;
  phi: number;
}

// Entity types
export interface EntityData {
  group: THREE.Group;
  originalY: number;
  timeOffset: number;
  lastDamageTime: number;
}

export interface EntityPosition {
  startX: number;
  startY: number;
  startZ: number;
}

// System types
export type System = () => void;

export interface SystemContext {
  world: World;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  entitiesRef: React.MutableRefObject<Map<number, EntityData>>;
}

// Input types
export interface MousePosition {
  x: number;
  y: number;
}

export interface InputHandlers {
  handleMouseDown: (e: MouseEvent) => void;
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseUp: () => void;
  handleTouchStart: (e: TouchEvent) => void;
  handleTouchMove: (e: TouchEvent) => void;
  handleTouchEnd: () => void;
}

// Asset types
export interface AssetLoader {
  loadModel: (team: number) => Promise<THREE.Group>;
}
