import React, { useMemo, useEffect, useContext, useState, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import { useTrimesh, useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { RaceContext } from './RaceManager';

const Checkpoint = ({ position, rotation, index, scale = [30, 15, 2], trackPosition = [0, 0, 0], trackScale = 1 }) => {
  const { onCheckpointReached, currentCheckpoint } = useContext(RaceContext);
  const isTarget = currentCheckpoint === index - 1;
  const isReached = currentCheckpoint >= index;

  const worldPos = [
    trackPosition[0] + position[0] * trackScale,
    trackPosition[1] + position[1] * trackScale,
    trackPosition[2] + position[2] * trackScale
  ];
  const worldArgs = [scale[0] * trackScale, scale[1] * trackScale, scale[2] * trackScale];

  const [ref] = useBox(() => ({
    isSensor: true,
    position: worldPos,
    rotation,
    args: worldArgs,
    onCollide: (e) => {
      if (e.body.name === 'chassis-body' || e.contact.bi.name === 'chassis-body' || e.contact.bj.name === 'chassis-body') {
        onCheckpointReached(index);
      }
    }
  }));

  return (
    <group position={position} rotation={rotation} visible={false}>
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
      <mesh position={[-scale[0] / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, scale[1]]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[scale[0] / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, scale[1]]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
};

/**
 * FinishSensor — Cảm biến vạch đích
 * 
 * LOGIC ĐÚNG (lấy từ MiniDrive CircuitArea.js line 449-453):
 * - Chỉ tính FINISH khi đã qua ĐỦ TẤT CẢ checkpoint (0, 1, 2)
 * - Sau đó xe phải quay lại vạch xuất phát (chạy hết 1 vòng)
 * - KHÔNG dùng timer để quyết định finish
 * 
 * startLinePos = tọa độ vạch xuất phát (cũng là vạch đích khi chạy vòng)
 */
const FinishSensor = ({ position, offset, radius = 10, startLinePos }) => {
  const { raceState, finishRace } = useContext(RaceContext);
  const hasLeftStart = useRef(false);

  useEffect(() => {
    if (raceState === 'RUNNING') {
      hasLeftStart.current = false;
    }
  }, [raceState]);

  useFrame((state) => {
    if (raceState !== 'RUNNING') return;

    const car = state.scene.getObjectByName('chassis-body-visual');
    if (!car) return;

    car.updateWorldMatrix(true, false);
    const carPos = new THREE.Vector3();
    car.getWorldPosition(carPos);

    // Vạch đích = vạch xuất phát (chạy 1 vòng quay lại)
    const finishPos = startLinePos
      ? new THREE.Vector3(startLinePos[0], startLinePos[1], startLinePos[2])
      : new THREE.Vector3(
        position[0] + offset[0],
        position[1] + offset[1],
        position[2] + offset[2]
      );

    const dist = carPos.distanceTo(finishPos);

    if (!hasLeftStart.current) {
      if (dist > 15) {
        hasLeftStart.current = true;
        console.log("Rời khỏi vạch xuất phát!");
      }
      return;
    }

    if (dist < radius) {
      console.log("🏁 FINISH! Đã chạy một vòng và quay lại vạch đích!");
      finishRace();
      hasLeftStart.current = false;
    }
  });

  // Visual: Chỉ hiện vạch đích sáng khi đã qua đủ checkpoint
  return (
    <group visible={false}>
      {/* Vạch đích tại vị trí xuất phát */}
      {startLinePos && (
        <mesh position={startLinePos}>
          <boxGeometry args={[radius * 2, 3, 1]} />
          <meshBasicMaterial
            color={hasLeftStart.current ? '#00ff88' : '#ff4444'}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
      {/* Fallback: vạch đích tại offset */}
      {!startLinePos && (
        <mesh position={[offset[0], offset[1], offset[2]]}>
          <boxGeometry args={[radius * 2, 5, 1]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.1} />
        </mesh>
      )}
    </group>
  );
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

  const handleStart = useCallback(() => {
    if (raceState !== 'IDLE' || !isNear) return;
    onEnterTrack?.();
    setTimeout(() => {
      startRace();
    }, 100);
  }, [raceState, isNear, onEnterTrack, startRace]);

  /**
   * Lắng nghe phím E/F/Enter để vào đua
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.code === 'KeyE' || e.code === 'KeyF' || e.code === 'Enter') && raceState === 'IDLE' && isNear) {
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStart, raceState, isNear]);

  return (
    <>
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

        {/* Vòng tròn nhận diện (ẩn) */}
        <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <ringGeometry args={[radius - 0.2, radius, 64]} />
            <meshBasicMaterial color="#00ff88" transparent opacity={0} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Bảng hiệu chính */}
        <group position={[0, 3, 0]}>
          <mesh>
            <boxGeometry args={[4.5, 3, 0.3]} />
            <meshStandardMaterial color="#111" />
          </mesh>

          <mesh position={[0, 0, 0.16]}>
            <boxGeometry args={[4.2, 2.7, 0.05]} />
            <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.2} transparent opacity={0.9} />
          </mesh>

          {(raceState === 'IDLE' || raceState === 'FINISHED') && (
            <>
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

              {isNear && (
                <Html
                  transform
                  distanceFactor={3.5}
                  position={[0, -0.3, 0.4]}
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
            </>
          )}
        </group>
      </group>
    </>
  );
};

const LeaderboardBoard = ({ position, rotation = 0 }) => {
  const { leaderboard } = useContext(RaceContext);

  return (
    <group position={position} rotation={[0, rotation * (Math.PI / 180), 0]}>
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[6.2, 5.2, 0.3]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh position={[0, 2.5, 0.16]}>
        <boxGeometry args={[5.8, 4.8, 0.05]} />
        <meshStandardMaterial
          color="#001a1a"
          emissive="#003333"
          emissiveIntensity={1}
          transparent
          opacity={0.9}
        />
      </mesh>

      <group position={[0, 2.5, 0.18]}>
        <mesh position={[0, 2.45, 0]}>
          <boxGeometry args={[6.0, 0.05, 0.01]} />
          <meshBasicMaterial color="#00ffcc" />
        </mesh>
        <mesh position={[0, -2.45, 0]}>
          <boxGeometry args={[6.0, 0.05, 0.01]} />
          <meshBasicMaterial color="#00ffcc" />
        </mesh>
        <mesh position={[-3, 0, 0]}>
          <boxGeometry args={[0.05, 5.0, 0.01]} />
          <meshBasicMaterial color="#00ffcc" />
        </mesh>
        <mesh position={[3, 0, 0]}>
          <boxGeometry args={[0.05, 5.0, 0.01]} />
          <meshBasicMaterial color="#00ffcc" />
        </mesh>
      </group>

      <Html
        transform
        distanceFactor={4}
        position={[0, 2.4, 0.22]}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          width: '540px',
          height: '440px',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontFamily: '"Orbitron", sans-serif',
          color: '#fff',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
            backgroundSize: '100% 4px, 3px 100%',
            pointerEvents: 'none',
            zIndex: 10
          }} />

          <h2 style={{
            fontSize: '32px',
            margin: '0 0 25px 0',
            color: '#00ffcc',
            fontFamily: '"Orbitron", sans-serif',
            textShadow: '0 0 15px #00ffcc',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}>
            Bảng Xếp Hạng
          </h2>

          <div style={{ width: '100%', flex: 1 }}>
            {leaderboard.map((entry, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 15px',
                marginBottom: '6px',
                background: i === 0 ? 'rgba(0, 255, 204, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                borderRadius: '4px',
                borderLeft: `4px solid ${i === 0 ? '#ffcc00' : (i < 3 ? '#00ffcc' : '#444')}`,
                fontSize: '20px',
                animation: `fadeIn 0.5s ease-out forwards ${i * 0.1}s`
              }}>
                <span style={{ width: '40px', fontWeight: 'bold', color: i < 3 ? '#00ffcc' : '#888' }}>
                  {i + 1}.
                </span>
                <div style={{
                  width: '30px',
                  height: '30px',
                  background: '#222',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '15px',
                  border: `1px solid ${i < 3 ? '#00ffcc' : '#444'}`,
                  overflow: 'hidden'
                }}>
                  {entry.avatar && entry.avatar.length > 5 ? (
                    <img src={entry.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avt" />
                  ) : (
                    <span style={{ fontSize: '16px' }}>{entry.avatar || '👤'}</span>
                  )}
                </div>
                <span style={{ flex: 1, fontWeight: '600', letterSpacing: '1px', fontSize: '18px' }}>
                  {entry.name}
                </span>
                <span style={{ color: '#00ffcc', fontWeight: 'bold', textShadow: '0 0 10px rgba(0,255,204,0.5)' }}>
                  {entry.time.toFixed(3)}s
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '15px', fontSize: '12px', color: '#444', letterSpacing: '2px' }}>
            SYSTEM ONLINE // DATA SYNCED
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateX(-10px); }
              to { opacity: 1; transform: translateX(0); }
            }
          `}</style>
        </div>
      </Html>

      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[4, 0.2, 1.5]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[-1.5, 1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 2]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[1.5, 1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 2]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
};


const PhysicsTrack = ({ vertices, indices, position }) => {
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
  finishOffset = null,
  startLinePos = null
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
          name.includes('circuit') ||
          name.includes('building') ||
          name.includes('bridge') ||
          name.includes('barrier') ||
          name.includes('mesh') ||
          name.includes('obj') ||
          name.includes('rail') ||
          name.includes('fence');

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

      {/* Cảm biến vạch đích — Chỉ kích hoạt khi đã qua đủ checkpoint */}
      {finishOffset && (
        <FinishSensor
          position={position}
          offset={finishOffset}
          startLinePos={startLinePos}
        />
      )}

      {/* Bảng thành tích */}
      <LeaderboardBoard
        position={[sensorOffset[0] - 10, 0, sensorOffset[2] - 5]}
        rotation={sensorRotation + 90}
      />

    </group>
  );
};

export default RaceTrack;
