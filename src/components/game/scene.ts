import * as THREE from "three";
import { CONFIG } from "../config";

export const createScene = (): THREE.Scene => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.VISUAL.BACKGROUND_COLOR);
  scene.fog = new THREE.Fog(
    CONFIG.VISUAL.FOG_COLOR,
    CONFIG.VISUAL.FOG_NEAR,
    CONFIG.VISUAL.FOG_FAR
  );

  addGrid(scene);
  return scene;
};

const addGrid = (scene: THREE.Scene): void => {
  const gridHelper = new THREE.GridHelper(
    CONFIG.WORLD.GRID_SIZE,
    20,
    0x353535,
    0x333333
  );
  gridHelper.position.y = 0;
  scene.add(gridHelper);
};

export const createLighting = (scene: THREE.Scene): void => {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(
    CONFIG.VISUAL.AMBIENT_LIGHT.color,
    CONFIG.VISUAL.AMBIENT_LIGHT.intensity
  );
  scene.add(ambientLight);

  // Directional light (sun)
  const directionalLight = new THREE.DirectionalLight(
    CONFIG.VISUAL.DIRECTIONAL_LIGHT.color,
    CONFIG.VISUAL.DIRECTIONAL_LIGHT.intensity
  );
  const [x, y, z] = CONFIG.VISUAL.DIRECTIONAL_LIGHT.position;
  directionalLight.position.set(x, y, z);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Hemisphere light
  const hemisphereLight = new THREE.HemisphereLight(
    CONFIG.VISUAL.HEMISPHERE_LIGHT.skyColor,
    CONFIG.VISUAL.HEMISPHERE_LIGHT.groundColor,
    CONFIG.VISUAL.HEMISPHERE_LIGHT.intensity
  );
  scene.add(hemisphereLight);
};

export const createCamera = (): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(
    CONFIG.CAMERA.FOV,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 15, CONFIG.CAMERA.DISTANCE);
  camera.lookAt(0, CONFIG.CAMERA.LOOK_AT_Y, 0);
  return camera;
};

export const createRenderer = (): THREE.WebGLRenderer => {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
};

export const setupResizeHandler = (
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
): (() => void) => {
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
};
