import React, { useState, useEffect, useCallback } from 'react';
import { playSound } from './SoundManager';

/**
 * TeleportOverlay — Hiệu ứng chuyển cảnh khi teleport
 * Lấy cơ chế từ MiniDrive 2025 Overlay.js:
 * - Fade-to-black trước khi di chuyển
 * - Hiện tên địa điểm đang đến
 * - Fade-in sau khi xe đã reset xong
 */
const TeleportOverlay = () => {
  const [active, setActive] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | fadeIn | hold | fadeOut

  const handleTeleportStart = useCallback((e) => {
    const { name } = e.detail;
    setLocationName(name || 'Đang di chuyển...');
    setActive(true);
    setPhase('fadeIn');
    playSound('swoosh', 0.5);

    // Phase 1: Fade to black (500ms)
    setTimeout(() => {
      setPhase('hold');
      // Dispatch actual teleport after screen is black
      window.dispatchEvent(new CustomEvent('teleport-execute', { detail: e.detail }));
    }, 500);

    // Phase 2: Hold (600ms for physics to settle)
    setTimeout(() => {
      setPhase('fadeOut');
    }, 1100);

    // Phase 3: Fade out (500ms)
    setTimeout(() => {
      setPhase('idle');
      setActive(false);
    }, 1600);
  }, []);

  useEffect(() => {
    window.addEventListener('teleport-start', handleTeleportStart);
    return () => window.removeEventListener('teleport-start', handleTeleportStart);
  }, [handleTeleportStart]);

  if (!active) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9000,
      pointerEvents: phase === 'idle' ? 'none' : 'all',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      background: '#000',
      opacity: phase === 'fadeIn' ? 1 : phase === 'hold' ? 1 : phase === 'fadeOut' ? 0 : 0,
      transition: phase === 'fadeIn' ? 'opacity 0.5s ease-in' :
                  phase === 'fadeOut' ? 'opacity 0.5s ease-out' : 'none',
    }}>
      {/* Radial glow effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(0,242,255,0.08) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      {/* Location name */}
      <div style={{
        color: '#00f2ff',
        fontSize: '14px',
        letterSpacing: '6px',
        textTransform: 'uppercase',
        fontFamily: '"Inter", monospace',
        marginBottom: '12px',
        opacity: phase === 'hold' ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>
        ĐANG DI CHUYỂN ĐẾN
      </div>

      <div style={{
        color: '#fff',
        fontSize: '36px',
        fontWeight: '900',
        letterSpacing: '4px',
        textTransform: 'uppercase',
        fontFamily: '"Inter", sans-serif',
        textShadow: '0 0 30px rgba(0,242,255,0.5)',
        opacity: phase === 'hold' ? 1 : 0,
        transform: phase === 'hold' ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.4s ease',
      }}>
        {locationName}
      </div>

      {/* Loading dots */}
      <div style={{
        marginTop: '20px',
        display: 'flex',
        gap: '8px',
        opacity: phase === 'hold' ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#00f2ff',
            animation: `teleportDot 1s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes teleportDot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default TeleportOverlay;
