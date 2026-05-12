import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useGLTF, Text } from '@react-three/drei';
import { useBox, useCylinder } from '@react-three/cannon';
import * as THREE from 'three';

const AREA_OFFSET = [2.825, 3.576, 2.522];
const LAVA_POS    = [2.222, 1.875, -1.747];

// Reuse vector để tránh tạo object mới mỗi frame
const _ovenPos = new THREE.Vector3();

// ─── BÁNH QUY VẬT LÝ ─────────────────────────────────────────────────────────
// Dùng memo để chỉ re-render khi position thay đổi
const DynamicCookie = React.memo(function DynamicCookie({ position, geo, mat }) {
  const [ref, api] = useCylinder(() => ({
    mass: 0.3, args: [0.2, 0.2, 0.07, 6], position, // 6 segment thay vì 8
    linearDamping: 0.5, angularDamping: 0.6,
    sleepSpeedLimit: 1.0, // Ngủ sớm khi ổn định
  }));
  useEffect(() => {
    const t = setTimeout(() => {
      api.applyImpulse(
        [(Math.random() - 0.5) * 3, Math.random() * 4 + 3, Math.random() * 3 + 1],
        [0, 0, 0]
      );
    }, 50);
    return () => clearTimeout(t);
  }, [api]);
  return <mesh ref={ref} geometry={geo} material={mat} scale={0.7} />;
});

// ─── QUẠT BLOWER ─────────────────────────────────────────────────────────────
const Blower = React.memo(function Blower({ nodes, materials }) {
  const ref = useRef();
  // Chỉ chạy animation khi tab active
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 1.5;
  });
  if (!nodes.refBlower001) return null;
  return (
    <group>
      {nodes.Cube054 && (
        <mesh geometry={nodes.Cube054.geometry} material={materials.palette}
          position={[0.005, -0.441, -0.505]} rotation={[0, -Math.PI / 2, 0]}
          scale={[0.759, 0.519, 3.928]} />
      )}
      <mesh ref={ref} geometry={nodes.refBlower001.geometry} material={materials.palette}
        position={[-0.01, -0.251, -0.011]} rotation={[0, -Math.PI / 2, 0]} />
    </group>
  );
});

// ─── LÒ NƯỚNG ─────────────────────────────────────────────────────────────────
function CookieOvenInner({ position, rotation }) {
  const { nodes, materials } = useGLTF('/models/areas.glb');
  const [count, setCount] = useState(0);
  const [cookies, setCookies] = useState([]);
  const { camera } = useThree();

  // Cache position array để dùng trong distanceTo
  const posArr = useMemo(() => position, [position]);

  const [physRef] = useBox(() => ({
    type: 'Static',
    args: [3.5, 2.6, 2.4],
    position: [position[0] + 1, position[1] + 1.0, position[2] - 1.5],
    rotation,
  }));

  useEffect(() => {
    const fn = (e) => {
      if (e.key !== 'Enter') return;
      _ovenPos.set(posArr[0], posArr[1], posArr[2]);
      if (camera.position.distanceTo(_ovenPos) > 35) return;
      setCount(n => n + 1);
      const spawnPos = [
        posArr[0] + 1 + (Math.random() - 0.5) * 0.4,
        posArr[1] + 1.75,
        posArr[2] - 11,
      ];
      setCookies(prev => {
        const next = [...prev, { id: Date.now() + Math.random(), pos: spawnPos }];
        // Giới hạn 10 bánh để tránh lag vật lý
        return next.length > 10 ? next.slice(-10) : next;
      });
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [camera, posArr]);

  const TEXT_POS = [1.206, 3.35, -1.312];
  const TEXT_ROT = [-0.239, 0.252, 0.082];
  const formattedCount = useMemo(() => count.toLocaleString('en-US'), [count]);

  return (
    <group position={position} rotation={rotation} dispose={null}>

      {/* Collider */}
      <mesh ref={physRef} visible={false}>
        <boxGeometry args={[3.5, 2.6, 2.4]} />
      </mesh>

      {/* Ánh lửa — distance nhỏ để chỉ ảnh hưởng cục bộ */}
      <pointLight
        position={LAVA_POS}
        intensity={4} color="#ff6600" distance={6} decay={2}
      />

      <group position={AREA_OFFSET}>
        {/* Blower */}
        <group position={[0.833, -2.747, -4.25]} rotation={[0, Math.PI / 2, 0]}>
          <Blower nodes={nodes} materials={materials} />
        </group>

        {/* Thân lò */}
        <group position={[-0.962, -1.582, -3.308]}>
          <mesh geometry={nodes.Cube135.geometry} material={materials.palette}
            position={[-1.863, -1.344, 0.786]} rotation={[0, 0, Math.PI]}
            scale={[1.889, 1.299, 1.299]}
            castShadow={false} receiveShadow={false} />

          <mesh geometry={nodes.lava.geometry} material={materials.emissiveOrangeRadialGradient}
            position={[0.359, -0.469, -0.961]} rotation={[0, 1.571, 0]} scale={0.921} />

          <mesh geometry={nodes.refBanner.geometry} material={materials.cookieBanner}
            position={[4.76, -0.059, 0.336]} rotation={[0, 0.392, 0]} />

          <mesh geometry={nodes.refCounterPanel.geometry} material={materials.palette}
            position={[-0.657, 0.844, -0.526]} rotation={[-0.239, 0.252, 0.082]} />

          {nodes.refOvenHeat && (
            <mesh geometry={nodes.refOvenHeat.geometry} material={nodes.refOvenHeat.material}
              position={[-0.811, -0.419, -1.085]} scale={[1, 1, 0.915]} />
          )}
        </group>
      </group>

      {/* Số đếm — chỉ re-render khi count thay đổi nhờ formattedCount memo */}
      <Text position={TEXT_POS} rotation={TEXT_ROT}
        fontSize={0.36} color="#ffffff" anchorX="center" anchorY="middle"
        outlineWidth={0.02} outlineColor="#3a2010">
        {formattedCount}
      </Text>

      {cookies.map(c => (
        <DynamicCookie key={c.id} position={c.pos}
          geo={nodes.refCookie.geometry} mat={materials.palette} />
      ))}
    </group>
  );
}

export default function CookieOven(props) {
  return <Suspense fallback={null}><CookieOvenInner {...props} /></Suspense>;
}

useGLTF.preload('/models/areas.glb');
