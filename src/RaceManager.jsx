import React, { useState, useEffect, useRef, useCallback, createContext } from 'react';
import { useFrame } from '@react-three/fiber';

export const RACE_STATES = {
  IDLE: 'IDLE',
  COUNTDOWN: 'COUNTDOWN',
  RUNNING: 'RUNNING',
  FINISHED: 'FINISHED',
};

// Tách riêng 2 Context để tránh re-render toàn bộ map khi đồng hồ chạy
export const RaceStateContext = createContext(null);
export const RaceTimerContext = createContext(null);

const RaceManager = ({ children }) => {
  const [raceState, setRaceState] = useState(RACE_STATES.IDLE);
  const [currentTime, setCurrentTime] = useState(0);
  const [bestTime, setBestTime] = useState(parseFloat(localStorage.getItem('race_best_time')) || null);
  const [countdown, setCountdown] = useState(null);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(-1);
  const startTime = useRef(0);
  
  const sounds = useRef({
    countdown1: new Audio('/sounds/circuit/countdown/Game Start Countdown 31-1.mp3'),
    countdown2: new Audio('/sounds/circuit/countdown/Game Start Countdown 31-2.mp3'),
    checkpoint: new Audio('/sounds/circuit/checkpoint/Win Score 1.mp3'),
    finish: new Audio('/sounds/circuit/finish/Big Win Fanfare 2.mp3'),
    applause: new Audio('/sounds/circuit/applause/huge win.mp3'),
  });

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
        clearInterval(interval);
        setTimeout(() => setCountdown(null), 1000);
      }
    }, 1000); // Chỉnh về 1 giây cho chuẩn
  }, []);

  const finishRace = useCallback(() => {
    const finalTime = (performance.now() - startTime.current) / 1000;
    setRaceState(RACE_STATES.FINISHED);
    sounds.current.finish.play();
    sounds.current.applause.play();
    
    if (!bestTime || finalTime < bestTime) {
      setBestTime(finalTime);
      localStorage.setItem('race_best_time', finalTime.toString());
    }
  }, [bestTime]);

  const onCheckpointReached = useCallback((index) => {
    if (raceState !== RACE_STATES.RUNNING) return;
    if (index === currentCheckpoint + 1) {
      setCurrentCheckpoint(index);
      sounds.current.checkpoint.play();
      if (index === 99) finishRace();
    }
  }, [raceState, currentCheckpoint, finishRace]);

  const resetRace = useCallback(() => {
    setRaceState(RACE_STATES.IDLE);
    setCurrentTime(0);
    setCurrentCheckpoint(-1);
    setCountdown(null);
  }, []);

  return (
    <RaceStateContext.Provider value={{
      raceState,
      bestTime,
      countdown,
      currentCheckpoint,
      startRace,
      finishRace,
      resetRace,
      onCheckpointReached,
      startTime // Cần cho RaceTicker
    }}>
      <RaceTimerContext.Provider value={{ currentTime, setCurrentTime }}>
        {children}
      </RaceTimerContext.Provider>
    </RaceStateContext.Provider>
  );
};

export const RaceTicker = () => {
  const { raceState, startTime } = React.useContext(RaceStateContext);
  const { setCurrentTime } = React.useContext(RaceTimerContext);
  
  useFrame(() => {
    if (raceState === RACE_STATES.RUNNING) {
      setCurrentTime((performance.now() - startTime.current) / 1000);
    }
  });
  return null;
};

// Giữ lại RaceContext cũ để không làm lỗi các file khác, nhưng sẽ trỏ về RaceStateContext
export const RaceContext = RaceStateContext;
export default RaceManager;
