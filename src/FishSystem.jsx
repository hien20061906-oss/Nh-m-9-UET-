import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

const Fish = ({ initialData, modelPath }) => {
  const { scene, animations } = useGLTF(modelPath);
  
  // Clone an toàn cho mô hình có hoặc không có xương
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const group = useRef();
  // Đảm bảo animations luôn là mảng để tránh crash React khi đổi xe/remount
  const { actions } = useAnimations(animations || [], group);

  // Lưu trữ dữ liệu di chuyển
  const data = useRef({ ...initialData, hasAnimation: false });

  useEffect(() => {
    // Nếu mô hình CÓ animation, tự động phát
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = Object.keys(actions)[0];
      actions[firstAction].reset().play();
      actions[firstAction].timeScale = data.current.speed * 1.5;
      data.current.hasAnimation = true;
    } else {
      data.current.hasAnimation = false;
    }
  }, [actions]);

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    
    // Thay vì tìm tên xe cụ thể (dễ bị lỗi khi đổi xe), ta dùng luôn vị trí Camera!
    // Camera luôn luôn bám theo người chơi dù họ đang đi xe gì.
    let playerPos = new THREE.Vector3();
    playerPos.copy(state.camera.position);
    playerPos.y = -10; // Đưa điểm mục tiêu xuống dưới mặt nước

    // Cá bơi tiến (hoặc lùi, tùy thuộc vào hệ trục Z của model)
    group.current.translateZ(data.current.speed * 0.5);

    // Cá lượn lờ trái phải ngẫu nhiên
    data.current.rotationY += Math.sin(time * 0.5 + data.current.id) * 0.005;

    // NẾU CÁ KHÔNG CÓ ANIMATION: Tạo hiệu ứng quẫy mình (lắc lư) giả lập
    let wobble = 0;
    if (!data.current.hasAnimation) {
      // Tốc độ lắc tỉ lệ thuận với tốc độ bơi
      wobble = Math.sin(time * 10 * data.current.speed + data.current.id) * 0.15;
    }

    // Kết hợp góc quay hướng đi và góc lắc quẫy thân
    group.current.rotation.y = data.current.rotationY + wobble;

    // Lắc lư lên xuống (nhô lên hụp xuống) dựa trên baseY cố định (tránh lỗi cá bay lên trời)
    group.current.position.y = data.current.baseY + Math.sin(time * 2 + data.current.id) * 0.5;

    // Giới hạn khu vực bơi quanh người chơi
    const distSq = group.current.position.distanceToSquared(playerPos);
    
    // 1. Nếu cá quá xa (>150m), dịch chuyển tức thời về gần người chơi
    if (distSq > 22500) { 
      const angle = Math.random() * Math.PI * 2;
      const radius = 30 + Math.random() * 20;
      group.current.position.x = playerPos.x + Math.cos(angle) * radius;
      group.current.position.z = playerPos.z + Math.sin(angle) * radius;
    } 
    // 2. Nếu cá hơi xa (>60m), bẻ lái bơi vòng lại mượt mà
    else if (distSq > 3600) { 
      const dx = playerPos.x - group.current.position.x;
      const dz = playerPos.z - group.current.position.z;
      const targetAngle = Math.atan2(dx, dz);
      
      let diff = targetAngle - data.current.rotationY;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      
      data.current.rotationY += diff * 0.05;
    }
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
  // Tạo data ngẫu nhiên cho đàn cá
  const fishesData = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      position: [0, 0, 0],
      baseY: -10 - Math.random() * 15, // Cố định độ sâu cho mỗi con cá (từ -10m đến -25m)
      rotationY: Math.random() * Math.PI * 2,
      rotationOffset: rotationOffset,
      speed: 0.2 + Math.random() * 0.4,
      scale: baseScale + Math.random() * baseScale 
    }));
  }, [count, baseScale]);

  return (
    <>
      {fishesData.map((data) => (
        <Fish key={data.id} initialData={data} modelPath={modelPath} />
      ))}
    </>
  );
};

useGLTF.preload('/models/fish/shark.glb');
