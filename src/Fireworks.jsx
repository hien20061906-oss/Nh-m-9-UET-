import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const UET_POINTS = (() => {
  const points = [];
  const S = 2;
  const addPoint = (x, y, color) => points.push({ x: x * S, y: y * S, color: new THREE.Color(color) });

  for (let y = 0; y <= 5; y += 0.4) addPoint(0, y, '#ffffff');
  const red = '#ff1111';
  addPoint(3, 5, red); addPoint(5, 5, red);
  addPoint(2.5, 4.5, red); addPoint(5.5, 4.5, red);
  addPoint(2, 4, red); addPoint(4, 4, red); addPoint(6, 4, red);
  for (let y = 3; y <= 4; y += 0.5) { addPoint(2, y, red); addPoint(6, y, red); }
  addPoint(2.5, 2.5, red); addPoint(5.5, 2.5, red);
  addPoint(3, 1.5, red); addPoint(5, 1.5, red);
  addPoint(3.5, 0.5, red); addPoint(4.5, 0.5, red);
  addPoint(4, 0, red);

  for (let y = 1; y <= 5; y += 0.4) { addPoint(8, y, '#00aaff'); addPoint(10, y, '#00aaff'); }
  for (let x = 8.5; x <= 9.5; x += 0.4) addPoint(x, 0.5, '#00aaff');

  for (let y = 0; y <= 5; y += 0.4) addPoint(12, y, '#00ffaa');
  for (let x = 12.5; x <= 14; x += 0.4) { addPoint(x, 5, '#00ffaa'); addPoint(x, 0, '#00ffaa'); }
  for (let x = 12.5; x <= 13.5; x += 0.4) addPoint(x, 2.5, '#00ffaa');

  for (let x = 16; x <= 18; x += 0.4) addPoint(x, 5, '#ffff00');
  for (let y = 0; y <= 4.5; y += 0.4) addPoint(17, y, '#ffff00');

  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 18 + 5;
    points.push({ x: Math.cos(angle) * r + 9 * S, y: Math.sin(angle) * r + 2.5 * S, color: new THREE.Color('#ffffff') });
  }

  points.forEach(p => { p.x -= 18; p.y -= 5; });
  return points;
})();

const FireworkInstance = ({ position, onComplete }) => {
  const points = UET_POINTS;
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const timeRef = useRef(0); // ← useRef thay vì useState để không trigger re-render

  const particleData = useMemo(() => {
    return points.map(p => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = Math.random() * 40 + 10;
      return {
        targetX: p.x * 1.5,
        targetY: p.y * 1.5,
        targetZ: (Math.random() - 0.5) * 4,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.sin(phi) * Math.sin(theta) * speed,
        vz: Math.cos(phi) * speed,
        color: p.color
      };
    });
  }, [points]);

  const stateRef = useRef(0);
  const shootPos = useRef(new THREE.Vector3(position[0], position[1] + 2, position[2]));
  const shootVelocity = useRef(80);

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < points.length; i++) {
      meshRef.current.setColorAt(i, points[i].color);
    }
    meshRef.current.instanceColor.needsUpdate = true;
  }, [points]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta; // ← không setState nữa, chỉ mutate ref
    const t = timeRef.current;

    if (stateRef.current === 0) {
      shootPos.current.y += shootVelocity.current * delta;
      shootVelocity.current -= 50 * delta;

      dummy.position.copy(shootPos.current);
      dummy.scale.set(0.5, 2, 0.5);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(0, dummy.matrix);

      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      for (let i = 1; i < points.length; i++) meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.instanceMatrix.needsUpdate = true;

      if (shootVelocity.current <= 5) {
        stateRef.current = 1;
        timeRef.current = 0;
      }
    } else if (stateRef.current === 1) {
      // Pha nổ và xếp chữ
      const phase1 = 0.5; // Nổ tung tóe
      const phase2 = 1.2; // Thu về xếp chữ
      const phase3 = 4.0; // Rơi xuống và mờ dần

      let alpha = 1;

      for (let i = 0; i < points.length; i++) {
        const d = particleData[i];
        let curX, curY, curZ;

        if (t <= phase1) {
          // Bùng nổ ra ngoài
          const p = t / phase1;
          const easeOut = 1 - Math.pow(1 - p, 3);
          curX = shootPos.current.x + d.vx * easeOut;
          curY = shootPos.current.y + d.vy * easeOut;
          curZ = shootPos.current.z + d.vz * easeOut;
        } else if (t <= phase1 + phase2) {
          // Phép màu hút về hình dáng chữ
          const p = (t - phase1) / phase2;
          const easeInOut = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          
          const startX = shootPos.current.x + d.vx;
          const startY = shootPos.current.y + d.vy;
          const startZ = shootPos.current.z + d.vz;

          const targetX = shootPos.current.x + d.targetX;
          const targetY = shootPos.current.y + d.targetY;
          const targetZ = shootPos.current.z + d.targetZ;

          curX = startX + (targetX - startX) * easeInOut;
          curY = startY + (targetY - startY) * easeInOut;
          curZ = startZ + (targetZ - startZ) * easeInOut;
        } else {
          // Rơi xuống
          const p = (t - phase1 - phase2) / (phase3 - phase1 - phase2);
          alpha = Math.max(0, 1 - p); // Mờ dần

          const dropTime = t - phase1 - phase2;
          curX = shootPos.current.x + d.targetX;
          curY = shootPos.current.y + d.targetY - (dropTime * dropTime * 15);
          curZ = shootPos.current.z + d.targetZ;
        }

        dummy.position.set(curX, curY, curZ);
        // Hấp háy lấp lánh
        const twinkle = 0.5 + Math.sin(t * 20 + i) * 0.5;
        dummy.scale.setScalar(alpha * (0.8 + twinkle * 0.5));
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;

      if (t >= phase3 && onComplete) onComplete();
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, points.length]}>
      <sphereGeometry args={[0.6, 8, 8]} />
      {/* Sử dụng toneMapped={false} để phát sáng đẹp mắt */}
      <meshBasicMaterial toneMapped={false} transparent opacity={1} depthWrite={false} />
    </instancedMesh>
  );
};

export const FireworksLauncher = ({ position = [-15, 0, 10] }) => {
  const [fireworks, setFireworks] = useState([]);
  const [showPrompt, setShowPrompt] = useState(false);
  const showPromptRef = useRef(false);
  const { camera } = useThree();
  const pillarPos = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame(() => {
    const dist = camera.position.distanceTo(pillarPos);
    if (dist < 30 && !showPromptRef.current) {
      showPromptRef.current = true;
      setShowPrompt(true);
    } else if (dist >= 30 && showPromptRef.current) {
      showPromptRef.current = false;
      setShowPrompt(false);
    }
  });

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key.toLowerCase() === 'f') {
        if (camera.position.distanceTo(pillarPos) < 30) {
          const spawnPos = [position[0], position[1] + 2.5, position[2]];
          setFireworks(prev => [...prev, { id: Date.now() + Math.random(), pos: spawnPos }]);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [camera, pillarPos, position]);

  return (
    <group position={position}>
      {/* Thân bệ phóng */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[1.5, 2, 4, 16]} />
        <meshStandardMaterial color="#ff00ff" metalness={0.2} roughness={0.8} />
      </mesh>
      
      {/* Đèn tín hiệu trên bệ */}
      <mesh position={[0, 4.5, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial 
          color={showPrompt ? "#00ff00" : "#ff0000"} 
          emissive={showPrompt ? "#00ff00" : "#ff0000"} 
          emissiveIntensity={showPrompt ? 2 : 1} 
        />
      </mesh>

      {/* Bảng thông báo */}
      {showPrompt && (
        <Html position={[0, 4, 0]} center>
          <div style={{
            background: 'rgba(0, 0, 0, 0.75)',
            color: '#00ff00',
            padding: '10px 20px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '18px',
            fontWeight: 'bold',
            border: '2px solid #00ff00',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            textShadow: '0 0 10px #00ff00',
            boxShadow: '0 0 15px rgba(0,255,0,0.5)'
          }}>
            [F] BẮN PHÁO HOA
          </div>
        </Html>
      )}

      {/* Render mảng pháo hoa */}
      {fireworks.map(fw => (
        <FireworkInstance
          key={fw.id}
          position={fw.pos}
          onComplete={() => setFireworks(prev => prev.filter(f => f.id !== fw.id))}
        />
      ))}
    </group>
  );
};
