import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ─── SOUND REGISTRY ──────────────────────────────────────────────────────────
// Tất cả file âm thanh game, chia theo nhóm
const SOUND_PATHS = {
  // Xe cộ
  engine: '/sounds/vehicle/engine/muscle car engine loop idle.mp3',
  rotor: '/sounds/vehicle/spin/41051 Glass stone turning loop 09-full.mp3',
  nitro: '/sounds/vehicle/energy/Energy_-_force_field_8_loop.mp3',

  // Va chạm
  hit1: '/sounds/hits/defaults/Impact Soft 01.mp3',
  hit2: '/sounds/hits/defaults/Impact Soft 02.mp3',
  hit3: '/sounds/hits/defaults/Impact Soft 03.mp3',
  hit4: '/sounds/hits/defaults/Impact Soft 04.mp3',
  hitMetal: '/sounds/hits/metal/Metal Clip Hit.mp3',

  // Thời tiết
  rain: '/sounds/rain/soundjay_rain-on-leaves_main-01.mp3',
  wind: '/sounds/wind/13582-wind-in-forest-loop.mp3',
  thunderNear1: '/sounds/thunder/near/THUNDER_GEN-HDF-23300.mp3',
  thunderNear2: '/sounds/thunder/near/ThunderSharpStrikingRumblingCrackling_JMDKp_04.mp3',
  thunderNear3: '/sounds/thunder/near/Lightning-Streak-with-Thunder-Crash_TTX028903.mp3',
  thunderDistant1: '/sounds/thunder/distant/Thunder32GentleCr SIG014001.mp3',
  thunderDistant2: '/sounds/thunder/distant/Thunder44LowRippl SIG015201.mp3',
  crickets: '/sounds/crickets/Crickets.mp3',
  owl: '/sounds/owl/OwlHootingReverberantSeveral_Rik8a_03.mp3',
  wolf: '/sounds/wolf/TimberWolvesGroupHowlingSomeWhimpering_S2h0E_04.mp3',
  bird1: '/sounds/birdTweets/20711 finch bird isolated tweet-full.mp3',
  bird2: '/sounds/birdTweets/24074 small bird tweet calling-full-1.mp3',
  bird3: '/sounds/birdTweets/30673 Yellowhammer bird tweet 3-full.mp3',

  // UI
  click: '/sounds/mecanism/click.mp3',
  ding: '/sounds/ding/Cash Register 03.mp3',
  achievementReward: '/sounds/achievements/Money Reward 2.mp3',
  reveal: '/sounds/reveal/reveal-1.mp3',

  // Teleport
  swoosh: '/sounds/swoosh/Swoosh 05.mp3',

  // Nhạc nền
  music1: '/sounds/musics/Baguira.mp3',
  music2: '/sounds/musics/Boy.mp3',
  music3: '/sounds/musics/Sudo.mp3',
};

// ─── GLOBAL AUDIO CACHE ─────────────────────────────────────────────────────
const audioCache = {};
let globalMuted = false;
let globalVolume = 1.0;

function getAudio(name) {
  if (!SOUND_PATHS[name]) return null;
  if (!audioCache[name]) {
    audioCache[name] = new Audio(SOUND_PATHS[name]);
    audioCache[name].preload = 'auto';
  }
  return audioCache[name];
}

// ─── PUBLIC HELPERS ──────────────────────────────────────────────────────────

/**
 * Phát âm thanh 1 lần (one-shot)
 * @param {string} name - Tên âm thanh trong SOUND_PATHS
 * @param {number} volume - Volume 0.0 → 1.0
 */
export function playSound(name, volume = 0.5) {
  if (globalMuted) return;
  try {
    const audio = getAudio(name);
    if (!audio) return;
    // Clone để có thể phát chồng lên nhau
    const clone = audio.cloneNode();
    clone.volume = Math.min(1, volume * globalVolume);
    clone.play().catch(() => {});
  } catch (e) {}
}

/**
 * Phát random 1 trong nhiều âm thanh
 */
export function playRandomSound(names, volume = 0.5) {
  const name = names[Math.floor(Math.random() * names.length)];
  playSound(name, volume);
}

/**
 * Bắt đầu loop âm thanh, trả về audio element để điều khiển
 */
export function startLoop(name, volume = 0.3) {
  const audio = getAudio(name);
  if (!audio) return null;
  audio.loop = true;
  audio.volume = globalMuted ? 0 : Math.min(1, volume * globalVolume);
  audio.play().catch(() => {});
  return audio;
}

/**
 * Dừng loop âm thanh
 */
export function stopLoop(name) {
  const audio = audioCache[name];
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

/**
 * Fade volume của một audio element
 */
export function fadeVolume(audio, targetVol, durationMs = 1000) {
  if (!audio) return;
  const startVol = audio.volume;
  const diff = targetVol - startVol;
  const steps = 20;
  const stepTime = durationMs / steps;
  let step = 0;
  const interval = setInterval(() => {
    step++;
    const t = step / steps;
    audio.volume = Math.max(0, Math.min(1, startVol + diff * t));
    if (step >= steps) {
      clearInterval(interval);
      if (targetVol <= 0) {
        audio.pause();
      }
    }
  }, stepTime);
}

export function setGlobalMuted(muted) {
  globalMuted = muted;
  // Mute/unmute tất cả audio đang chạy
  Object.values(audioCache).forEach(audio => {
    if (muted) {
      audio.volume = 0;
    }
  });
}

export function isGlobalMuted() {
  return globalMuted;
}

export { SOUND_PATHS };

// ─── BACKGROUND MUSIC COMPONENT ─────────────────────────────────────────────
const MUSIC_TRACKS = [
  { name: 'music1', title: 'Baguira' },
  { name: 'music2', title: 'Boy' },
  { name: 'music3', title: 'Sudo' },
];

export function BackgroundMusic({ masterMuted }) {
  const [trackIndex, setTrackIndex] = useState(() => Math.floor(Math.random() * MUSIC_TRACKS.length));
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.15);
  const audioRef = useRef(null);
  const hasInteracted = useRef(false);

  // Khởi tạo audio
  useEffect(() => {
    const track = MUSIC_TRACKS[trackIndex];
    const audio = getAudio(track.name);
    if (!audio) return;

    audio.loop = true;
    audio.volume = masterMuted ? 0 : musicVolume;
    audioRef.current = audio;

    if (hasInteracted.current && isPlaying && !masterMuted) {
      audio.play().catch(() => {});
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [trackIndex]);

  // Phản ứng khi master mute thay đổi
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = masterMuted ? 0 : musicVolume;
    }
  }, [masterMuted, musicVolume]);

  const togglePlay = useCallback(() => {
    hasInteracted.current = true;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.volume = masterMuted ? 0 : musicVolume;
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  }, [isPlaying, masterMuted, musicVolume]);

  const nextTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setTrackIndex(prev => (prev + 1) % MUSIC_TRACKS.length);
    if (isPlaying) {
      // Sẽ auto-play trong useEffect
      hasInteracted.current = true;
    }
  }, [isPlaying]);

  const handleVolumeChange = useCallback((e) => {
    const vol = parseFloat(e.target.value);
    setMusicVolume(vol);
    if (audioRef.current && !masterMuted) {
      audioRef.current.volume = vol;
    }
  }, [masterMuted]);

  // Auto chuyển bài khi hết nhạc
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => nextTrack();
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [nextTrack]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: 150,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(10px)',
      borderRadius: '30px',
      padding: '6px 12px',
      border: '1px solid rgba(255,255,255,0.15)',
    }}>
      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        style={{
          background: 'none', border: 'none', color: '#fff',
          fontSize: '18px', cursor: 'pointer', padding: '4px',
          display: 'flex', alignItems: 'center',
        }}
        title={isPlaying ? 'Tạm dừng' : 'Phát nhạc'}
      >
        {isPlaying ? '⏸️' : '▶️'}
      </button>

      {/* Next track */}
      <button
        onClick={nextTrack}
        style={{
          background: 'none', border: 'none', color: '#fff',
          fontSize: '14px', cursor: 'pointer', padding: '4px',
          display: 'flex', alignItems: 'center',
        }}
        title="Bài tiếp"
      >
        ⏭️
      </button>

      {/* Track name */}
      <span style={{
        color: 'rgba(255,255,255,0.6)', fontSize: '10px',
        maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', fontFamily: '"Inter", sans-serif',
      }}>
        {MUSIC_TRACKS[trackIndex].title}
      </span>

      {/* Volume slider */}
      <input
        type="range"
        min="0" max="0.5" step="0.01"
        value={musicVolume}
        onChange={handleVolumeChange}
        style={{
          width: '50px', height: '3px',
          appearance: 'none', background: 'rgba(255,255,255,0.2)',
          borderRadius: '2px', cursor: 'pointer', outline: 'none',
        }}
        title="Âm lượng nhạc"
      />
    </div>
  );
}

// ─── WEATHER AUDIO COMPONENT ────────────────────────────────────────────────
/**
 * WeatherAudio — Âm thanh môi trường theo thời tiết
 * Chạy hoàn toàn ngoài Canvas (DOM component)
 */
export function WeatherAudio({ weather, masterMuted }) {
  const rainAudio = useRef(null);
  const windAudio = useRef(null);
  const cricketsAudio = useRef(null);
  const thunderTimer = useRef(null);
  const ambientTimer = useRef(null);
  const prevWeatherLabel = useRef('');

  // Xác định loại thời tiết hiện tại
  const weatherType = useMemo(() => {
    if (!weather || !weather.label) return 'sunny';
    const label = weather.label.toLowerCase();
    if (label.includes('mưa')) return 'rainy';
    if (label.includes('tuyết')) return 'snowy';
    if (label.includes('sương')) return 'foggy';
    if (label.includes('đêm')) return 'night';
    return 'sunny';
  }, [weather?.label]);

  useEffect(() => {
    // Tránh chạy lại nếu weather type không đổi
    if (prevWeatherLabel.current === weatherType) return;
    prevWeatherLabel.current = weatherType;

    // Cleanup trước
    clearInterval(thunderTimer.current);
    clearInterval(ambientTimer.current);

    const safeVol = (v) => masterMuted ? 0 : v;

    // ─── Rain loop ───
    if (weatherType === 'rainy') {
      if (!rainAudio.current) {
        rainAudio.current = getAudio('rain');
        if (rainAudio.current) {
          rainAudio.current.loop = true;
        }
      }
      if (rainAudio.current) {
        rainAudio.current.volume = safeVol(0.25);
        rainAudio.current.play().catch(() => {});
      }
    } else {
      if (rainAudio.current) {
        fadeVolume(rainAudio.current, 0, 2000);
        rainAudio.current = null;
        // Re-cache for next time
        delete audioCache['rain'];
      }
    }

    // ─── Wind loop ───
    if (weatherType === 'foggy' || weatherType === 'snowy') {
      if (!windAudio.current) {
        windAudio.current = getAudio('wind');
        if (windAudio.current) {
          windAudio.current.loop = true;
        }
      }
      if (windAudio.current) {
        windAudio.current.volume = safeVol(weatherType === 'snowy' ? 0.15 : 0.25);
        windAudio.current.play().catch(() => {});
      }
    } else {
      if (windAudio.current) {
        fadeVolume(windAudio.current, 0, 2000);
        windAudio.current = null;
        delete audioCache['wind'];
      }
    }

    // ─── Crickets loop (night) ───
    if (weatherType === 'night') {
      if (!cricketsAudio.current) {
        cricketsAudio.current = getAudio('crickets');
        if (cricketsAudio.current) {
          cricketsAudio.current.loop = true;
        }
      }
      if (cricketsAudio.current) {
        cricketsAudio.current.volume = safeVol(0.15);
        cricketsAudio.current.play().catch(() => {});
      }
    } else {
      if (cricketsAudio.current) {
        fadeVolume(cricketsAudio.current, 0, 2000);
        cricketsAudio.current = null;
        delete audioCache['crickets'];
      }
    }

    // ─── Thunder random (rainy) ───
    if (weatherType === 'rainy') {
      const playThunder = () => {
        if (masterMuted) return;
        const thunderSounds = ['thunderNear1', 'thunderNear2', 'thunderNear3', 'thunderDistant1', 'thunderDistant2'];
        playRandomSound(thunderSounds, 0.3);
      };
      // Phát sấm đầu tiên sau 5-15s
      const firstDelay = 5000 + Math.random() * 10000;
      const firstTimeout = setTimeout(playThunder, firstDelay);
      // Sau đó random 15-35s
      thunderTimer.current = setInterval(() => {
        playThunder();
      }, 15000 + Math.random() * 20000);

      return () => {
        clearTimeout(firstTimeout);
        clearInterval(thunderTimer.current);
      };
    }

    // ─── Night ambient (owl, wolf) ───
    if (weatherType === 'night') {
      ambientTimer.current = setInterval(() => {
        if (masterMuted) return;
        const nightSounds = ['owl', 'wolf'];
        playRandomSound(nightSounds, 0.2);
      }, 20000 + Math.random() * 20000);
    }

    // ─── Sunny ambient (birds) ───
    if (weatherType === 'sunny') {
      ambientTimer.current = setInterval(() => {
        if (masterMuted) return;
        const birdSounds = ['bird1', 'bird2', 'bird3'];
        playRandomSound(birdSounds, 0.15);
      }, 10000 + Math.random() * 15000);
    }

    return () => {
      clearInterval(thunderTimer.current);
      clearInterval(ambientTimer.current);
    };
  }, [weatherType, masterMuted]);

  // Cleanup tất cả khi unmount
  useEffect(() => {
    return () => {
      clearInterval(thunderTimer.current);
      clearInterval(ambientTimer.current);
      [rainAudio, windAudio, cricketsAudio].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current.currentTime = 0;
        }
      });
    };
  }, []);

  return null; // Không render gì
}

// ─── MASTER MUTE BUTTON ─────────────────────────────────────────────────────
export function MasterMuteButton({ muted, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '20px',
        zIndex: 150,
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: muted
          ? 'rgba(255, 68, 68, 0.5)'
          : 'rgba(0, 0, 0, 0.6)',
        border: `2px solid ${muted ? 'rgba(255,68,68,0.6)' : 'rgba(255,255,255,0.15)'}`,
        backdropFilter: 'blur(10px)',
        color: '#fff',
        fontSize: '20px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
      }}
      title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
