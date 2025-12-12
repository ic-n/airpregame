import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CONFIG, type TeamId } from "../config";
import { colorEquals } from "../utils";

export class AssetManager {
  private loader: GLTFLoader;
  private modelCache: Map<string, THREE.Group> = new Map();

  constructor() {
    this.loader = new GLTFLoader();
  }

  async loadBalloonModel(team: TeamId): Promise<THREE.Group> {
    try {
      const gltf = await this.loadGLTF(CONFIG.ASSETS.MODEL_PATH);
      const model = gltf.scene.clone();

      model.scale.setScalar(CONFIG.ENTITY.SCALE);
      this.applyTeamColor(model, team);

      return model;
    } catch (error) {
      console.error("Error loading balloon model:", error);
      return this.createFallbackBalloon(team);
    }
  }

  private loadGLTF(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.loader.load(path, resolve, undefined, reject);
    });
  }

  private applyTeamColor(model: THREE.Group, team: TeamId): void {
    const teamColor = new THREE.Color(CONFIG.TEAMS.COLORS[team]);

    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach((mat) => {
          // Only recolor materials that are the target color (red)
          if (
            mat instanceof THREE.MeshStandardMaterial ||
            mat instanceof THREE.MeshBasicMaterial
          ) {
            if (
              colorEquals(
                mat.color.getHex(),
                CONFIG.ASSETS.TARGET_MATERIAL_COLOR_A
              )
            ) {
              mat.color.copy(teamColor);
            }
            if (
              colorEquals(
                mat.color.getHex(),
                CONFIG.ASSETS.TARGET_MATERIAL_COLOR_B
              )
            ) {
              mat.color.copy(
                teamColor.clone().lerp(new THREE.Color().setHSL(0, 1, 1), 0.15)
              );
            }
          }
        });
      }
    });
  }

  private createFallbackBalloon(team: TeamId): THREE.Group {
    const group = new THREE.Group();
    const teamColor = CONFIG.TEAMS.COLORS[team];

    // Balloon envelope
    const balloonGeometry = new THREE.SphereGeometry(
      1,
      16,
      16,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.7
    );
    const balloonMaterial = new THREE.MeshStandardMaterial({
      color: teamColor,
      metalness: 0.2,
      roughness: 0.8,
    });
    const balloon = new THREE.Mesh(balloonGeometry, balloonMaterial);
    balloon.position.y = 1;
    group.add(balloon);

    // Basket
    const basketGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.6);
    const basketMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      metalness: 0.1,
      roughness: 0.9,
    });
    const basket = new THREE.Mesh(basketGeometry, basketMaterial);
    basket.position.y = -0.2;
    group.add(basket);

    // Ropes
    const ropeGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8);
    const ropeMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
      rope.position.set(Math.cos(angle) * 0.3, 0.4, Math.sin(angle) * 0.3);
      group.add(rope);
    }

    return group;
  }

  dispose(): void {
    this.modelCache.clear();
  }
}
