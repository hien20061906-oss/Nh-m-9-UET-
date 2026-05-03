import React, { useContext, useEffect, useState } from 'react';
import { RaceContext, RACE_STATES } from './RaceManager';

/**
 * TimerDisplay — Hiển thị thời gian đua real-time
 * Format MM:SS.mmm giống MiniDrive CircuitArea timer
 */
const TimerDisplay = () => {
  const { raceState, currentTimeRef } = useContext(RaceContext);
  const [displayTime, setDisplayTime] = useState(0);

  useEffect(() => {
    let interval;
    if (raceState === RACE_STATES.RUNNING) {
      interval = setInterval(() => {
        setDisplayTime(currentTimeRef.current);
      }, 50);
    } else {
      setDisplayTime(currentTimeRef.current);
    }
    return () => clearInterval(interval);
  }, [raceState, currentTimeRef]);

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  return (
    <div style={{ 
      fontSize: '38px', 
      fontWeight: '900', 
      fontFamily: '"Inter", monospace',
      letterSpacing: '2px',
      textShadow: '0 0 20px rgba(0,242,255,0.5)',
      color: '#fff',
    }}>
      {formatTime(displayTime)}
    </div>
  );
};

/**
 * CheckpointProgress — Thanh tiến trình checkpoint
 */
const CheckpointProgress = () => {
  const { currentCheckpoint, totalCheckpoints } = useContext(RaceContext);
  const progress = Math.max(0, (currentCheckpoint + 1) / totalCheckpoints);
  const cpDisplay = currentCheckpoint + 1;

  return (
    <div style={{ width: '100%', marginTop: '10px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        fontFamily: '"Inter", sans-serif',
        color: 'rgba(255,255,255,0.6)',
        marginBottom: '4px',
        letterSpacing: '1px',
      }}>
        <span>CHECKPOINT</span>
        <span style={{ color: '#00ff88', fontWeight: '700' }}>
          {cpDisplay > 0 ? cpDisplay : 0} / {totalCheckpoints}
        </span>
      </div>

      <div style={{
        width: '100%',
        height: '4px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${progress * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #00f2ff, #00ff88)',
          borderRadius: '2px',
          transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 0 10px rgba(0,255,136,0.5)',
        }} />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '6px',
        padding: '0 2px',
      }}>
        {Array.from({ length: totalCheckpoints }).map((_, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: i <= currentCheckpoint ? '#00ff88' : 'rgba(255,255,255,0.15)',
              border: i === currentCheckpoint + 1 ? '2px solid #ffcc00' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: i <= currentCheckpoint ? '0 0 6px #00ff88' : 'none',
              transition: 'all 0.3s ease',
            }} />
            <span style={{
              fontSize: '7px',
              color: i <= currentCheckpoint ? '#00ff88' : 'rgba(255,255,255,0.3)',
              fontFamily: '"Inter", sans-serif',
              fontWeight: '600',
            }}>
              {i + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * RaceUI — HUD đua xe
 * Glassmorphism panels, checkpoint progress, restart/end buttons
 */
const RaceUI = () => {
  const { raceState, countdown, bestTime, resetRace, endRace, startRace } = useContext(RaceContext);

  if (raceState === RACE_STATES.IDLE) return null;

  // ĐUA LẠI → Teleport vào vạch xuất phát + bắt đầu đua lại luôn
  const handleRestartRace = () => {
    // 1. Reset state về IDLE trước
    resetRace();
    // 2. Teleport xe vào vạch xuất phát (giống khi nhấn E ở bảng)
    window.dispatchEvent(new CustomEvent('teleport-start', {
      detail: {
        name: 'Vạch Xuất Phát',
        position: [172, 1, -295],
        rotation: 0
      }
    }));
    // 3. Đợi teleport xong rồi bắt đầu đua lại
    setTimeout(() => {
      startRace();
    }, 1700); // Đợi TeleportOverlay hoàn tất (1600ms) + buffer
  };

  // KẾT THÚC → Teleport về bảng hiệu để xem thành tích
  const handleEndRace = () => {
    endRace();
    window.dispatchEvent(new CustomEvent('teleport-start', {
      detail: {
        name: 'Bảng Thành Tích',
        position: [99, 1, -258],
        rotation: -Math.PI/2
      }
    }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '20px',
      fontFamily: '"Inter", sans-serif',
      color: 'white',
      zIndex: 1000
    }}>
      {/* Main Race HUD Panel */}
      <div style={{
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(12px)',
        padding: '16px 28px',
        borderRadius: '16px',
        border: '1px solid rgba(0,242,255,0.2)',
        textAlign: 'center',
        minWidth: '240px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        {/* Race state label */}
        <div style={{ 
          fontSize: '10px', 
          color: raceState === RACE_STATES.RUNNING ? '#00ff88' : '#ffcc00',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          marginBottom: '4px',
          fontWeight: '700',
        }}>
          {raceState === RACE_STATES.RUNNING ? '⏱ ĐANG ĐUA' : 
           raceState === RACE_STATES.FINISHED ? '🏁 HOÀN THÀNH' :
           raceState === RACE_STATES.COUNTDOWN ? '⚡ CHUẨN BỊ' : ''}
        </div>

        <TimerDisplay />
        
        {bestTime && (
          <div style={{ 
            marginTop: '6px', 
            fontSize: '13px', 
            color: '#ffcc00',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>KỶ LỤC</span>
            {parseFloat(bestTime).toFixed(2)}s
          </div>
        )}



        {(raceState === RACE_STATES.RUNNING || raceState === RACE_STATES.FINISHED) && (
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px',
            pointerEvents: 'auto',
          }}>
            <button
              onClick={handleRestartRace}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'rgba(0,242,255,0.15)',
                border: '1px solid rgba(0,242,255,0.3)',
                color: '#00f2ff',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '700',
                fontFamily: '"Inter", sans-serif',
                letterSpacing: '1px',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(0,242,255,0.3)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(0,242,255,0.15)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              🔄 ĐUA LẠI
            </button>
            <button
              onClick={handleEndRace}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'rgba(255,68,68,0.15)',
                border: '1px solid rgba(255,68,68,0.3)',
                color: '#ff4444',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '700',
                fontFamily: '"Inter", sans-serif',
                letterSpacing: '1px',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255,68,68,0.3)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255,68,68,0.15)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              ✕ KẾT THÚC
            </button>
          </div>
        )}
      </div>

      {/* Countdown Overlay */}
      {countdown && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: countdown === 'GO!' ? '120px' : '160px',
          fontWeight: '900',
          color: countdown === 'GO!' ? '#00ff88' : '#ffffff',
          textShadow: countdown === 'GO!' 
            ? '0 0 60px rgba(0,255,136,0.8), 0 0 120px rgba(0,255,136,0.4)' 
            : '0 0 40px rgba(255,255,255,0.5)',
          fontFamily: '"Inter", sans-serif',
          letterSpacing: countdown === 'GO!' ? '10px' : '0',
          animation: 'countdownPop 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {countdown}
        </div>
      )}

      {/* Finish celebration */}
      {raceState === RACE_STATES.FINISHED && (
        <div style={{
          marginTop: '30px',
          background: 'linear-gradient(135deg, rgba(0,255,136,0.9), rgba(0,242,255,0.9))',
          color: '#000',
          padding: '20px 50px',
          borderRadius: '16px',
          fontSize: '32px',
          fontWeight: '900',
          letterSpacing: '4px',
          boxShadow: '0 0 60px rgba(0,255,136,0.4)',
          animation: 'finishBounce 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          🏆 FINISH!
        </div>
      )}

      <style>{`
        @keyframes countdownPop {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
          60% { transform: translate(-50%, -50%) scale(1.1); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes finishBounce {
          0% { transform: scale(0.5) translateY(20px); opacity: 0; }
          60% { transform: scale(1.05) translateY(-5px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default RaceUI;
