import React, { useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const WindTurbine = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const { scene, animations } = useGLTF('/models/environment/turbine.glb');
  
  // Clone scene bằng useMemo để tự cập nhật khi model thay đổi
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  const { actions } = useAnimations(animations, clonedScene);

  // Hiệu ứng khởi động animation
  useEffect(() => {
    if (animations.length > 0) {
      Object.values(actions).forEach(action => {
        action.reset().play();
        action.setLoop(THREE.LoopRepeat, Infinity);
      });
    }
  }, [actions, animations]);

  // TỐI ƯU FPS: Chỉ chạy animation khi ở gần camera (< 300m)
  const v1 = useMemo(() => new THREE.Vector3(), []);
  const v2 = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame((state) => {
    v1.copy(state.camera.position);
    const distSq = v1.distanceToSquared(v2);
    
    const isFar = distSq > 300 * 300;
    
    Object.values(actions).forEach(action => {
      if (action && action.paused !== isFar) {
        action.paused = isFar;
      }
    });
  });

  return (
    <primitive 
      object={clonedScene} 
      position={position} 
      rotation={rotation} 
      scale={scale} 
    />
  );
};

// Preload để mượt mà
useGLTF.preload('/models/environment/turbine.glb');
