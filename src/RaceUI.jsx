import React, { useContext, useEffect, useState } from 'react';
import { RaceContext, RACE_STATES } from './RaceManager';

const TimerDisplay = () => {
  const { raceState, currentTimeRef } = useContext(RaceContext);
  const [displayTime, setDisplayTime] = useState(0);

  useEffect(() => {
    let interval;
    if (raceState === RACE_STATES.RUNNING) {
      interval = setInterval(() => {
        setDisplayTime(currentTimeRef.current);
      }, 50); // Cập nhật UI mỗi 50ms là đủ mượt và cực nhẹ
    } else {
      setDisplayTime(currentTimeRef.current);
    }
    return () => clearInterval(interval);
  }, [raceState, currentTimeRef]);

  return (
    <div style={{ fontSize: '48px', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
      {displayTime.toFixed(2)}s
    </div>
  );
};

const RaceUI = () => {
  const { raceState, countdown, bestTime } = useContext(RaceContext);

  if (raceState === RACE_STATES.IDLE) return null;

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
      paddingTop: '50px',
      fontFamily: 'monospace',
      color: 'white',
      zIndex: 1000
    }}>
      {/* Timer Section */}
      <div style={{
        background: 'rgba(0,0,0,0.7)',
        padding: '20px 40px',
        borderRadius: '15px',
        border: '2px solid #00ff88',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '14px', color: '#00ff88', marginBottom: '5px' }}>TIME</div>
        <TimerDisplay />
        
        {bestTime && (
          <div style={{ marginTop: '10px', fontSize: '18px', color: '#ffcc00' }}>
            BEST: {parseFloat(bestTime).toFixed(2)}s
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
          fontSize: '150px',
          fontWeight: 'bold',
          color: countdown === 'GO!' ? '#00ff88' : '#ffffff',
          textShadow: '0 0 30px rgba(0,0,0,0.8)',
          animation: 'pulse 0.5s infinite alternate'
        }}>
          {countdown}
        </div>
      )}

      {/* Finish Message */}
      {raceState === RACE_STATES.FINISHED && (
        <div style={{
          marginTop: '100px',
          background: 'rgba(0, 255, 136, 0.9)',
          color: 'black',
          padding: '30px 60px',
          borderRadius: '20px',
          fontSize: '40px',
          fontWeight: 'bold',
          boxShadow: '0 0 50px rgba(0,255,136,0.5)',
          animation: 'bounce 1s infinite'
        }}>
          FINISH!
        </div>
      )}

      <style>{`
        @keyframes pulse {
          from { transform: translate(-50%, -50%) scale(1); }
          to { transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default RaceUI;
