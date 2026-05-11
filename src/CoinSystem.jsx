import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * CoinSystem — Tối ưu hóa với InstancedMesh và Zero-State Loop
 * - Đã fix logo UET khít viền và không bị ngược chữ.
 * - Thời gian hồi vàng: 2 phút.
 * - Hiệu năng cao nhất (3 draw calls cho toàn bộ vàng).
 */

const COIN_VALUE = 100;
const PICKUP_RADIUS = 4;
const SPAWN_RADIUS_MIN = 8;
const SPAWN_RADIUS_MAX = 40;
const COIN_Y_OFFSET = 1.0;
const DESPAWN_DIST_SQ = 100 * 100;
const RESPAWN_DELAY = 120; // 120 giây = 2 phút

// ═══ ÂM THANH COIN ═══
let audioCtx = null;
function playCoinSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(2400, audioCtx.currentTime + 0.08);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1800, audioCtx.currentTime + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(3200, audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);
    osc1.start(audioCtx.currentTime);
    osc2.start(audioCtx.currentTime + 0.05);
    osc1.stop(audioCtx.currentTime + 0.3);
    osc2.stop(audioCtx.currentTime + 0.35);
  } catch(e) {}
}

function randomPositionAround(origin, minR, maxR) {
  const angle = Math.random() * Math.PI * 2;
  const dist = minR + Math.random() * (maxR - minR);

  let x = origin[0] + Math.cos(angle) * dist;
  let z = origin[2] + Math.sin(angle) * dist;

  // Giới hạn để xu chỉ spawn trên mặt đảo (đảo: ngang 600m x dọc 950m, tâm Z dịch -75m)
  // X: [-300, 300], Z: [-550, 400]. Cắt bớt 15m mỗi mép để xu không nằm sát vực
  x = Math.max(-285, Math.min(285, x));
  z = Math.max(-535, Math.min(385, z));

  // Luôn khóa Y ở mặt đất (y=0) + độ cao của xu, KHÔNG bay lơ lửng trên trời nữa
  return [
    x,
    0 + COIN_Y_OFFSET,
    z
  ];
}

const MapCoins = ({ numCoins = 15, onCollect }) => {
  const diskRef = useRef();
  const backDiskRef = useRef();
  const torusRef = useRef();
  const shadowRef = useRef();
  const coinsRef = useRef([]); // { pos, floatPhase, id, isAlive, nextRespawn }
  const carPosRef = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  
  const texture = useTexture('/UET_Logo.png');
  
  // Cấu hình texture trực tiếp để khít đẹp vào đồng xu
  useEffect(() => {
    if (texture && texture.image) {
      texture.colorSpace = THREE.SRGBColorSpace;
      
      // Tự động tính toán để ảnh luôn ở giữa bất kể kích thước
      const aspect = texture.image.width / texture.image.height;
      const zoom = 0.65; // Giảm repeat = Tăng kích thước hiển thị logo
      
      if (aspect > 1) {
        // Ảnh nằm ngang
        texture.repeat.set((1 / aspect) * zoom, zoom);
        texture.offset.set((1 - (1 / aspect) * zoom) / 2, (1 - zoom) / 2);
      } else {
        // Ảnh nằm dọc hoặc vuông
        texture.repeat.set(zoom, aspect * zoom);
        texture.offset.set((1 - zoom) / 2, (1 - aspect * zoom) / 2);
      }
    }
  }, [texture]);

  const { geometries, materials } = useMemo(() => ({
    geometries: {
      disk: new THREE.CircleGeometry(0.5, 16), // Giảm segments từ 32 xuống 16
      torus: new THREE.TorusGeometry(0.5, 0.04, 8, 24), // Giảm complexity
      shadow: new THREE.CircleGeometry(0.8, 12)
    },
    materials: {
      torus: new THREE.MeshStandardMaterial({ 
        color: "#FFD700", 
        emissive: "#FFD700", 
        emissiveIntensity: 0.8, 
        metalness: 1, 
        roughness: 0.1 
      }),
      shadow: new THREE.MeshBasicMaterial({ 
        color: "#000000", 
        transparent: true, 
        opacity: 0.3 
      })
    }
  }), []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const frameCount = useRef(0);

  useFrame((state) => {
    const car = state.scene.getObjectByName('chassis-body-visual');
    if (!car) return;

    // Lấy vị trí xe chỉ dùng khi check va chạm và respawn
    car.getWorldPosition(carPosRef.current);
    const cp = carPosRef.current;
    const time = state.clock.elapsedTime;

    // Bỏ giới hạn khung hình để chạy mượt nhất ở 144Hz
    // if (!isUpdateFrame) return; 
    
    
    // Khởi tạo
    if (!initialized.current && cp.x !== 0) {
      initialized.current = true;
      for (let i = 0; i < numCoins; i++) {
        coinsRef.current.push({
          id: `coin-${i}-${Date.now()}`,
          pos: randomPositionAround([cp.x, cp.y, cp.z], SPAWN_RADIUS_MIN, SPAWN_RADIUS_MAX),
          floatPhase: Math.random() * Math.PI * 2,
          isAlive: true,
          nextRespawn: 0
        });
      }
    }

    if (coinsRef.current.length === 0) return;

    let collectedIndex = -1;

    // Cập nhật từng instance
    coinsRef.current.forEach((coin, i) => {
      if (!coin.isAlive) {
        if (time > coin.nextRespawn) {
          coin.isAlive = true;
          // Xu chỉ xuất hiện trên mặt đảo (đã khóa ở hàm randomPositionAround)
          coin.pos = randomPositionAround([cp.x, cp.y, cp.z], SPAWN_RADIUS_MIN, SPAWN_RADIUS_MAX);
          coin.id = `coin-${Date.now()}-${Math.random()}`;
        } else {
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          if (diskRef.current) diskRef.current.setMatrixAt(i, dummy.matrix);
          if (backDiskRef.current) backDiskRef.current.setMatrixAt(i, dummy.matrix);
          if (torusRef.current) torusRef.current.setMatrixAt(i, dummy.matrix);
          if (shadowRef.current) shadowRef.current.setMatrixAt(i, dummy.matrix);
          return;
        }
      }

      // Hiệu ứng xoay và bay
      const yOffset = Math.sin(time * 2.5 + coin.floatPhase) * 0.2;
      const rotationY = time * 2.5;
      
      // Mặt trước
      dummy.scale.setScalar(1);
      dummy.position.set(coin.pos[0], coin.pos[1] + yOffset, coin.pos[2]);
      dummy.rotation.set(0, rotationY, 0);
      dummy.updateMatrix();
      if (diskRef.current) diskRef.current.setMatrixAt(i, dummy.matrix);

      // Mặt sau (Xoay 180 độ để chữ không bị ngược)
      dummy.rotation.set(0, rotationY + Math.PI, 0);
      dummy.updateMatrix();
      if (backDiskRef.current) backDiskRef.current.setMatrixAt(i, dummy.matrix);

      // Vòng Torus
      dummy.rotation.set(0, rotationY, 0);
      dummy.updateMatrix();
      if (torusRef.current) torusRef.current.setMatrixAt(i, dummy.matrix);

      // Bóng dưới đất - Chỉ hiện nếu xu gần mặt đất
      if (coin.pos[1] < 5) {
        dummy.position.set(coin.pos[0], 0.05, coin.pos[2]);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.setScalar(1 + yOffset * 0.5);
        dummy.updateMatrix();
        if (shadowRef.current) shadowRef.current.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        if (shadowRef.current) shadowRef.current.setMatrixAt(i, dummy.matrix);
      }

      // Kiểm tra va chạm
      const dx = coin.pos[0] - cp.x;
      const dy = coin.pos[1] - cp.y;
      const dz = coin.pos[2] - cp.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < PICKUP_RADIUS * PICKUP_RADIUS && collectedIndex === -1) {
        collectedIndex = i;
      }
    });

    if (diskRef.current) diskRef.current.instanceMatrix.needsUpdate = true;
    if (backDiskRef.current) backDiskRef.current.instanceMatrix.needsUpdate = true;
    if (torusRef.current) torusRef.current.instanceMatrix.needsUpdate = true;
    if (shadowRef.current) shadowRef.current.instanceMatrix.needsUpdate = true;

    if (collectedIndex !== -1) {
      const coin = coinsRef.current[collectedIndex];
      playCoinSound();
      window.dispatchEvent(new CustomEvent('coin-particle', { 
        detail: { x: coin.pos[0], y: coin.pos[1], z: coin.pos[2] } 
      }));
      onCollect(COIN_VALUE);
      window.dispatchEvent(new CustomEvent('coin-collected', { detail: { value: COIN_VALUE } }));

      coin.isAlive = false;
      coin.nextRespawn = time + RESPAWN_DELAY;
    }
  });

  // Xu đứng yên, KHÔNG có interval dịch chuyển nữa — chỉ respawn gần xe khi bị thu thập

  return (
    <group name="map-coins-instanced">
      <instancedMesh ref={diskRef} args={[geometries.disk, null, numCoins]}>
        <meshBasicMaterial map={texture} transparent alphaTest={0.5} />
      </instancedMesh>
      <instancedMesh ref={backDiskRef} args={[geometries.disk, null, numCoins]}>
        <meshBasicMaterial map={texture} transparent alphaTest={0.5} />
      </instancedMesh>
      <instancedMesh ref={torusRef} args={[geometries.torus, materials.torus, numCoins]} />
      <instancedMesh ref={shadowRef} args={[geometries.shadow, materials.shadow, numCoins]} />
    </group>
  );
};

const MAX_PARTICLES = 128;
const CoinParticles3D = () => {
  const meshRef = useRef();
  const particles = useRef([]); 
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geom = useMemo(() => new THREE.SphereGeometry(0.1, 4, 4), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#FFD700" }), []);

  useEffect(() => {
    const handler = (e) => {
      const { x, y, z } = e.detail;
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        particles.current.push({
          x, y, z,
          vx: Math.cos(angle) * speed,
          vy: 2 + Math.random() * 4,
          vz: Math.sin(angle) * speed,
          life: 1.0,
          startTime: Date.now()
        });
      }
      if (particles.current.length > MAX_PARTICLES) {
        particles.current.splice(0, particles.current.length - MAX_PARTICLES);
      }
    };
    window.addEventListener('coin-particle', handler);
    return () => window.removeEventListener('coin-particle', handler);
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    const now = Date.now();
    for (let i = 0; i < MAX_PARTICLES; i++) {
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    const activeParticles = [];
    particles.current.forEach((p, i) => {
      const elapsed = (now - p.startTime) / 1000;
      if (elapsed > 0.8) return;
      const px = p.x + p.vx * elapsed;
      const py = p.y + p.vy * elapsed - 4.9 * elapsed * elapsed;
      const pz = p.z + p.vz * elapsed;
      const scale = Math.max(0, 1 - elapsed * 1.2) * 0.15;
      dummy.position.set(px, py, pz);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      activeParticles.push(p);
    });
    particles.current = activeParticles;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={meshRef} args={[geom, mat, MAX_PARTICLES]} />;
};

const CoinCollectUI = () => {
  const [effects, setEffects] = useState([]);
  useEffect(() => {
    const handler = (e) => {
      const id = Date.now() + Math.random();
      const offsetX = (Math.random() - 0.5) * 60;
      setEffects(prev => [...prev, { id, value: e.detail.value, offsetX }]);
      setTimeout(() => {
        setEffects(prev => prev.filter(ef => ef.id !== id));
      }, 1200);
    };
    window.addEventListener('coin-collected', handler);
    return () => window.removeEventListener('coin-collected', handler);
  }, []);
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 500, pointerEvents: 'none' }}>
      {effects.map(ef => (
        <div key={ef.id} style={{
          position: 'absolute',
          top: '40%',
          left: `calc(50% + ${ef.offsetX}px)`,
          transform: 'translateX(-50%)',
          animation: 'coinCollect 1.2s ease-out forwards',
        }}>
          <div style={{
            color: '#FFD700', fontSize: '32px', fontWeight: '900', fontFamily: '"Inter", sans-serif',
            textShadow: '0 0 15px rgba(255,215,0,1), 0 0 30px rgba(255,165,0,0.6), 0 2px 4px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap', textAlign: 'center',
          }}>
            +{ef.value} 🪙
          </div>
        </div>
      ))}
      <style>{`
        @keyframes coinCollect {
          0% { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.5); }
          15% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.3); }
          30% { transform: translateX(-50%) translateY(-5px) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-50px) scale(0.6); }
        }
      `}</style>
    </div>
  );
};

export { MapCoins, CoinParticles3D, CoinCollectUI, COIN_VALUE };
