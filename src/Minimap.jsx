import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * TELEPORT LOCATIONS
 * Tọa độ các điểm trên map game.
 * Format: { name, position: [x, y, z], rotation: yaw_radians, icon, color }
 *
 * rotation = hướng xe sẽ quay mặt sau khi teleport (radians, trục Y)
 * Lấy cơ chế từ MiniDrive Map.js line 37-45 & Respawns.js
 */
export const TELEPORT_LOCATIONS = [
  { name: 'Spawn', position: [0, 1, 0], rotation: 0, icon: '🏠', color: '#00f2ff', mapPos: { x: 50, y: 50 } },
  { name: 'Đường Đua', position: [105, 1, -258], rotation: -Math.PI / 2, icon: '🏁', color: '#00ff88', mapPos: { x: 58, y: 30 } },
  { name: 'Khu VNU', position: [-50, 1, 80], rotation: 0, icon: '🏫', color: '#ff6b6b', mapPos: { x: 30, y: 65 } },
  { name: 'Khu UET', position: [60, 1, -100], rotation: -Math.PI / 2, icon: '🏛️', color: '#ffd93d', mapPos: { x: 62, y: 35 } },
  { name: 'GĐ4', position: [-80, 1, -60], rotation: Math.PI / 4, icon: '📚', color: '#c084fc', mapPos: { x: 22, y: 40 } },
];

/**
 * MinimapPlayerTracker — Component 3D chạy bên trong Canvas
 * Theo dõi vị trí xe và gửi ra ngoài qua CustomEvent
 * Lấy cơ chế từ MiniDrive Map.js line 147-165
 */
export const MinimapPlayerTracker = () => {
  const lastUpdate = useRef(0);

  useFrame((state) => {
    const now = performance.now();
    // Chỉ cập nhật mỗi 100ms để không tốn hiệu năng
    if (now - lastUpdate.current < 100) return;
    lastUpdate.current = now;

    const car = state.scene.getObjectByName('chassis-body-visual');
    if (!car) return;

    car.updateWorldMatrix(true, false);
    const pos = new THREE.Vector3();
    car.getWorldPosition(pos);

    window.dispatchEvent(new CustomEvent('minimap-player-update', {
      detail: {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        rotation: car.rotation.y
      }
    }));
  });

  return null;
};

/**
 * Minimap — Component UI góc màn hình
 * Lấy cơ chế từ MiniDrive Map.js:
 * - Player indicator xoay theo hướng xe (line 164)
 * - Location pins với tên tiếng Việt (line 37-45)
 * - Click vào location → Teleport (line 70-75)
 * - worldToMap coordinate conversion (line 131-144)
 */
const Minimap = () => {
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 0, rotation: 0 });
  const [expanded, setExpanded] = useState(false);
  const [hoveredLocation, setHoveredLocation] = useState(null);

  // Map dimensions
  const MAP_WORLD_SIZE = 800;
  const MAP_CENTER = { x: 50, z: -100 };

  // Lấy cơ chế worldToMap từ MiniDrive Map.js line 131-144
  const worldToMap = useCallback((worldX, worldZ) => {
    let x = (worldX - MAP_CENTER.x) / MAP_WORLD_SIZE;
    let y = (worldZ - MAP_CENTER.z) / MAP_WORLD_SIZE;
    x = Math.max(0, Math.min(1, x + 0.5));
    y = Math.max(0, Math.min(1, y + 0.5));
    return { x: x * 100, y: y * 100 };
  }, []);

  // Listen for player position updates
  useEffect(() => {
    const handler = (e) => {
      setPlayerPos({
        x: e.detail.x,
        z: e.detail.z,
        rotation: e.detail.rotation
      });
    };
    window.addEventListener('minimap-player-update', handler);
    return () => window.removeEventListener('minimap-player-update', handler);
  }, []);

  // Phím M để mở/đóng bản đồ
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'KeyM') {
        setExpanded(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Teleport handler — tự động hủy đua khi teleport ra ngoài đường đua
  const handleTeleport = useCallback((location) => {
    // Nếu đang đua mà teleport đi nơi khác (không phải đường đua) → hủy đua
    if (location.name !== 'Đường Đua') {
      window.dispatchEvent(new CustomEvent('race-force-end'));
    }
    window.dispatchEvent(new CustomEvent('teleport-start', {
      detail: {
        name: location.name,
        position: location.position,
        rotation: location.rotation
      }
    }));
    setExpanded(false);
  }, []);

  const playerMapPos = worldToMap(playerPos.x, playerPos.z);
  const mapSize = expanded ? 380 : 130; // Giảm kích thước mặc định xuống 130 (PC)

  return (
    <>
      {/* Minimap Container */}
      <div
        id="minimap-container"
        onClick={(e) => {
          if (e.target === e.currentTarget || e.target.classList.contains('minimap-bg')) {
            setExpanded(!expanded);
          }
        }}
        style={{
          position: 'fixed',
          top: expanded ? '50%' : '85px', // Mặc định ở trên bên trái
          left: expanded ? '50%' : '15px',
          transform: expanded ? 'translate(-50%, -50%)' : 'none',
          width: `${mapSize}px`,
          height: `${mapSize}px`,
          borderRadius: expanded ? '20px' : '12px',
          overflow: 'hidden',
          zIndex: expanded ? 2000 : 100,
          cursor: 'pointer',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '2px solid rgba(0, 242, 255, 0.4)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(0, 242, 255, 0.05)',
        }}
      >
        {/* Background */}
        <div className="minimap-bg" style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #1a2332 0%, #0d1821 40%, #1a1520 70%, #0f1a25 100%)',
        }} />

        {/* Grid overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,242,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,242,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: `${mapSize / 8}px ${mapSize / 8}px`,
          pointerEvents: 'none',
        }} />

        {/* Road indicators */}
        <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} viewBox="0 0 100 100">
          <path d="M 50 50 L 62 35" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" fill="none" strokeDasharray="2,2" />
          <path d="M 62 35 L 55 30" stroke="rgba(0,255,136,0.2)" strokeWidth="0.8" fill="none" strokeDasharray="2,2" />
          <path d="M 50 50 L 30 65" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" fill="none" strokeDasharray="2,2" />
          <path d="M 50 50 L 22 40" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" fill="none" strokeDasharray="2,2" />
        </svg>

        {/* Location Pins */}
        {TELEPORT_LOCATIONS.map((loc, i) => {
          const mapPos = loc.mapPos;
          const isHovered = hoveredLocation === i;

          return (
            <div
              key={loc.name}
              onClick={(e) => { e.stopPropagation(); handleTeleport(loc); }}
              onMouseEnter={() => setHoveredLocation(i)}
              onMouseLeave={() => setHoveredLocation(null)}
              style={{
                position: 'absolute',
                left: `${mapPos.x}%`,
                top: `${mapPos.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isHovered ? 20 : 10 + i,
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
              }}
            >
              {/* Pin dot */}
              <div style={{
                width: expanded ? '14px' : '8px',
                height: expanded ? '14px' : '8px',
                borderRadius: '50%',
                background: loc.color,
                border: `2px solid ${isHovered ? '#fff' : 'rgba(255,255,255,0.3)'}`,
                boxShadow: `0 0 ${isHovered ? '12px' : '6px'} ${loc.color}`,
                transition: 'all 0.2s ease',
                transform: isHovered ? 'scale(1.3)' : 'scale(1)',
              }} />

              {/* Label */}
              {(expanded || isHovered) && (
                <div style={{
                  position: 'absolute',
                  top: '-24px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  fontSize: expanded ? '11px' : '9px',
                  color: '#fff',
                  background: 'rgba(0,0,0,0.8)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: `1px solid ${loc.color}40`,
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  pointerEvents: 'none',
                }}>
                  {loc.icon} {loc.name}
                </div>
              )}
            </div>
          );
        })}

        {/* Player Indicator — xoay theo hướng xe */}
        <div style={{
          position: 'absolute',
          left: `${playerMapPos.x}%`,
          top: `${playerMapPos.y}%`,
          transform: `translate(-50%, -50%) rotate(${-playerPos.rotation}rad)`,
          zIndex: 30,
          pointerEvents: 'none',
          transition: 'left 0.1s linear, top 0.1s linear',
        }}>
          <div style={{
            width: 0,
            height: 0,
            borderLeft: `${expanded ? 6 : 4}px solid transparent`,
            borderRight: `${expanded ? 6 : 4}px solid transparent`,
            borderBottom: `${expanded ? 14 : 10}px solid #00f2ff`,
            filter: 'drop-shadow(0 0 4px #00f2ff)',
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: expanded ? '24px' : '16px',
            height: expanded ? '24px' : '16px',
            borderRadius: '50%',
            border: '1px solid rgba(0,242,255,0.4)',
            animation: 'minimapPulse 2s ease-out infinite',
          }} />
        </div>

        {/* Compass */}
        <div style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          color: 'rgba(255,255,255,0.4)',
          fontSize: expanded ? '12px' : '8px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          pointerEvents: 'none',
        }}>
          N
        </div>

        {/* Expand hint */}
        {!expanded && (
          <div style={{
            position: 'absolute',
            bottom: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '7px',
            fontFamily: '"Inter", sans-serif',
            letterSpacing: '1px',
            pointerEvents: 'none',
          }}>
            NHẤN M ĐỂ MỞ
          </div>
        )}

        {/* Close button when expanded */}
        {expanded && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 40,
            }}
          >
            ✕
          </button>
        )}

        {/* Title when expanded */}
        {expanded && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#00f2ff',
            fontSize: '14px',
            fontWeight: '900',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontFamily: '"Inter", sans-serif',
            textShadow: '0 0 10px rgba(0,242,255,0.5)',
            pointerEvents: 'none',
            zIndex: 40,
          }}>
            BẢN ĐỒ
          </div>
        )}

        {/* Instruction when expanded */}
        {expanded && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '10px',
            fontFamily: '"Inter", sans-serif',
            pointerEvents: 'none',
            zIndex: 40,
            whiteSpace: 'nowrap',
          }}>
            Click vào điểm để dịch chuyển
          </div>
        )}
      </div>

      {/* Expanded backdrop */}
      {expanded && (
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 1999,
          }}
        />
      )}

      <style>{`
        @keyframes minimapPulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
      `}</style>
    </>
  );
};

export default Minimap;
