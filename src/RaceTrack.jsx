import React, { useMemo, useEffect, useContext, useState, useRef } from 'react';
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

const StartSensor = ({ position, onEnterTrack, scale = [60, 0.5, 60] }) => {
  const { startRace, raceState } = useContext(RaceContext);
  const [isNear, setIsNear] = useState(false);

  // Cảm biến vùng rộng xung quanh đường đua (mỏng sát đất)
  const [ref] = useBox(() => ({
    isSensor: true,
    position: [position[0], position[1] + 0.25, position[2]],
    args: scale,
    onCollide: (e) => {
      if (e.body.name === 'chassis-body') setIsNear(true);
    },
    onCollideEnd: (e) => {
      if (e.body.name === 'chassis-body') setIsNear(false);
    }
  }));

  const handleStart = () => {
    onEnterTrack?.(); // Dịch chuyển xe vào vạch xuất phát
    startRace();     // Bắt đầu đếm ngược
  };

  return (
    <group>
      <mesh ref={ref} visible={false} />
      {isNear && raceState === 'IDLE' && (
        <Html position={[0, 10, 0]} center>
          <div style={{
            background: 'rgba(0,0,0,0.85)',
            color: 'white',
            padding: '20px 30px',
            borderRadius: '20px',
            border: '2px solid #00ff88',
            boxShadow: '0 0 20px rgba(0,255,136,0.5)',
            fontFamily: 'sans-serif',
            textAlign: 'center',
            width: '250px',
            pointerEvents: 'auto'
          }}>
            <p style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold' }}>🏎️ ĐƯỜNG ĐUA MINI</p>
            <button 
              onClick={handleStart}
              style={{
                background: 'linear-gradient(135deg, #00ff88 0%, #00bd65 100%)',
                border: 'none',
                padding: '12px 25px',
                borderRadius: '10px',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
              }}
            >
              VÀO ĐƯỜNG ĐUA (E)
            </button>
            <p style={{ fontSize: '12px', marginTop: '10px', opacity: 0.7 }}>Ấn để tự động đưa xe vào vạch</p>
          </div>
        </Html>
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

const RaceTrack = ({ position = [0, 0, 0], scale = 1.0, onEnterTrack }) => {
  const { scene } = useGLTF('/models/map/race_track.glb');
  const { raceState } = useContext(RaceContext);
  
  const [physData, setPhysData] = useState(null);

  useEffect(() => {
    if (!scene) return;

    const v = [];
    const idx = [];
    
    scene.traverse((child) => {
      if (child.isMesh) {
        // Bao gồm Road, Rails, Fences, Walls vào hệ thống vật lý
        const name = child.name.toLowerCase();
        const isPhysicsObject = name.startsWith('ref') || 
                                name.includes('rail') || 
                                name.includes('fence') || 
                                name.includes('wall') ||
                                name.includes('circuit') ||
                                name.includes('guard') ||
                                name.includes('barri');
        
        if (isPhysicsObject) {
          child.visible = true;
          child.castShadow = true;
          child.receiveShadow = true;
          
          const geom = child.geometry;
          const posAttr = geom.attributes.position;
          if (posAttr) {
            // Lấy ma trận cục bộ của mesh đối với gốc của model GLB
            child.updateMatrixWorld(true);
            const matrix = child.matrixWorld.clone();
            const worldToLocal = scene.matrixWorld.clone().invert();
            matrix.premultiply(worldToLocal);

            for (let i = 0; i < posAttr.count; i++) {
              const vertex = new THREE.Vector3().fromBufferAttribute(posAttr, i);
              vertex.applyMatrix4(matrix);
              // Scale tọa độ theo yêu cầu người dùng
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
        } else {
          child.visible = false;
        }
      }
    });

    if (v.length > 0) {
      setPhysData({
        vertices: new Float32Array(v),
        indices: new Uint32Array(idx)
      });
    }
  }, [scene, scale]);

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <primitive object={scene} />
      
      {/* Chỉ kích hoạt vật lý khi đã load xong dữ liệu model */}
      {physData && (
        <PhysicsTrack 
          vertices={physData.vertices} 
          indices={physData.indices} 
          position={position} 
        />
      )}

      <StartSensor position={[0, 0, 0]} onEnterTrack={onEnterTrack} />

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
