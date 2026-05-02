import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';

export const RACE_STATES = {
  IDLE: 'IDLE',
  COUNTDOWN: 'COUNTDOWN',
  RUNNING: 'RUNNING',
  FINISHED: 'FINISHED',
};

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
    }, 1500);
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
      
      // If it's the last checkpoint (assuming index 10 for example, we'll calibrate this)
      // For now, let's say index 99 is finish
      if (index === 99) {
        finishRace();
      }
    }
  }, [raceState, currentCheckpoint, finishRace]);

  // REMOVED useFrame from here because RaceManager is used outside Canvas
  // We will use a separate RaceTicker component inside the Canvas instead.

  const resetRace = useCallback(() => {
    setRaceState(RACE_STATES.IDLE);
    setCurrentTime(0);
    setCurrentCheckpoint(-1);
    setCountdown(null);
  }, []);

  return (
    <RaceContext.Provider value={{
      raceState,
      currentTime,
      setCurrentTime, // Export this so RaceTicker can update it
      startTime,     // Export this too
      bestTime,
      countdown,
      currentCheckpoint,
      startRace,
      resetRace,
      onCheckpointReached
    }}>
      {children}
    </RaceContext.Provider>
  );
};

export const RaceTicker = () => {
  const { raceState, setCurrentTime, startTime } = React.useContext(RaceContext);
  useFrame(() => {
    if (raceState === RACE_STATES.RUNNING) {
      setCurrentTime((performance.now() - startTime.current) / 1000);
    }
  });
  return null;
};

export const RaceContext = React.createContext(null);
export default RaceManager;
