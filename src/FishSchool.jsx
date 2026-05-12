import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FishGeometry } from './FishGeometry';

const FISH_COUNT = 50;         // Giảm từ 150 → 50 để nhẹ hơn 3 lần
const BOUNDS = 50;             // Bán kính đàn cá quanh xe: 50m
const BOUNDS_HALF = BOUNDS / 2;
const FOLLOW_SPEED = 0.02;     // Tốc độ center bám theo xe (lerp)
const UNDERWATER_THRESHOLD = -8.5; // Chỉ hoạt động khi dưới nước

// Flocking parameters
const OPT = {
  maxSpeed: 0.12,
  maxForce: 0.04,
  neighborRadius: 12,   // Thu nhỏ lại (30 → 12) để giảm số cặp tính toán
  separationRadius: 4,
  alignmentWeight: 1.5,
  cohesionWeight: 1.0,
  separationWeight: 3.5,
  boundaryForce: 0.05,  // Tăng lên để cá không đi quá xa xe
  wanderIntensity: 0.03,
};

export default function FishSchool({ count = FISH_COUNT }) {
  const meshRef = useRef();

  // Center bám theo xe — bắt đầu tại vùng biển mặc định
  const center = useMemo(() => new THREE.Vector3(-280, -35, 120), []);
  const targetCenter = useMemo(() => new THREE.Vector3(-280, -35, 120), []);
  const vehicleCache = useRef(null);

  // Initialize fish data quanh center ban đầu
  const fishData = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3(
        center.x + (Math.random() - 0.5) * BOUNDS,
        center.y + (Math.random() - 0.5) * 10,
        center.z + (Math.random() - 0.5) * BOUNDS
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * OPT.maxSpeed,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * OPT.maxSpeed
      ),
      acceleration: new THREE.Vector3(),
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempVec = useMemo(() => new THREE.Vector3(), []);
  const steer = useMemo(() => new THREE.Vector3(), []);
  const alignment = useMemo(() => new THREE.Vector3(), []);
  const cohesion = useMemo(() => new THREE.Vector3(), []);
  const separation = useMemo(() => new THREE.Vector3(), []);

  // Pre-generate wander noise để tránh Math.random() mỗi frame
  const WANDER_SIZE = 1024;
  const wanderNoise = useMemo(() => {
    const arr = new Float32Array(WANDER_SIZE * 3);
    for (let i = 0; i < WANDER_SIZE * 3; i++) arr[i] = (Math.random() - 0.5);
    return arr;
  }, []);
  const wanderIdx = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Chỉ hoạt động khi player đang dưới nước
    const camY = state.camera.position.y;
    if (camY > UNDERWATER_THRESHOLD - 5) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    // Tìm xe của player (cache để tránh traverse mỗi frame)
    if (!vehicleCache.current || !vehicleCache.current.parent) {
      vehicleCache.current = state.scene.getObjectByName('chassis-body-visual');
    }

    // Cập nhật target center theo vị trí xe (nếu có), giữ Y dưới nước
    if (vehicleCache.current) {
      vehicleCache.current.getWorldPosition(targetCenter);
      targetCenter.y = Math.min(targetCenter.y - 5, -15); // Giữ cá ở độ sâu hợp lý
    }

    // Lerp center nhẹ nhàng theo xe để cá từ từ bám lại
    center.lerp(targetCenter, FOLLOW_SPEED);

    const time = state.clock.elapsedTime;
    const neighborRadSq = OPT.neighborRadius * OPT.neighborRadius;
    const sepRadSq = OPT.separationRadius * OPT.separationRadius;

    fishData.forEach((fish, i) => {
      steer.set(0, 0, 0);
      alignment.set(0, 0, 0);
      cohesion.set(0, 0, 0);
      separation.set(0, 0, 0);
      let totalNeighbors = 0;
      let totalSeparation = 0;

      // Flocking — chỉ check cá gần theo bounding box trước
      for (let j = 0; j < count; j++) {
        if (i === j) continue;
        const other = fishData[j];

        if (Math.abs(fish.position.x - other.position.x) > OPT.neighborRadius) continue;
        if (Math.abs(fish.position.z - other.position.z) > OPT.neighborRadius) continue;

        const distSq = fish.position.distanceToSquared(other.position);

        if (distSq < neighborRadSq) {
          alignment.add(other.velocity);
          cohesion.add(other.position);
          totalNeighbors++;

          if (distSq < sepRadSq && distSq > 0) {
            const d = Math.sqrt(distSq);
            tempVec.subVectors(fish.position, other.position).normalize().divideScalar(d);
            separation.add(tempVec);
            totalSeparation++;
          }
        }
      }

      if (totalNeighbors > 0) {
        alignment.divideScalar(totalNeighbors).normalize().multiplyScalar(OPT.maxSpeed);
        tempVec.subVectors(alignment, fish.velocity).clampLength(0, OPT.maxForce).multiplyScalar(OPT.alignmentWeight);
        steer.add(tempVec);

        cohesion.divideScalar(totalNeighbors);
        tempVec.subVectors(cohesion, fish.position).normalize().multiplyScalar(OPT.maxSpeed);
        tempVec.subVectors(tempVec, fish.velocity).clampLength(0, OPT.maxForce).multiplyScalar(OPT.cohesionWeight);
        steer.add(tempVec);
      }

      if (totalSeparation > 0) {
        separation.divideScalar(totalSeparation).normalize().multiplyScalar(OPT.maxSpeed);
        tempVec.subVectors(separation, fish.velocity).clampLength(0, OPT.maxForce).multiplyScalar(OPT.separationWeight);
        steer.add(tempVec);
      }

      // Wander (dùng noise pre-computed)
      const wi = (wanderIdx.current * 3) % (WANDER_SIZE * 3);
      tempVec.set(
        wanderNoise[wi] * OPT.wanderIntensity,
        wanderNoise[wi + 1] * OPT.wanderIntensity * 0.15,
        wanderNoise[wi + 2] * OPT.wanderIntensity
      );
      wanderIdx.current++;
      steer.add(tempVec);

      // Boundary — kéo cá về phạm vi 50m quanh center (xe)
      const distToCenter = fish.position.distanceTo(center);
      if (distToCenter > BOUNDS_HALF) {
        tempVec.subVectors(center, fish.position).normalize().multiplyScalar(OPT.boundaryForce);
        steer.add(tempVec);
      }

      // Update physics
      fish.acceleration.copy(steer);
      fish.velocity.add(fish.acceleration).clampLength(0, OPT.maxSpeed);
      fish.position.add(fish.velocity);

      // Update transform
      dummy.position.copy(fish.position);
      tempVec.copy(fish.position).add(fish.velocity);
      dummy.lookAt(tempVec);
      dummy.rotateY(Math.PI / 2);
      dummy.scale.set(0.15, 0.15, 0.15);
      dummy.rotation.x += Math.sin(time * 10 + fish.phase) * 0.15;

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const geometry = useMemo(() => {
    if (FishGeometry && FishGeometry.geometry && FishGeometry.geometry[0]) {
      return FishGeometry.geometry[0];
    }
    return new THREE.BoxGeometry(1, 1, 1);
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[geometry, null, count]} visible={false}>
      <meshPhongMaterial roughness={0.3} metalness={0.4} shininess={100} color="#88bbff" />
    </instancedMesh>
  );
}
