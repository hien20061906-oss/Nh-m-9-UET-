import React, { useMemo, useEffect, useContext, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import { useTrimesh, useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { RaceContext } from './RaceManager';

const Checkpoint = ({ position, rotation, index, scale = [5, 5, 0.5] }) => {
  const { onCheckpointReached, currentCheckpoint } = useContext(RaceContext);
  const isTarget = currentCheckpoint === index - 1;
  const isReached = currentCheckpoint >= index;

  const [ref] = useBox(() => ({
    isSensor: true,
    position,
    rotation,
    args: scale,
    onCollide: (e) => {
      if (e.body.name === 'chassis-body' || e.contact.bi.name === 'chassis-body' || e.contact.bj.name === 'chassis-body') {
        onCheckpointReached(index);
      }
    }
  }));

  return (
    <group position={position} rotation={rotation}>
      {/* Visual ring/gate */}
      <mesh scale={[scale[0], scale[1], 0.1]}>
        <boxGeometry />
        <meshStandardMaterial 
          color={isReached ? '#00ff88' : (isTarget ? '#ffcc00' : '#ffffff')} 
          transparent 
          opacity={isTarget ? 0.5 : (isReached ? 0.2 : 0.1)}
          emissive={isTarget ? '#ffcc00' : (isReached ? '#00ff88' : '#000000')}
          emissiveIntensity={isTarget ? 2 : 0.5}
        />
      </mesh>
      {/* Pillar markers */}
      <mesh position={[-scale[0]/2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, scale[1]]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[scale[0]/2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, scale[1]]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
};

const FinishSensor = ({ position, offset, radius = 5 }) => {
  const { raceState, finishRace, currentTime } = useContext(RaceContext);
  
  useFrame((state) => {
    if (raceState !== 'RUNNING') return;
    
    // Chỉ cho phép về đích sau khi đã đua được ít nhất 10 giây 
    // (Để tránh việc vừa tele vào đã bị tính là về đích luôn)
    if (currentTime < 10) return;

    const car = state.scene.getObjectByName('chassis-body-visual');
    if (!car) return;

    car.updateWorldMatrix(true, false);
    const carPos = new THREE.Vector3();
    car.getWorldPosition(carPos);

    const finishPos = new THREE.Vector3(
      position[0] + offset[0],
      position[1] + offset[1],
      position[2] + offset[2]
    );
    
    const dist = carPos.distanceTo(finishPos);

    if (dist < radius) {
      console.log("🏁 CHÚC MỪNG! BẠN ĐÃ VỀ ĐÍCH!");
      finishRace();
    }
  });

  return null;
};

const StartSensor = ({ position, onEnterTrack, radius = 8, offset = [0, 0, 0], uiScale = 1.0, rotation = 0 }) => {
  const { startRace, raceState } = useContext(RaceContext);
  const [isNear, setIsNear] = useState(false);
  const [carRef, setCarRef] = useState(null);

  useFrame((state) => {
    if (raceState !== 'IDLE') return;
    
    const car = state.scene.getObjectByName('chassis-body-visual');
    if (!car) return;
    if (!carRef) setCarRef(car);

    // Ép cập nhật ma trận để lấy tọa độ chính xác tuyệt đối
    car.updateWorldMatrix(true, false);
    const carPos = new THREE.Vector3();
    car.getWorldPosition(carPos);

    const trackPos = new THREE.Vector3(
      position[0] + offset[0],
      position[1] + offset[1],
      position[2] + offset[2]
    );
    
    const dist = carPos.distanceTo(trackPos);

    if (dist < radius && !isNear) {
      console.log(`ĐÃ VÀO VÙNG ĐUA: Khoảng cách ${dist.toFixed(2)} < Bán kính ${radius}`);
      setIsNear(true);
    }
    if (dist >= radius && isNear) {
      setIsNear(false);
    }
  });

  const handleStart = () => {
    // 1. Dịch chuyển xe vào vạch xuất phát NGAY LẬP TỨC
    onEnterTrack?.();
    
    // 2. Đợi 0.1 giây để xe "ổn định" vị trí rồi mới bắt đầu đếm ngược
    setTimeout(() => {
      startRace();
    }, 100);
  };

  return (
    <group>
      {/* Biển báo Billboard 2 cột cắm dưới đất */}
      {raceState === 'IDLE' && (
        <group 
          position={[offset[0], offset[1], offset[2]]} 
          rotation={[0, rotation * (Math.PI / 180), 0]}
        >
          {/* Hai cột trụ 2 bên */}
          <mesh position={[-2, 1.5, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 4, 16]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[2, 1.5, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 4, 16]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          
          {/* Vòng tròn nhận diện dưới đất */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <ringGeometry args={[radius - 0.5, radius, 64]} />
            <meshBasicMaterial color="#00ff88" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>

          {/* Cấu trúc Bảng hiệu chính */}
          <group position={[0, 3, 0]}>
            {/* Khung bảng */}
            <mesh>
              <boxGeometry args={[4.5, 3, 0.3]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            
            {/* Mặt bảng phát sáng */}
            <mesh position={[0, 0, 0.16]}>
              <boxGeometry args={[4.2, 2.7, 0.05]} />
              <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.2} transparent opacity={0.9} />
            </mesh>

            {/* Chữ RACE dính vào bảng */}
            <Html 
              transform 
              distanceFactor={3.5} 
              position={[0, 0.5, 0.2]}
              pointerEvents="none"
            >
              <div style={{
                color: 'black',
                fontFamily: '"Arial Black", sans-serif',
                textAlign: 'center',
                width: '400px',
                userSelect: 'none'
              }}>
                <h1 style={{ margin: 0, fontSize: '60px', letterSpacing: '5px' }}>RACE</h1>
                <div style={{ background: 'black', color: '#00ff88', padding: '5px', fontSize: '15px', fontWeight: 'bold' }}>
                  ENTRY POINT
                </div>
              </div>
            </Html>

            {/* Nút bấm cũng biến thành 3D nằm trên bảng */}
            {isNear && (
              <Html 
                transform
                distanceFactor={3.5} 
                position={[0, -0.8, 0.22]}
              >
                <div 
                  onClick={handleStart}
                  style={{
                    background: '#00ff88',
                    color: 'black',
                    padding: '10px 20px',
                    borderRadius: '50px',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    cursor: 'pointer',
                    boxShadow: '0 0 20px #00ff88',
                    border: '2px solid black',
                    transition: 'all 0.2s',
                    transform: `scale(${uiScale})`
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = `scale(${uiScale * 1.05})`}
                  onMouseOut={(e) => e.currentTarget.style.transform = `scale(${uiScale})`}
                >
                  VÀO ĐUA NGAY (E)
                </div>
              </Html>
            )}
          </group>
        </group>
      )}
    </group>
  );
};

const PhysicsTrack = ({ vertices, indices, position }) => {
  // Thành phần này chỉ được gọi khi đã có đủ dữ liệu vertices
  useTrimesh(() => ({
    args: [vertices, indices],
    position,
    type: 'Static',
  }), useRef());
  return null;
};

const RaceTrack = ({ 
  position = [0, 0, 0], 
  scale = 1.0, 
  onEnterTrack, 
  sensorOffset = [0, 0, 0], 
  sensorRadius = 8, 
  uiScale = 1.0, 
  sensorRotation = 0,
  finishOffset = null 
}) => {
  const { scene } = useGLTF('/models/map/race_track.glb');
  const { raceState } = useContext(RaceContext);
  
  const physData = useMemo(() => {
    if (!scene) return null;

    const v = [];
    const idx = [];
    
    scene.traverse((child) => {
      if (child.isMesh) {
        const name = child.name.toLowerCase();
        
        child.visible = true;
        child.castShadow = true;
        child.receiveShadow = true;

        const isCorePhysics = name.includes('road') || 
                              name.includes('track') || 
                              name.includes('wall') || 
                              name.includes('rail') ||
                              name.includes('fence') ||
                              name.includes('circuit');
        
        if (isCorePhysics) {
          const geom = child.geometry;
          const posAttr = geom.attributes.position;
          if (posAttr) {
            child.updateMatrixWorld(true);
            const matrix = child.matrixWorld.clone();
            const worldToLocal = scene.matrixWorld.clone().invert();
            matrix.premultiply(worldToLocal);

            for (let i = 0; i < posAttr.count; i++) {
              const vertex = new THREE.Vector3().fromBufferAttribute(posAttr, i);
              vertex.applyMatrix4(matrix);
              v.push(vertex.x * scale, vertex.y * scale, vertex.z * scale);
            }

            const startIdx = v.length / 3 - posAttr.count;
            if (geom.index) {
              for (let i = 0; i < geom.index.count; i++) {
                idx.push(geom.index.array[i] + startIdx);
              }
            } else {
              for (let i = 0; i < posAttr.count; i++) {
                idx.push(i + startIdx);
              }
            }
          }
        }
      }
    });

    return v.length > 0 ? {
      vertices: new Float32Array(v),
      indices: new Uint32Array(idx)
    } : null;
  }, [scene, scale]);

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <primitive object={scene} />
      
      {physData && (
        <PhysicsTrack 
          vertices={physData.vertices} 
          indices={physData.indices} 
          position={position} 
        />
      )}

      <StartSensor position={position} onEnterTrack={onEnterTrack} offset={sensorOffset} radius={sensorRadius} uiScale={uiScale} rotation={sensorRotation} />
      
      {/* Cảm biến vạch đích */}
      {finishOffset && <FinishSensor position={position} offset={finishOffset} />}

      {raceState !== 'IDLE' && (
        <>
          <Checkpoint position={[0, 0.5, 30]} index={0} />
          <Checkpoint position={[40, 0.5, -20]} index={1} />
          <Checkpoint position={[-10, 0.5, -60]} index={2} />
        </>
      )}
    </group>
  );
};

export default RaceTrack;
