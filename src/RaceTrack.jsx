import React, { useMemo, useEffect, useContext, useState, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import { useTrimesh, useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { RaceContext } from './RaceManager';

const Checkpoint = ({ position, rotation, index, scale = [30, 15, 2] }) => {
  const { onCheckpointReached, currentCheckpoint } = useContext(RaceContext);
  const isTarget = currentCheckpoint === index - 1;
  const isReached = currentCheckpoint >= index;
  
  // Dùng biến tĩnh để tránh tạo object mới mỗi frame (tránh lag/GC)
  const carPos = useMemo(() => new THREE.Vector3(), []);
  const cpPos = useMemo(() => new THREE.Vector3(position[0], position[1], position[2]), [position]);

  useFrame((state) => {
    if (isReached) return;

    const car = state.scene.getObjectByName('chassis-body-visual');
    if (!car) return;

    car.updateWorldMatrix(true, false);
    car.getWorldPosition(carPos);

    const dist = carPos.distanceTo(cpPos);

    // Bán kính nhận diện Checkpoint lớn (40m) để đảm bảo không bị trượt
    if (dist < 40 && isTarget) {
      console.log(`Đã qua Checkpoint ${index + 1}!`);
      onCheckpointReached(index);
    }
  });

  return (
    <group position={[position[0], 0.01, position[2]]} rotation={rotation} visible={true}>
      {/* Vạch kẻ caro dưới đất cho checkpoint */}
      <CheckerboardPattern width={scale[0]} depth={scale[2]} repeatX={6} repeatY={1} />

      {/* Visual gate */}
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
const CheckerboardPattern = ({ width = 10, depth = 2, repeatX = 8, repeatY = 2 }) => {
  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Nền trắng
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // Ô đen
    ctx.fillStyle = '#000000';
    const step = size / 4;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(i * step, j * step, step, step);
        }
      }
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.anisotropy = 16;
    return tex;
  }, [repeatX, repeatY]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial map={texture} roughness={0.8} transparent opacity={0.9} />
    </mesh>
  );
};

const FinishSensor = ({ position, offset, radius = 6, startLinePos }) => {
  const { raceState, finishRace, currentCheckpoint, totalCheckpoints } = useContext(RaceContext);
  const hasLeftStart = useRef(false);

  // Dùng biến tĩnh để tránh tạo object mỗi frame
  const carPos = useMemo(() => new THREE.Vector3(), []);
  const finishPos = useMemo(() => {
    return startLinePos
      ? new THREE.Vector3(startLinePos[0], startLinePos[1], startLinePos[2])
      : new THREE.Vector3(offset[0], offset[1], offset[2]);
  }, [startLinePos, offset]);

  useEffect(() => {
    // Reset lại trạng thái "Rời khỏi vạch" bất cứ khi nào cuộc đua bắt đầu mới hoặc reset
    if (raceState === 'COUNTDOWN' || raceState === 'IDLE') {
      hasLeftStart.current = false;
      console.log("Reset trạng thái vòng đua cho lượt mới.");
    }
  }, [raceState]);

  // Visual: Luôn ép xuống mặt đất (y=0.01)
  const visualPos = startLinePos 
    ? [startLinePos[0], 0.01, startLinePos[2]] 
    : [offset[0], 0.01, offset[2]];

  // Checkpoint logic
  const isAllCheckpointsReached = totalCheckpoints === 0 || currentCheckpoint >= totalCheckpoints - 1;

  useFrame((state) => {
    if (raceState !== 'RUNNING') return;

    const car = state.scene.getObjectByName('chassis-body-visual');
    if (!car) return;

    car.updateWorldMatrix(true, false);
    car.getWorldPosition(carPos);

    const dist = carPos.distanceTo(finishPos);

    // 1. Logic "Rời khỏi vạch": Phải đi xa vạch ít nhất 20m mới được tính là đang chạy vòng đua
    if (!hasLeftStart.current) {
      if (dist > 20) {
        hasLeftStart.current = true;
        console.log("Đã rời khỏi vạch xuất phát, bắt đầu tính vòng đua!");
      }
      return;
    }

    // 2. Logic "Về đích": Phải quay lại vạch (dist < radius) VÀ phải qua đủ checkpoint
    if (dist < radius) {
      if (isAllCheckpointsReached) {
        console.log(`🏁 FINISH! Hoàn thành vòng đua!`);
        finishRace();
      }
    }
  });

  // Visual: Cổng sẽ sáng Xanh khi đủ điều kiện về đích
  const isActive = isAllCheckpointsReached && hasLeftStart.current;

  return (
    <group position={visualPos}>
      {/* Vạch kẻ caro dưới đất nhỏ gọn và thanh mảnh hơn */}
      <CheckerboardPattern width={radius * 1.8} depth={1.5} repeatX={6} repeatY={1} />

      {/* Cổng ánh sáng nhỏ gọn hơn */}
      <group position={[0, 2.25, 0]}>
        <mesh>
          <boxGeometry args={[radius * 2, 4.5, 0.2]} />
          <meshStandardMaterial 
            color={isActive ? '#00ff88' : '#ff4444'} 
            transparent 
            opacity={0.3} 
            emissive={isActive ? '#00ff88' : '#ff4444'}
            emissiveIntensity={isActive ? 5 : 1}
          />
        </mesh>
        
        {/* Chữ START/FINISH — Đảm bảo hướng chữ chuẩn */}
        <Html transform distanceFactor={10} position={[0, 0, 0.15]} rotation={[0, 0, 0]}>
          <div style={{
            color: isActive ? '#00ff88' : '#ff4444',
            fontSize: '80px',
            fontWeight: 'bold',
            fontFamily: 'Arial Black',
            textShadow: `0 0 20px ${isActive ? '#00ff88' : '#ff4444'}`,
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
            {isActive ? 'FINISH' : 'START'}
          </div>
        </Html>
      </group>

      {/* Đèn tín hiệu 2 bên */}
      <mesh position={[-radius, 2.25, 0]}>
        <boxGeometry args={[0.5, 4.5, 0.5]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[radius, 2.25, 0]}>
        <boxGeometry args={[0.5, 4.5, 0.5]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
};

const StartSensor = ({ position, onEnterTrack, radius = 5, offset = [0, 0, 0], uiScale = 1.0, rotation = 0 }) => {
  const { startRace, raceState } = useContext(RaceContext);
  const { setTotalCheckpoints } = useContext(RaceContext);
  const [isNear, setIsNear] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [carRef, setCarRef] = useState(null);
  const sensorRef = useRef();

  // Biến tĩnh tránh lag
  const carPos = useMemo(() => new THREE.Vector3(), []);
  const sensorWorldPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (raceState !== 'IDLE') {
      if (showConfirm) setShowConfirm(false);
      return;
    }

    const car = state.scene.getObjectByName('chassis-body-visual');
    if (!car) return;
    if (!carRef) setCarRef(car);

    car.updateWorldMatrix(true, false);
    car.getWorldPosition(carPos);

    // Lấy vị trí thế giới thực của sensor để so sánh khoảng cách
    if (sensorRef.current) {
      sensorRef.current.getWorldPosition(sensorWorldPos);
    }

    const dist = carPos.distanceTo(sensorWorldPos);

    if (dist < radius && !isNear) {
      setIsNear(true);
    }
    if (dist >= radius && isNear) {
      setIsNear(false);
      setShowConfirm(false); // Ẩn xác nhận khi rời xa
    }
  });

  // Bước 1: Click nút → hiện xác nhận
  const handleShowConfirm = useCallback(() => {
    if (raceState !== 'IDLE' || !isNear) return;
    setShowConfirm(true);
  }, [raceState, isNear]);

  // Bước 2: Xác nhận → bắt đầu đua
  const handleConfirmStart = useCallback(() => {
    if (raceState !== 'IDLE' || !isNear) return;
    setShowConfirm(false);
    onEnterTrack?.();
    setTimeout(() => {
      startRace();
    }, 100);
  }, [raceState, isNear, onEnterTrack, startRace]);

  // Hủy xác nhận
  const handleCancel = useCallback(() => {
    setShowConfirm(false);
  }, []);

  /**
   * Lắng nghe phím E để hiện xác nhận, Enter để xác nhận, Escape để hủy
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (raceState !== 'IDLE') return;
      if ((e.code === 'KeyE' || e.code === 'KeyF') && isNear && !showConfirm) {
        handleShowConfirm();
      } else if (e.code === 'Enter' && showConfirm) {
        handleConfirmStart();
      } else if (e.code === 'Escape' && showConfirm) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleShowConfirm, handleConfirmStart, handleCancel, raceState, isNear, showConfirm]);

  return (
    <>
      <group
        ref={sensorRef}
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

        {/* Vạch kẻ caro vạch xuất phát */}
        <CheckerboardPattern width={8} depth={2} repeatX={6} repeatY={2} />

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

              {isNear && !showConfirm && (
                <Html
                  transform
                  distanceFactor={3.5}
                  position={[0, -0.3, 0.4]}
                >
                  <div
                    onClick={handleShowConfirm}
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
                    Nhấn E để đua
                  </div>
                </Html>
              )}

              {/* Hộp thoại xác nhận */}
              {showConfirm && (
                <Html
                  transform
                  distanceFactor={3.5}
                  position={[0, -0.5, 0.4]}
                >
                  <div style={{
                    background: 'rgba(0,0,0,0.9)',
                    border: '2px solid #00ff88',
                    borderRadius: '12px',
                    padding: '15px 20px',
                    textAlign: 'center',
                    minWidth: '200px',
                  }}>
                    <div style={{ color: '#fff', fontSize: '14px', marginBottom: '10px', fontWeight: 'bold' }}>
                      Bạn muốn vào đua?
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <div
                        onClick={handleConfirmStart}
                        style={{
                          background: '#00ff88', color: 'black',
                          padding: '8px 18px', borderRadius: '20px',
                          fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
                          border: '1px solid black',
                        }}
                      >
                        ✅ Đua (Enter)
                      </div>
                      <div
                        onClick={handleCancel}
                        style={{
                          background: '#ff4444', color: 'white',
                          padding: '8px 18px', borderRadius: '20px',
                          fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
                          border: '1px solid #cc0000',
                        }}
                      >
                        ❌ Hủy (Esc)
                      </div>
                    </div>
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


// Thành phần vật lý - Được memo hóa để không bị khởi tạo lại khi state đua thay đổi
const PhysicsTrack = React.memo(({ vertices, indices, position }) => {
  useTrimesh(() => ({
    args: [vertices, indices],
    position,
    type: 'Static',
  }), useRef());
  return null;
});

// Thành phần chứa Model và Physics - Được memo để không bị re-render thừa
const StaticTrack = React.memo(({ scene, physData, position }) => {
  return (
    <>
      <primitive object={scene} />
      {physData?.physics && (
        <PhysicsTrack
          vertices={physData.physics.vertices}
          indices={physData.physics.indices}
          position={position}
        />
      )}
    </>
  );
});

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
  const { raceState, setTotalCheckpoints } = useContext(RaceContext);

  const physData = useMemo(() => {
    if (!scene) return null;

    const v = [];
    const indices = []; // Đổi tên để tránh trùng lặp

    const cpData = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        const name = child.name.toLowerCase();
        
        // Tự động phát hiện Checkpoint từ tên mesh trong GLB
        if (name.includes('checkpoint') || name.includes('gate') || name.includes('vach') || name === '1' || name === '2' || name === '3' || name.includes('marker')) {
          const idxMatch = name.match(/\d+/);
          const cpIndex = idxMatch ? parseInt(idxMatch[0]) : (name === '1' ? 1 : (name === '2' ? 2 : (name === '3' ? 3 : 0)));
          
          if (cpIndex > 0) {
            const worldPos = new THREE.Vector3();
            const worldQuat = new THREE.Quaternion();
            const worldScale = new THREE.Vector3();
            child.updateMatrixWorld(true);
            child.matrixWorld.decompose(worldPos, worldQuat, worldScale);
            
            const euler = new THREE.Euler().setFromQuaternion(worldQuat);
            
            cpData.push({
              position: [worldPos.x, worldPos.y, worldPos.z],
              rotation: [euler.x, euler.y, euler.z],
              scale: [worldScale.x * 25, worldScale.y * 15, worldScale.z * 5],
              index: cpIndex - 1 // Về index 0-based
            });
            
            if (name.includes('marker') || name.length <= 2) {
              child.visible = false;
            }
          }
        }

        child.castShadow = true;
        child.receiveShadow = true;

        const isCorePhysics = name.includes('road') ||
          name.includes('track') ||
          name.includes('wall') ||
          name.includes('circuit') ||
          name.includes('barrier') ||
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
                indices.push(geom.index.array[i] + startIdx);
              }
            } else {
              for (let i = 0; i < posAttr.count; i++) {
                indices.push(i + startIdx);
              }
            }
          }
        }
      }
    });

    const physicsData = v.length > 0 ? {
      vertices: new Float32Array(v),
      indices: new Uint32Array(indices)
    } : null;

    return {
      physics: physicsData,
      checkpoints: cpData.sort((a, b) => a.index - b.index)
    };
  }, [scene, scale]);

  // Cập nhật số lượng checkpoint vào manager sau khi render
  useEffect(() => {
    if (physData) {
      setTotalCheckpoints(physData.checkpoints.length);
    }
  }, [physData, setTotalCheckpoints]);

  return (
    <>
      <group position={position} scale={[scale, scale, scale]}>
        {/* Phần vật lý và Model - Tách biệt để tránh lag khi đua */}
        <StaticTrack scene={scene} physData={physData} position={position} />
        {/* Bảng hiệu Start/Entry */}
        <StartSensor 
          position={[0, 0, 0]} 
          onEnterTrack={onEnterTrack} 
          offset={sensorOffset} 
          radius={sensorRadius} 
          uiScale={uiScale} 
          rotation={sensorRotation} 
        />

        {/* Bảng thành tích */}
        <LeaderboardBoard
          position={[sensorOffset[0] - 10, 0, sensorOffset[2] - 5]}
          rotation={sensorRotation + 90}
        />

        {/* Render các Checkpoint */}
        {physData?.checkpoints.map((cp, i) => (
          <Checkpoint
            key={i}
            index={cp.index}
            position={cp.position}
            rotation={cp.rotation}
            scale={cp.scale}
            trackScale={1.0}
          />
        ))}
      </group>

      {/* Cảm biến vạch đích — Đặt NGOÀI group để tọa độ thế giới chuẩn 100% */}
      {finishOffset && (
        <FinishSensor
          position={[0, 0, 0]}
          offset={finishOffset}
          startLinePos={startLinePos}
        />
      )}
    </>
  );
};


export default RaceTrack;
