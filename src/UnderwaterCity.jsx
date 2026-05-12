import React, { useMemo, useRef } from 'react';
import { useTexture, useGLTF } from '@react-three/drei';
import { usePlane } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- CONFIGURATION ---
const SEA_FLOOR_Y = -60;
const CENTER = { x: -500, z: 50 };
const DECOR_RADIUS = 220;

// --- PHYSICS FLOOR ---
function PhysicsFloor() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, SEA_FLOOR_Y, 0],
    type: 'Static'
  }));

  const [sandTex, causticsTex] = useTexture([
    "/textures/thalassa/sand.jpg",
    "/textures/thalassa/caustics.jpg"
  ]);

  if (sandTex) {
    sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping;
    sandTex.repeat.set(50, 50);
  }
  if (causticsTex) {
    causticsTex.wrapS = causticsTex.wrapT = THREE.RepeatWrapping;
    causticsTex.repeat.set(20, 20);
  }

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[4000, 4000]} />
      <meshStandardMaterial
        map={sandTex}
        lightMap={causticsTex}
        lightMapIntensity={0.2}
        roughness={1}
      />
    </mesh>
  );
}

// --- INSTANCED DECORATIONS (Cực nhẹ cho GPU/CPU) ---
function SeaDecorationsInstanced({ modelPath, count = 80, scale = 1, glowColor = '#00ffcc' }) {
  const { nodes, materials } = useGLTF(modelPath);
  const meshRef = useRef();

  // Tìm mesh đầu tiên trong model
  const geometry = useMemo(() => {
    let geo = null;
    Object.values(nodes).forEach(node => {
      if (node.isMesh && !geo) geo = node.geometry;
    });
    return geo;
  }, [nodes]);

  // Tạo material riêng có emissive
  const material = useMemo(() => {
    const baseMat = Object.values(materials)[0] || new THREE.MeshStandardMaterial();
    const newMat = baseMat.clone();
    newMat.emissive = new THREE.Color(glowColor);
    newMat.emissiveIntensity = 0.6;
    return newMat;
  }, [materials, glowColor]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useMemo(() => {
    // Chúng ta không thể sử dụng useEffect ở đây vì InstancedMesh cần matrix ngay lúc render
    // Nhưng vì đây là static decor, chúng ta sẽ set matrix một lần
  }, []);

  // Thực hiện set matrix sau khi mount
  React.useLayoutEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * DECOR_RADIUS;
      const x = CENTER.x + Math.cos(angle) * r;
      const z = CENTER.z + Math.sin(angle) * r;
      
      dummy.position.set(x, SEA_FLOOR_Y, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      const s = scale * (0.7 + Math.random() * 0.6);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, scale, dummy]);

  if (!geometry) return null;

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} castShadow={false} receiveShadow={false} />
  );
}

// --- MAIN COMPONENT ---
export default function UnderwaterCity() {
  const groupRef = useRef();

  // Chỉ hiển thị khi camera ở dưới nước
  useFrame((state) => {
    if (groupRef.current) {
      const isVisible = state.camera.position.y < -5;
      if (groupRef.current.visible !== isVisible) {
        groupRef.current.visible = isVisible;
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <PhysicsFloor />

      {/* Dùng InstancedMesh: 2 Draw Calls thay vì 140! */}
      <SeaDecorationsInstanced modelPath="/models/underwater/coral1.glb" count={80} scale={1} glowColor="#00ffcc" />
      <SeaDecorationsInstanced modelPath="/models/underwater/coral2.glb" count={60} scale={1} glowColor="#ff69b4" />

      {/* Lighting - Giảm số lượng light */}
      <ambientLight intensity={0.15} />
      <pointLight position={[CENTER.x, SEA_FLOOR_Y + 50, CENTER.z]} intensity={1.5} color="#7dd3d1" distance={600} />
    </group>
  );
}

useGLTF.preload('/models/underwater/coral1.glb');
useGLTF.preload('/models/underwater/coral2.glb');
