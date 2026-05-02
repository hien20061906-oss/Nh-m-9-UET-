import React, { useContext } from 'react';
import { RaceContext, RACE_STATES } from './RaceManager';

const RaceUI = () => {
  const race = useContext(RaceContext);
  if (!race || race.raceState === RACE_STATES.IDLE) return null;

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(3, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: '"Outfit", sans-serif',
      color: 'white',
      textShadow: '0 2px 10px rgba(0,0,0,0.5)'
    }}>
      {/* Countdown Overlay */}
      {race.countdown && (
        <div style={{
          fontSize: '120px',
          fontWeight: '900',
          animation: 'pulse 1.5s infinite',
          color: race.countdown === 'GO!' ? '#00ff88' : '#ffcc00',
          position: 'fixed',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}>
          {race.countdown}
        </div>
      )}

      {/* Main Timer Display */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        padding: '15px 40px',
        borderRadius: '50px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        display: 'flex',
        gap: '40px',
        alignItems: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '2px' }}>Current</div>
          <div style={{ fontSize: '32px', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(race.currentTime)}
          </div>
        </div>

        {race.bestTime && (
          <div style={{ textAlign: 'center', opacity: 0.8 }}>
            <div style={{ fontSize: '12px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '2px', color: '#ffcc00' }}>Best</div>
            <div style={{ fontSize: '24px', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(race.bestTime)}
            </div>
          </div>
        )}
      </div>

      {/* Finish/Start Buttons (Clickable) */}
      <div style={{ marginTop: '20px', pointerEvents: 'auto', display: 'flex', gap: '10px' }}>
        {(race.raceState === RACE_STATES.RUNNING || race.raceState === RACE_STATES.FINISHED) && (
          <button 
            onClick={race.resetRace}
            style={{
              padding: '12px 30px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '30px',
              color: 'white',
              fontWeight: '700',
              cursor: 'pointer',
              backdropFilter: 'blur(5px)'
            }}
          >
            QUAY LẠI VẠCH XUẤT PHÁT
          </button>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
          20% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
          80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default RaceUI;
