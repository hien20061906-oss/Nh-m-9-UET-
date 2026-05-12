import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader, RepeatWrapping } from 'three';

// ─── HIGH-FIDELITY OCEAN SHADER (ported from Submarine Simulation System) ──────
// Features: dual normal map animation, Fresnel reflectivity, specular highlights,
//           depth-based underwater light absorption, volumetric underwater look.

const Ocean = ({
  y = -3,          // height of ocean surface
  size = 2000,     // ocean plane size
  weather,         // prop thời tiết toàn cục
}) => {
  const meshRef = useRef();

  // Load the two water normal maps from Submarine project
  const normalMap1 = useLoader(TextureLoader, '/waterNormal1.png');
  const normalMap2 = useLoader(TextureLoader, '/waterNormal2.png');

  // Configure repeat wrapping for tiling
  useMemo(() => {
    [normalMap1, normalMap2].forEach(tex => {
      tex.wrapS = RepeatWrapping;
      tex.wrapT = RepeatWrapping;
    });
  }, [normalMap1, normalMap2]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime:       { value: 0 },
      uNormalMap1: { value: normalMap1 },
      uNormalMap2: { value: normalMap2 },
      uCameraY:    { value: 0 },
      uSunDir:     { value: new THREE.Vector3(0.6, 0.8, 0.2).normalize() },
      uSkyTop:     { value: new THREE.Color('#1a3a5c') },
      uSkyHorizon: { value: new THREE.Color('#4a8cb5') },
      uWaterBase:  { value: new THREE.Color('#001020') }, // Màu nền của nước biển
    },
    vertexShader: /* glsl */`
      varying vec2 vWorldXZ;
      varying vec2 vUV;
      varying vec3 vWorldPos;

      void main() {
        vec4 worldPos4 = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos4.xyz;
        vWorldXZ  = worldPos4.xz;
        // UV scale matches Submarine's NORMAL_MAP_SCALE = 0.05
        vUV = vWorldXZ * 0.05;
        gl_Position = projectionMatrix * viewMatrix * worldPos4;
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uTime;
      uniform sampler2D uNormalMap1;
      uniform sampler2D uNormalMap2;
      uniform float     uCameraY;
      uniform vec3      uSunDir;
      uniform vec3      uSkyTop;
      uniform vec3      uSkyHorizon;
      uniform vec3      uWaterBase;

      varying vec2 vWorldXZ;
      varying vec2 vUV;
      varying vec3 vWorldPos;

      // ── Constants matching Submarine Settings.js ──────────────────────────
      const float NORMAL_MAP_STRENGTH = 10.2;
      const vec2  VELOCITY_1          = vec2(0.1, 0.0);
      const vec2  VELOCITY_2          = vec2(0.0, 0.1);
      const float SPECULAR_SHARPNESS  = 100.0;
      const float MAX_VIEW_DEPTH      = 1000.0;
      const float DENSITY             = 0.1;
      const vec3  ABSORPTION          = vec3(1.0) / vec3(20.0, 80.0, 200.0);
      // critical angle for total internal reflection (water IOR ~1.33)
      const float CRITICAL_ANGLE      = 0.7297;  // asin(1/1.33) / (PI/2)

      float pow2(float x) { return x * x; }

      // Simple sky colour based on view direction
      vec3 sampleSky(vec3 dir) {
        float upness  = clamp(dir.y * 2.0, 0.0, 1.0);
        vec3 sky      = mix(uSkyHorizon, uSkyTop, upness);
        // cheap sun disc
        float sunDot  = max(0.0, dot(dir, normalize(uSunDir)));
        sky += vec3(1.0, 0.95, 0.8) * pow(sunDot, 64.0) * 3.0;
        return sky;
      }

      void main() {
        // ── Build dual normal from two scrolling normal maps ────────────────
        vec3 n1 = texture2D(uNormalMap1, vUV + VELOCITY_1 * uTime).xyz * 2.0 - 1.0;
        vec3 n2 = texture2D(uNormalMap2, vUV + VELOCITY_2 * uTime).xyz * 2.0 - 1.0;
        vec3 rawNormal = (n1 + n2) * NORMAL_MAP_STRENGTH;
        rawNormal += vec3(0.0, 0.0, 1.0);          // add up-pointing base
        // Submarine uses .xzy swizzle (Y-up world) after normalising
        vec3 normal = normalize(rawNormal).xzy;

        // ── View vector ──────────────────────────────────────────────────────
        vec3 worldPosXYZ = vec3(vWorldXZ.x, 0.0, vWorldXZ.y);
        vec3 viewVec     = worldPosXYZ - cameraPosition;
        float viewLen    = length(viewVec);
        vec3 viewDir     = viewVec / max(viewLen, 0.001);

        // ── ABOVE WATER: Fresnel + specular + sky reflection ─────────────────
        if (uCameraY > 0.0) {
          // Specular (Blinn-Phong)
          vec3 halfDir  = normalize(uSunDir - viewDir);
          float spec    = pow(max(0.0, dot(normal, halfDir)), SPECULAR_SHARPNESS);
          spec         *= 1.1; // SPECULAR_SIZE

          // Fresnel reflectivity
          float fresnel = pow2(1.0 - max(0.0, dot(-viewDir, normal)));

          // Sky reflection + Base water body color
          vec3 reflected = sampleSky(reflect(viewDir, normal));
          vec3 surface   = mix(uWaterBase, reflected, fresnel);
          
          // Add specular highlights (sun/moon glint)
          surface        = max(surface, vec3(spec));

          // Depth-based fog towards horizon
          float fog    = clamp(viewLen / 10000.0, 0.0, 1.0);
          surface      = mix(surface, uSkyHorizon, fog);

          float alpha  = max(max(fresnel, spec), fog);
          gl_FragColor = vec4(surface, clamp(alpha + 0.45, 0.45, 0.95));
          return;
        }

        // ── UNDERWATER: depth light absorption ──────────────────────────────
        float originY  = uCameraY;
        float depth    = min(viewLen, MAX_VIEW_DEPTH);
        float sampleY  = originY + viewDir.y * depth;

        // Light absorption (exponential, Submarine formula)
        vec3 light = exp((sampleY - MAX_VIEW_DEPTH * DENSITY) * ABSORPTION);
        // Modulate by sun brightness
        light *= vec3(0.9, 0.95, 1.0);

        // Fresnel from below
        float refFresnel = pow2(1.0 - max(0.0, dot(viewDir, normal)));
        float t = clamp(max(refFresnel, depth / MAX_VIEW_DEPTH), 0.0, 1.0);

        // Total internal reflection check
        if (dot(viewDir, normal) < CRITICAL_ANGLE) {
          vec3 r        = reflect(viewDir, -normal);
          float rSampleY = r.y * (MAX_VIEW_DEPTH - depth);
          vec3 rColor   = exp((rSampleY - MAX_VIEW_DEPTH * DENSITY) * ABSORPTION);
          rColor *= vec3(0.9, 0.95, 1.0);
          gl_FragColor  = vec4(mix(rColor, light, t), 1.0);
          return;
        }

        gl_FragColor = vec4(light, t);
      }
    `,
    transparent: true,
    precision: 'mediump',
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [normalMap1, normalMap2]);

  const lastWeatherRef = useRef("");

  // Update per-frame uniforms
  useFrame((state) => {
    if (!material) return;
    material.uniforms.uTime.value    = state.clock.elapsedTime;
    material.uniforms.uCameraY.value = state.camera.position.y;
    
    // Chỉ cập nhật các uniform thời tiết khi preset thay đổi để tiết kiệm hiệu năng
    if (weather && lastWeatherRef.current !== weather.label) {
      lastWeatherRef.current = weather.label;
      
      material.uniforms.uSkyTop.value.set(weather.skyTop);
      material.uniforms.uSkyHorizon.value.set(weather.skyBottom);
      
      const baseMult = weather.label.includes('Đêm') ? 0.35 : 0.15; 
      material.uniforms.uWaterBase.value.copy(material.uniforms.uSkyHorizon.value).multiplyScalar(baseMult);

      if (weather.label.includes('Đêm')) {
        material.uniforms.uSunDir.value.set(-0.5, 0.4, -0.5).normalize();
      } else {
        material.uniforms.uSunDir.value.set(0.6, 0.8, 0.2).normalize();
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, y, 0]}
      material={material}
      renderOrder={-1}
    >
      {/* Higher segment count for smoother normal interpolation */}
      <planeGeometry args={[size, size, 1, 1]} />
    </mesh>
  );
};

export default Ocean;

