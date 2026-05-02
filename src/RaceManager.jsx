import React, { useState, useCallback, useRef, createContext, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

export const RACE_STATES = {
  IDLE: 'IDLE',
  COUNTDOWN: 'COUNTDOWN',
  RUNNING: 'RUNNING',
  FINISHED: 'FINISHED'
};

export const RaceContext = createContext();

const RaceManager = ({ children }) => {
  const [raceState, setRaceState] = useState(RACE_STATES.IDLE);
  const [leaderboard, setLeaderboard] = useState(() => {
    try {
      const saved = localStorage.getItem('race_leaderboard');
      return saved ? JSON.parse(saved) : [
        { name: 'CHAMPION', time: 25.42, avatar: '👤' },
        { name: 'SPEEDSTER', time: 28.15, avatar: '⚡' },
        { name: 'DRIFTER', time: 31.05, avatar: '🔥' }
      ];
    } catch (e) {
      console.error('Leaderboard parse error:', e);
      return [
        { name: 'CHAMPION', time: 25.42, avatar: '👤' },
        { name: 'SPEEDSTER', time: 28.15, avatar: '⚡' },
        { name: 'DRIFTER', time: 31.05, avatar: '🔥' }
      ];
    }
  });
  const [bestTime, setBestTime] = useState(leaderboard[0]?.time || null);
  const [countdown, setCountdown] = useState(null);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(-1);
  const [playerName, setPlayerName] = useState('PLAYER');
  const [playerAvatar, setPlayerAvatar] = useState('👤');
  const startTime = useRef(0);
  const currentTimeRef = useRef(0);
  
  const sounds = useRef({
    countdown1: new Audio('/sounds/circuit/countdown/Game Start Countdown 31-1.mp3'),
    countdown2: new Audio('/sounds/circuit/countdown/Game Start Countdown 31-2.mp3'),
    checkpoint: new Audio('/sounds/circuit/checkpoint/Win Score 1.mp3'),
    finish: new Audio('/sounds/circuit/finish/Big Win Fanfare 2.mp3'),
    applause: new Audio('/sounds/circuit/applause/huge win.mp3'),
  });

  const finishRace = useCallback(() => {
    setRaceState(prev => {
      if (prev !== RACE_STATES.RUNNING) return prev;
      
      const finalTime = (performance.now() - startTime.current) / 1000;
      currentTimeRef.current = finalTime;
      
      sounds.current.finish.play();
      sounds.current.applause.play();
      
      // Cập nhật bảng xếp hạng với tên và avatar hiện tại
      setLeaderboard(prevList => {
        const newList = [...prevList, { name: playerName, time: finalTime, avatar: playerAvatar }]
          .sort((a, b) => a.time - b.time)
          .slice(0, 10);
        localStorage.setItem('race_leaderboard', JSON.stringify(newList));
        return newList;
      });

      if (!bestTime || finalTime < bestTime) {
        setBestTime(finalTime);
      }
      return RACE_STATES.FINISHED;
    });
  }, [bestTime, playerName, playerAvatar]);

  const startRace = useCallback(() => {
    setRaceState(RACE_STATES.COUNTDOWN);
    setCountdown(3);
    sounds.current.countdown1.play();
    
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        sounds.current.countdown1.play();
      } else if (count === 0) {
        setCountdown('GO!');
        sounds.current.countdown2.play();
        setRaceState(RACE_STATES.RUNNING);
        startTime.current = performance.now();
        currentTimeRef.current = 0;
        clearInterval(interval);
        setTimeout(() => setCountdown(null), 1000);
      }
    }, 1500);
  }, []);

  const onCheckpointReached = useCallback((index) => {
    if (raceState !== RACE_STATES.RUNNING) return;
    if (index === currentCheckpoint + 1) {
      setCurrentCheckpoint(index);
      sounds.current.checkpoint.play();
    }
  }, [raceState, currentCheckpoint]);

  const resetRace = useCallback(() => {
    setRaceState(RACE_STATES.IDLE);
    currentTimeRef.current = 0;
    setCurrentCheckpoint(-1);
    setCountdown(null);
  }, []);

  // QUAN TRỌNG: Dùng useMemo để ngăn chặn việc re-render toàn bộ app khi context value thay đổi
  const contextValue = useMemo(() => ({
    raceState,
    currentTimeRef,
    startTime,
    bestTime,
    leaderboard,
    playerName,
    setPlayerName,
    playerAvatar,
    setPlayerAvatar,
    countdown,
    currentCheckpoint,
    startRace,
    resetRace,
    finishRace,
    onCheckpointReached
  }), [raceState, bestTime, countdown, currentCheckpoint, startRace, resetRace, finishRace, onCheckpointReached]);

  return (
    <RaceContext.Provider value={contextValue}>
      {children}
    </RaceContext.Provider>
  );
};

export const RaceTicker = () => {
  const { raceState, currentTimeRef, startTime } = React.useContext(RaceContext);
  useFrame(() => {
    if (raceState === RACE_STATES.RUNNING) {
      currentTimeRef.current = (performance.now() - startTime.current) / 1000;
    }
  });
  return null;
};

export default RaceManager;
