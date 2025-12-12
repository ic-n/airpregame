import * as THREE from "three";
import { CONFIG } from "../config";

export class HurricaneBackground {
  private scene: THREE.Scene;
  private cloudLayers: THREE.Mesh[] = [];
  private dustParticles: THREE.Points | null = null;
  private time: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createHurricaneWall();
    this.createDustParticles();
  }

  private createHurricaneWall(): void {
    const radius = CONFIG.CAMERA.DISTANCE * 0.75;
    const height = 80;
    const segments = 200;

    // Create multiple rotating cloud layers for depth
    for (let layer = 0; layer < 3; layer++) {
      const geometry = new THREE.CylinderGeometry(
        radius + layer * 5,
        radius + layer * 5,
        height,
        segments,
        20,
        true
      );

      // Custom shader for swirling clouds
      const material = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          time: { value: 0 },
          opacity: { value: 0.3 - layer * 0.08 },
          color1: { value: new THREE.Color(0x2a2a2a) },
          color2: { value: new THREE.Color(0x4a4a4a) },
          color3: { value: new THREE.Color(0x6a6a6a) },
          turbulence: { value: 0.5 + layer * 0.2 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPosition;
          void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform float opacity;
          uniform vec3 color1;
          uniform vec3 color2;
          uniform vec3 color3;
          uniform float turbulence;
          varying vec2 vUv;
          varying vec3 vPosition;

          // Noise function for cloud-like patterns
          float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }

          float smoothNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);

            float a = noise(i);
            float b = noise(i + vec2(1.0, 0.0));
            float c = noise(i + vec2(0.0, 1.0));
            float d = noise(i + vec2(1.0, 1.0));

            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
          }

          float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;

            for(int i = 0; i < 5; i++) {
              value += amplitude * smoothNoise(p * frequency);
              frequency *= 2.0;
              amplitude *= 0.5;
            }
            return value;
          }

          void main() {
            // Create swirling motion
            float angle = atan(vPosition.x, vPosition.z);
            float radius = length(vPosition.xz);

            // Animated spiral
            vec2 spiral = vec2(
              angle + time * 0.1 + vPosition.y * 0.02,
              vPosition.y * 0.1 + time * 0.05
            );

            // Multiple octaves of noise for cloud detail
            float noise1 = fbm(spiral * 2.0 + time * 0.1);
            float noise2 = fbm(spiral * 4.0 - time * 0.15);
            float noise3 = fbm(spiral * 8.0 + time * 0.2);

            // Combine noises
            float pattern = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
            pattern = smoothstep(0.3, 0.7, pattern);

            // Color mixing based on pattern
            vec3 color = mix(color1, color2, pattern);
            color = mix(color, color3, noise2);

            // Fade out at top and bottom
            float heightFade = smoothstep(-1.0, 0.0, vPosition.y / 40.0) *
                              smoothstep(1.0, 0.0, vPosition.y / 40.0);

            // Add turbulent edges
            float edge = smoothstep(0.2, 0.6, pattern) * turbulence;

            float finalOpacity = opacity * heightFade * (0.5 + edge);

            gl_FragColor = vec4(color, finalOpacity);
          }
        `,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = 0;
      mesh.rotation.y = (layer * Math.PI) / 3;
      this.cloudLayers.push(mesh);
      this.scene.add(mesh);
    }
  }

  private createDustParticles(): void {
    const particleCount = CONFIG.ENTITY.PARTICLES_COUNT;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = CONFIG.CAMERA.DISTANCE * 0.2 + Math.random() * 35;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 60;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = height;
      positions[i3 + 2] = Math.sin(angle) * radius;

      velocities[i3] = (Math.random() - 0.5) * 0.1;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.05;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

      scales[i] = Math.random() * 2 + 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        time: { value: 0 },
        pointTexture: { value: this.createParticleTexture() },
      },
      vertexShader: `
        attribute float scale;
        attribute vec3 velocity;
        uniform float time;
        varying float vAlpha;

        void main() {
          vec3 pos = position;

          // Spiral motion
          float angle = atan(pos.x, pos.z);
          float radius = length(pos.xz);
          angle += time * 0.2 + radius * 0.01;

          pos.x = cos(angle) * radius;
          pos.z = sin(angle) * radius;
          pos.y += sin(time * 0.5 + radius) * 2.0;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = scale * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          vAlpha = 1.0 - (radius / 50.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying float vAlpha;

        void main() {
          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          gl_FragColor = vec4(0.3, 0.3, 0.3, texColor.a * vAlpha * 0.3);
        }
      `,
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.scene.add(this.dustParticles);
  }

  private createParticleTexture(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d")!;

    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  update(deltaTime: number): void {
    this.time += deltaTime * 0.001;

    // Rotate cloud layers at different speeds
    this.cloudLayers.forEach((layer, index) => {
      const material = layer.material as THREE.ShaderMaterial;
      material.uniforms.time.value = this.time;
      layer.rotation.y += (0.0002 + index * 0.0001) * deltaTime;
    });

    // Update dust particles
    if (this.dustParticles) {
      const material = this.dustParticles.material as THREE.ShaderMaterial;
      material.uniforms.time.value = this.time;
    }
  }

  dispose(): void {
    this.cloudLayers.forEach((layer) => {
      layer.geometry.dispose();
      (layer.material as THREE.Material).dispose();
      this.scene.remove(layer);
    });

    if (this.dustParticles) {
      this.dustParticles.geometry.dispose();
      (this.dustParticles.material as THREE.Material).dispose();
      this.scene.remove(this.dustParticles);
    }

    this.cloudLayers = [];
    this.dustParticles = null;
  }
}
