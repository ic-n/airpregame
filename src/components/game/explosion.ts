import * as THREE from "three";
import { CONFIG } from "../config";
import type { ExplosionParticle } from "../types";

export class ExplosionSystem {
  private scene: THREE.Scene;
  private particles: ExplosionParticle[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createExplosion(position: THREE.Vector3, color: number): void {
    const particleCount = CONFIG.EXPLOSION.PARTICLE_COUNT;

    for (let i = 0; i < particleCount; i++) {
      // Random direction with more controlled spread
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5 + Math.PI * 0.25; // More horizontal spread

      // Reduced speed for tighter explosion
      const speedVariance = 0.7 + Math.random() * 0.6; // 0.7-1.3 multiplier
      const velocity = new THREE.Vector3(
        Math.sin(phi) *
          Math.cos(theta) *
          CONFIG.EXPLOSION.SPEED *
          speedVariance,
        Math.sin(phi) *
          Math.sin(theta) *
          CONFIG.EXPLOSION.SPEED *
          speedVariance,
        Math.cos(phi) * CONFIG.EXPLOSION.SPEED * speedVariance
      );

      // Create particle mesh
      const geometry = new THREE.SphereGeometry(CONFIG.EXPLOSION.SIZE, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);

      this.scene.add(mesh);

      this.particles.push({
        position: position.clone(),
        velocity: velocity,
        mesh: mesh,
        lifetime: 0,
        maxLifetime: CONFIG.EXPLOSION.LIFETIME,
      });
    }
  }

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.lifetime += deltaTime;

      if (particle.lifetime >= particle.maxLifetime) {
        // Remove particle
        this.scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        (particle.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Update position
      particle.position.add(
        particle.velocity.clone().multiplyScalar(deltaTime)
      );
      particle.mesh.position.copy(particle.position);

      // Apply stronger gravity for more condensed effect
      particle.velocity.y -= 0.001 * deltaTime;

      // Add velocity damping to slow particles down
      particle.velocity.multiplyScalar(0.98);

      // Fade out
      const progress = particle.lifetime / particle.maxLifetime;
      const opacity = 1 - progress;
      (particle.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;

      // Scale down
      const scale = 1 - progress * 0.5;
      particle.mesh.scale.setScalar(scale);
    }
  }

  dispose(): void {
    this.particles.forEach((particle) => {
      this.scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      (particle.mesh.material as THREE.Material).dispose();
    });
    this.particles = [];
  }
}
