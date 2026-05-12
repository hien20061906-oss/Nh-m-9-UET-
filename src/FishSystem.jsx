import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

// Vị trí ngọn hải đăng
const LIGHTHOUSE = { x: -500, z: 50 };
const REEF_RADIUS = 200; // Bán kính khu vực cá sinh sống

// Giới hạn độ sâu
const Y_MIN = -55; // Không xuyên đáy biển (-60m)
const Y_MAX = -14;  // Đủ sâu để không nổi lên mặt nước dù có bobbing ±1.5m

// Sinh vị trí random trong vòng tròn quanh hải đăng
function randomInCircle(cx, cz, radius) {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * radius; // sqrt để phân bố đều hơn
  return [cx + Math.cos(angle) * r, cz + Math.sin(angle) * r];
}

const Fish = ({ initialData, modelPath }) => {
  const { scene, animations } = useGLTF(modelPath);
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const group = useRef();
  const { actions } = useAnimations(animations || [], group);
  const data = useRef({ ...initialData, hasAnimation: false });

  const actionRef = useRef(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = Object.keys(actions)[0];
      actionRef.current = actions[firstAction];
      actionRef.current.reset().play();
      actionRef.current.timeScale = data.current.speed * 1.5;
      data.current.hasAnimation = true;
    }
  }, [actions]);

  useFrame((state) => {
    if (!group.current) return;
    
    // TỐI ƯU: Chỉ tính khoảng cách bình phương (nhanh hơn) và chỉ update animation state khi thay đổi
    const distSq = group.current.position.distanceToSquared(state.camera.position);
    const shouldPause = distSq > 40000; // 200m * 200m

    if (shouldPause) {
      if (!isPausedRef.current) {
        if (actionRef.current) actionRef.current.paused = true;
        isPausedRef.current = true;
      }
      return; 
    } else {
      if (isPausedRef.current) {
        if (actionRef.current) actionRef.current.paused = false;
        isPausedRef.current = false;
      }
    }

    const time = state.clock.elapsedTime;
    const d = data.current;

    // Bơi tiến theo hướng hiện tại
    group.current.translateZ(d.speed * 0.5);

    // Lắc lư thân cá tự nhiên
    if (!d.hasAnimation) {
      const wobble = Math.sin(time * 8 * d.speed + d.id) * 0.12;
      group.current.rotation.y = d.rotationY + wobble;
    } else {
      group.current.rotation.y = d.rotationY;
    }

    // Nhấp nhô lên xuống nhẹ nhàng
    const pos = group.current.position;
    const bobY = d.baseY + Math.sin(time * 1.5 + d.id) * 1.5;
    pos.y = THREE.MathUtils.lerp(pos.y, bobY, 0.02);

    // === Clamp đáy biển và mặt nước ===
    if (pos.y < Y_MIN) { pos.y = Y_MIN; d.baseY = Y_MIN + 3; }
    if (pos.y > Y_MAX) { pos.y = Y_MAX; d.baseY = Y_MAX - 3; }
    // Hard clamp tuyệt đối: không cho cá nào vượt quá -10m dù bất kỳ lý do gì
    pos.y = Math.min(pos.y, -10);

    // === Xoay đầu khi ra ngoài bán kính hải đăng ===
    const dx = pos.x - LIGHTHOUSE.x;
    const dz = pos.z - LIGHTHOUSE.z;
    const distFromCenter = Math.sqrt(dx * dx + dz * dz);
    if (distFromCenter > REEF_RADIUS) {
      // Tính góc quay về trung tâm rồi xoay dần dần
      const angleToCenter = Math.atan2(-dx, -dz);
      let diff = angleToCenter - d.rotationY;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      d.rotationY += diff * 0.04; // Xoay mượt mà về trung tâm
    }

    // Lượn lờ ngẫu nhiên tự nhiên
    d.rotationY += Math.sin(time * 0.3 + d.id * 7.3) * 0.003;

    // Cập nhật rotation
    group.current.rotation.y = d.rotationY;
  });

  return (
    <group
      ref={group}
      position={initialData.position}
      rotation={[0, initialData.rotationY, 0]}
      scale={initialData.scale}
    >
      <group rotation={initialData.rotationOffset || [0, 0, 0]}>
        <primitive object={clone} />
      </group>
    </group>
  );
};

export const FishSwarm = ({ modelPath, count = 5, baseScale = 3, rotationOffset = [0, 0, 0] }) => {
  const fishesData = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const [spawnX, spawnZ] = randomInCircle(LIGHTHOUSE.x, LIGHTHOUSE.z, REEF_RADIUS);
      const spawnY = Y_MIN + Math.random() * (Y_MAX - Y_MIN);
      return {
        id: i,
        position: [spawnX, spawnY, spawnZ],
        baseY: spawnY,
      rotationY: Math.random() * Math.PI * 2,
        rotationOffset,
        speed: 0.15 + Math.random() * 0.3,
        scale: baseScale + Math.random() * baseScale * 0.5,
      };
    });
  }, [count, baseScale, rotationOffset]);

  return (
    <>
      {fishesData.map((data) => (
        <Fish key={data.id} initialData={data} modelPath={modelPath} />
      ))}
    </>
  );
};

useGLTF.preload('/models/fish/shark.glb');
