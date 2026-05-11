import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Ocean = ({ 
  y = -3,           // Độ cao của mặt biển (thấp hơn mặt đất)
  size = 2000,      // Kích thước biển (rất rộng)
  color = '#006994' // Màu nước biển
}) => {
  const meshRef = useRef();

  // Tạo shader material cho hiệu ứng sóng nhẹ và lấp lánh
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime:      { value: 0 },
      uColor:     { value: new THREE.Color(color) },
      uFoamColor: { value: new THREE.Color('#a8d8ea') },
    },
    vertexShader: /* glsl */`
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorldPosition;

      // Hàm tính sóng Gerstner đơn giản
      vec3 gerstnerWave(vec3 pos, vec2 dir, float steepness, float wavelength, float speed) {
        dir = normalize(dir);
        float k = 2.0 * 3.14159 / wavelength;
        float f = k * (dot(dir, pos.xz) - speed * uTime);
        float a = steepness / k;
        
        return vec3(
          dir.x * (a * cos(f)),
          a * sin(f),
          dir.y * (a * cos(f))
        );
      }

      void main() {
        vUv = uv * 20.0; // Scale UV để sóng nhỏ và chi tiết hơn

        vec3 pos = position;
        
        // Kết hợp 3 luồng sóng đan chéo nhau để tạo bề mặt nước tự nhiên
        pos += gerstnerWave(position, vec2(1.0, 1.0), 0.05, 20.0, 1.5);
        pos += gerstnerWave(position, vec2(1.0, -0.5), 0.04, 15.0, 2.0);
        pos += gerstnerWave(position, vec2(-0.2, 0.8), 0.03, 10.0, 2.5);

        vWorldPosition = pos;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying vec3 vWorldPosition;

      // Hàm tạo nhiễu ngẫu nhiên
      vec2 hash(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }

      // Hàm tạo nhiễu Simplex (giúp tạo vân nước lấp lánh)
      float noise(in vec2 p) {
        const float K1 = 0.366025404; // (sqrt(3)-1)/2;
        const float K2 = 0.211324865; // (3-sqrt(3))/6;
        vec2 i = floor(p + (p.x + p.y) * K1);
        vec2 a = p - i + (i.x + i.y) * K2;
        vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec2 b = a - o + K2;
        vec2 c = a - 1.0 + 2.0 * K2;
        vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
        vec3 n = h * h * h * h * vec3(dot(a, hash(i + 0.0)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
        return dot(n, vec3(70.0));
      }

      void main() {
        // Tạo 2 lớp vân nước di chuyển ngược chiều nhau
        float n1 = noise(vUv * 2.0 + uTime * 0.2);
        float n2 = noise(vUv * 3.0 - uTime * 0.15);
        
        // Kết hợp vân nước để tạo hiệu ứng lấp lánh (Caustics)
        float waterPattern = (n1 + n2) * 0.5;
        waterPattern = smoothstep(0.1, 0.3, waterPattern); // Làm sắc nét các vệt sáng

        // Chỉ dùng 1 màu cho mặt biển cho đồng bộ (Dark Navy)
        vec3 seaColor = vec3(0.0, 0.2, 0.4);
        vec3 foamColor = vec3(0.85, 0.95, 1.0);

        // Nước biển 1 màu, không gradient
        vec3 baseColor = seaColor;

        // Thêm vân nước lấp lánh lên bề mặt
        vec3 finalColor = mix(baseColor, foamColor, waterPattern * 0.4);

        // Fresnel effect (Phản chiếu ánh sáng mặt trời)
        float fresnel = dot(normalize(vec3(0.0, 1.0, 0.0)), normalize(vec3(0.0, 1.0, 1.0)));
        finalColor += fresnel * 0.15;

        // Làm mờ viền biển
        float edgeFadeX = 1.0 - pow(abs((vUv.x / 20.0) - 0.5) * 2.0, 4.0);
        float edgeFadeZ = 1.0 - pow(abs((vUv.y / 20.0) - 0.5) * 2.0, 4.0);
        float alpha = min(edgeFadeX, edgeFadeZ);
        // Tăng độ trong suốt một chút để có thể lờ mờ nhìn thấy dưới biển từ trên cao
        alpha = clamp(alpha * 2.0, 0.75, 0.9);

        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  }), [color]);

  // Cập nhật thời gian để sóng chuyển động
  useFrame((state) => {
    if (material) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, y, 0]}
      material={material}
    >
      {/* Chia nhiều segments để sóng trông mượt mà hơn */}
      <planeGeometry args={[size, size, 64, 64]} />
    </mesh>
  );
};

export default Ocean;
