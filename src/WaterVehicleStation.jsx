import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

export const WaterVehicleStation = ({ position = [0, 0, 0], onOpenShop }) => {
  const [hovered, setHovered] = useState(false);
  const [isNear, setIsNear] = useState(false);
  const group = useRef();
  const lightRef = useRef();

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    // Hiệu ứng nhấp nháy cho đèn trên cột
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + Math.sin(time * 3) * 0.5;
    }
    // Hiệu ứng lơ lửng nhẹ cho chữ
    if (group.current) {
      group.current.position.y = position[1] + Math.sin(time * 2) * 0.2;
    }

    // Kiểm tra khoảng cách với người chơi (Camera)
    const dist = state.camera.position.distanceTo(new THREE.Vector3(...position));
    if (dist < 8) {
      if (!isNear) setIsNear(true);
    } else {
      if (isNear) setIsNear(false);
    }
  });

  // Lắng nghe phím E
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'e' && isNear && onOpenShop) {
        onOpenShop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNear, onOpenShop]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (onOpenShop) onOpenShop();
  };

  return (
    <group position={position}>
      {/* Khối tương tác chính (Cột) */}
      <mesh 
        position={[0, 2, 0]} 
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        {/* Thân cột */}
        <cylinderGeometry args={[0.4, 0.6, 4, 16]} />
        <meshStandardMaterial 
          color={hovered ? "#00ffcc" : "#0055ff"} 
          metalness={0.8} 
          roughness={0.2} 
          emissive={hovered ? "#004433" : "#000000"}
        />
      </mesh>
      
      {/* Quả cầu năng lượng/Đèn trên đỉnh cột */}
      <mesh position={[0, 4.2, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial color={hovered ? "#ffffff" : "#00ffcc"} />
        <pointLight ref={lightRef} color="#00ffcc" distance={10} />
      </mesh>

      {/* Nhãn hướng dẫn khi lại gần */}
      {isNear && (
        <Html position={[0, 5, 0]} center distanceFactor={15}>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: '#00ffcc',
            padding: '8px 15px',
            borderRadius: '20px',
            border: '2px solid #00ffcc',
            fontFamily: 'Orbitron, sans-serif',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 0 15px #00ffcc',
            animation: 'pulse 1s infinite alternate'
          }}>
            Nhấn <strong style={{ color: '#fff', fontSize: '1.2em' }}>[E]</strong> để mở Cửa hàng Bến Tàu
          </div>
          <style>{`
            @keyframes pulse {
              from { opacity: 0.7; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1.05); }
            }
          `}</style>
        </Html>
      )}

      {/* Bảng chữ nổi 3D */}
      <group ref={group}>
        <Text
          position={[0, 6, 0]}
          fontSize={0.8}
          color="#00ffcc"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          DOCK STATION
        </Text>
      </group>
    </group>
  );
};
