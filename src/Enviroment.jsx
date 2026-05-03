import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ─── WEATHER PRESETS ─────────────────────────────────────────────────────────
const WEATHER_PRESETS = {
  sunny: {
    label: '☀️ Nắng',
    fogColor: '#f0905a',
    fogNear: 250,
    fogFar: 600,
    ambientIntensity: 0.5,
    ambientColor: '#fff5e0',
    sunIntensity: 1.0,
    sunColor: '#ffe0c0',
    rainCount: 0,
    rainLength: 0.5,
    rainSpread: 600,
    snowCount: 0,
    snowSize: 0.18,
    snowOpacity: 0.85,
    skyTop: '#87CEEB',
    skyBottom: '#f0905a',
  },
  rainy: {
    label: '🌧️ Mưa',
    fogColor: '#6a7a8a',
    fogNear: 30,
    fogFar: 120,
    ambientIntensity: 0.6,
    ambientColor: '#c0d0e0',
    sunIntensity: 0.3,
    sunColor: '#aabbcc',
    rainCount: 12000,
    rainLength: 0.8,
    rainSpread: 600,
    snowCount: 0,
    snowSize: 0.18,
    snowOpacity: 0.85,
    skyTop: '#4a5a6a',
    skyBottom: '#6a7a8a',
  },
  snowy: {
    label: '❄️ Tuyết',
    fogColor: '#dce8f5',
    fogNear: 20,
    fogFar: 90,
    ambientIntensity: 0.8,
    ambientColor: '#dce8ff',
    sunIntensity: 0.5,
    sunColor: '#cce0ff',
    rainCount: 0,
    rainLength: 0.5,
    rainSpread: 600,
    snowCount: 60000,
    snowSize: 0.22,
    snowOpacity: 0.9,
    skyTop: '#b0c8e8',
    skyBottom: '#dce8f5',
  },
  foggy: {
    label: '🌫️ Sương Mù',
    fogColor: '#c8c8c0',
    fogNear: 15,
    fogFar: 60,
    ambientIntensity: 0.5,
    ambientColor: '#d0d0c8',
    sunIntensity: 0.2,
    sunColor: '#d0d0c0',
    rainCount: 0,
    rainLength: 0.5,
    rainSpread: 200,
    snowCount: 0,
    snowSize: 0.18,
    snowOpacity: 0.85,
    skyTop: '#a0a098',
    skyBottom: '#c8c8c0',
  },
  night: {
    label: '🌙 Ban Đêm',
    fogColor: '#030308',
    fogNear: 30,
    fogFar: 70,
    ambientIntensity: 0.2,
    ambientColor: '#404060',
    sunIntensity: 0.1,
    sunColor: '#202040',
    rainCount: 0,
    rainLength: 0.5,
    rainSpread: 600,
    snowCount: 0,
    snowSize: 0.18,
    snowOpacity: 0.85,
    skyTop: '#010103',
    skyBottom: '#050510',
  },
};

// ─── LERP HELPER ─────────────────────────────────────────────────────────────
function lerpVal(a, b, t) { return a + (b - a) * t; }
function lerpColor(a, b, t) {
  const ca = new THREE.Color(a), cb = new THREE.Color(b);
  return '#' + ca.lerp(cb, t).getHexString();
}

// ─── RAIN PARTICLES (Wrapped World Space) ──────────────────────────────────
const MAX_RAIN = 15000;
function Rain({ count, color = '#aaddff', rainLength = 0.5, rainSpread = 600 }) {
  const mesh = useRef();
  const currentCount = useRef(0);
  const positions = useMemo(() => new Float32Array(MAX_RAIN * 6), []);
  const velocities = useMemo(() => new Float32Array(MAX_RAIN), []);

  useEffect(() => {
    for (let i = 0; i < MAX_RAIN; i++) {
      const x = (Math.random() - 0.5) * rainSpread;
      const y = Math.random() * 40;
      const z = (Math.random() - 0.5) * rainSpread;
      positions[i * 6 + 0] = x; positions[i * 6 + 1] = y; positions[i * 6 + 2] = z;
      positions[i * 6 + 3] = x; positions[i * 6 + 4] = y - rainLength; positions[i * 6 + 5] = z;
      velocities[i] = 15 + Math.random() * 10;
    }
  }, []);

  useFrame((state, delta) => {
    currentCount.current = lerpVal(currentCount.current, count, 0.005);
    const activeCount = Math.floor(currentCount.current);

    if (!mesh.current || activeCount === 0) {
      if (mesh.current) mesh.current.visible = false;
      return;
    }
    mesh.current.visible = true;
    const pos = positions;
    const vel = velocities;
    const camX = state.camera.position.x;
    const camZ = state.camera.position.z;
    const halfSpread = rainSpread / 2;

    for (let i = 0; i < activeCount; i++) {
      // Rơi xuống
      const dy = vel[i] * delta;
      pos[i * 6 + 1] -= dy;
      pos[i * 6 + 4] -= dy;

      // Wrap X
      if (pos[i * 6 + 0] - camX > halfSpread) {
        pos[i * 6 + 0] -= rainSpread;
        pos[i * 6 + 3] -= rainSpread;
      } else if (pos[i * 6 + 0] - camX < -halfSpread) {
        pos[i * 6 + 0] += rainSpread;
        pos[i * 6 + 3] += rainSpread;
      }

      // Wrap Z
      if (pos[i * 6 + 2] - camZ > halfSpread) {
        pos[i * 6 + 2] -= rainSpread;
        pos[i * 6 + 5] -= rainSpread;
      } else if (pos[i * 6 + 2] - camZ < -halfSpread) {
        pos[i * 6 + 2] += rainSpread;
        pos[i * 6 + 5] += rainSpread;
      }

      // Reset khi chạm đất
      if (pos[i * 6 + 1] < 0) {
        pos[i * 6 + 1] = 35 + Math.random() * 5;
        pos[i * 6 + 4] = pos[i * 6 + 1] - rainLength;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.geometry.setDrawRange(0, activeCount * 2);
  });

  return (
    <lineSegments ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={MAX_RAIN * 2}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0.65}
        depthWrite={false}
      />
    </lineSegments>
  );
}

// ─── SNOW PARTICLES (Wrapped World Space) ──────────────────────────────────
const MAX_SNOW = 10000;
function Snow({ count, snowSize = 0.18, snowOpacity = 0.85, snowSpread = 600 }) {
  const mesh = useRef();
  const currentCount = useRef(0);
  const positions = useMemo(() => new Float32Array(MAX_SNOW * 3), []);
  const drifts = useMemo(() => new Float32Array(MAX_SNOW), []);

  useEffect(() => {
    for (let i = 0; i < MAX_SNOW; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * snowSpread;
      positions[i * 3 + 1] = Math.random() * 35;
      positions[i * 3 + 2] = (Math.random() - 0.5) * snowSpread;
      drifts[i] = (Math.random() - 0.5) * 0.5;
    }
  }, []);

  useFrame((state, delta) => {
    currentCount.current = lerpVal(currentCount.current, count, 0.005);
    const activeCount = Math.floor(currentCount.current);

    if (!mesh.current || activeCount === 0) {
      if (mesh.current) mesh.current.visible = false;
      return;
    }
    mesh.current.visible = true;
    const pos = positions;
    const drift = drifts;
    const t = Date.now() * 0.001;
    const camX = state.camera.position.x;
    const camZ = state.camera.position.z;
    const halfSpread = snowSpread / 2;

    for (let i = 0; i < activeCount; i++) {
      pos[i * 3 + 1] -= (1.5 + Math.random() * 0.5) * delta;
      pos[i * 3 + 0] += drift[i] * delta + Math.sin(t + i) * 0.01;

      // Wrap X
      if (pos[i * 3 + 0] - camX > halfSpread) pos[i * 3 + 0] -= snowSpread;
      else if (pos[i * 3 + 0] - camX < -halfSpread) pos[i * 3 + 0] += snowSpread;

      // Wrap Z
      if (pos[i * 3 + 2] - camZ > halfSpread) pos[i * 3 + 2] -= snowSpread;
      else if (pos[i * 3 + 2] - camZ < -halfSpread) pos[i * 3 + 2] += snowSpread;

      if (pos[i * 3 + 1] < 0) {
        pos[i * 3 + 1] = 35;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.geometry.setDrawRange(0, activeCount);
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={MAX_SNOW}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={snowSize}
        transparent
        opacity={snowOpacity}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// ─── SCENE UPDATER (nhận props và cập nhật scene Three.js) ───────────────────
function SceneUpdater({ weather }) {
  const { scene } = useThree();
  const fogRef = useRef(null);
  const ambientRef = useRef(null);
  const dirRef1 = useRef(null);
  const dirRef2 = useRef(null);

  useEffect(() => {
    if (!scene.fog) {
      scene.fog = new THREE.Fog(weather.fogColor, weather.fogNear, weather.fogFar);
    }
    fogRef.current = scene.fog;
  }, []);

  useFrame(() => {
    if (fogRef.current) {
      const fog = fogRef.current;
      const f = new THREE.Color(weather.fogColor);
      fog.color.lerp(f, 0.005);
      fog.near = lerpVal(fog.near, weather.fogNear, 0.005);
      fog.far = lerpVal(fog.far, weather.fogFar, 0.005);
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = lerpVal(ambientRef.current.intensity, weather.ambientIntensity, 0.005);
      ambientRef.current.color.lerp(new THREE.Color(weather.ambientColor), 0.005);
    }
    if (dirRef1.current) {
      dirRef1.current.intensity = lerpVal(dirRef1.current.intensity, weather.sunIntensity, 0.005);
      dirRef1.current.color.lerp(new THREE.Color(weather.sunColor), 0.005);
    }
    if (dirRef2.current) {
      dirRef2.current.intensity = lerpVal(dirRef2.current.intensity, weather.sunIntensity * 0.3, 0.005);
      dirRef2.current.color.lerp(new THREE.Color(weather.sunColor), 0.005);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={weather.ambientIntensity} color={weather.ambientColor} />
      <directionalLight ref={dirRef1} position={[10, 20, 10]} intensity={weather.sunIntensity} color={weather.sunColor} />
      <directionalLight ref={dirRef2} position={[-10, 10, -10]} intensity={weather.sunIntensity * 0.3} color={weather.sunColor} />
    </>
  );
}

// ─── ENVIRONMENT COMPONENT (export mặc định) ─────────────────────────────────
export default function Environment({ weather }) {
  return (
    <>
      <SceneUpdater weather={weather} />
      <Rain count={weather.rainCount} rainLength={weather.rainLength} rainSpread={weather.rainSpread ?? 600} />
      <Snow count={weather.snowCount} snowSize={weather.snowSize} snowOpacity={weather.snowOpacity} snowSpread={weather.rainSpread ?? 600} />
    </>
  );
}

// ─── WEATHER CONTROL PANEL (UI overlay) ──────────────────────────────────────
export function WeatherPanel({ weather, setWeather }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('sunny');          // preset đang chọn
  const [autoMode, setAutoMode] = useState(true);     // Tự động chuyển thời tiết
  const [manual, setManual] = useState({              // giá trị manual slider
    fogNear: WEATHER_PRESETS.sunny.fogNear,
    fogFar: WEATHER_PRESETS.sunny.fogFar,
    ambientIntensity: WEATHER_PRESETS.sunny.ambientIntensity,
    rainCount: WEATHER_PRESETS.sunny.rainCount,
    rainLength: WEATHER_PRESETS.sunny.rainLength,
    rainSpread: WEATHER_PRESETS.sunny.rainSpread,
    snowCount: WEATHER_PRESETS.sunny.snowCount,
    snowSize: WEATHER_PRESETS.sunny.snowSize,
    snowOpacity: WEATHER_PRESETS.sunny.snowOpacity,
  });
  const [isManualMode, setIsManualMode] = useState(false);

  // Auto weather interval
  useEffect(() => {
    if (!autoMode) return;
    const presets = Object.keys(WEATHER_PRESETS);
    const interval = setInterval(() => {
      setWeather(prev => {
        // pick a random preset that is different from current
        const currentKey = Object.keys(WEATHER_PRESETS).find(k => WEATHER_PRESETS[k].label === prev.label) || 'sunny';
        let nextKey = currentKey;
        while (nextKey === currentKey) {
          nextKey = presets[Math.floor(Math.random() * presets.length)];
        }
        setMode(nextKey);
        setIsManualMode(false);
        return WEATHER_PRESETS[nextKey];
      });
    }, 36000); // 36 seconds
    return () => clearInterval(interval);
  }, [autoMode, setWeather]);

  // Áp dụng preset
  const applyPreset = useCallback((key) => {
    setAutoMode(false);
    setMode(key);
    setIsManualMode(false);
    const p = WEATHER_PRESETS[key];
    setManual({
      fogNear: p.fogNear,
      fogFar: p.fogFar,
      ambientIntensity: p.ambientIntensity,
      rainCount: p.rainCount,
      rainLength: p.rainLength,
      rainSpread: p.rainSpread,
      snowCount: p.snowCount,
      snowSize: p.snowSize,
      snowOpacity: p.snowOpacity,
    });
    setWeather(p);
  }, [setWeather]);

  // Cập nhật từ slider thủ công
  const handleSlider = (key, value) => {
    setAutoMode(false);
    setIsManualMode(true);
    const next = { ...manual, [key]: Number(value) };
    setManual(next);
    setWeather(prev => ({ ...prev, [key]: Number(value) }));
  };

  return (
    <>
      {/* Nút mở panel */}
      <button
        id="weather-panel-toggle"
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: 'fixed',
          top: '15px',
          right: '15px',
          zIndex: 200,
          padding: '10px 18px',
          background: 'rgba(10, 10, 20, 0.8)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: '12px',
          color: '#fff',
          fontSize: '18px',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        🌦️ <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.5px' }}>THỜI TIẾT</span>
      </button>

      {/* Panel chính */}
      {isOpen && (
        <div
          id="weather-panel"
          style={{
            position: 'fixed',
            top: '60px',
            right: '15px',
            zIndex: 200,
            width: '280px',
            maxHeight: '80vh',
            overflowY: 'auto',
            background: 'rgba(8, 10, 18, 0.92)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '18px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            padding: '18px',
            fontFamily: "'Segoe UI', sans-serif",
            color: '#fff',
            userSelect: 'none',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '1px', color: '#c8d8ff' }}>
              🌦️ ĐIỀU CHỈNH THỜI TIẾT
            </span>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '16px' }}
            >✕</button>
          </div>

          {/* Auto Toggle */}
          <button
            onClick={() => setAutoMode(!autoMode)}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '12px',
              borderRadius: '10px',
              border: `2px solid ${autoMode ? '#44ffaa' : 'rgba(255,255,255,0.1)'}`,
              background: autoMode ? 'rgba(60,220,120,0.2)' : 'rgba(255,255,255,0.05)',
              color: autoMode ? '#ccffdd' : '#aaa',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {autoMode ? '🔄 TỰ ĐỘNG RANDOM: BẬT' : '🔄 TỰ ĐỘNG RANDOM: TẮT'}
          </button>

          {/* Preset buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            {Object.entries(WEATHER_PRESETS).map(([key, p]) => (
              <button
                key={key}
                id={`weather-btn-${key}`}
                onClick={() => applyPreset(key)}
                style={{
                  padding: '9px 6px',
                  borderRadius: '10px',
                  border: `2px solid ${mode === key && !isManualMode ? '#5588ff' : 'rgba(255,255,255,0.1)'}`,
                  background: mode === key && !isManualMode
                    ? 'rgba(60,100,220,0.3)'
                    : 'rgba(255,255,255,0.05)',
                  color: mode === key && !isManualMode ? '#c8d8ff' : '#aaa',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  letterSpacing: '0.3px',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }} />

          {/* Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <SliderRow
              label="🌫️ Sương bắt đầu"
              value={manual.fogNear}
              min={1} max={100} step={1}
              onChange={v => handleSlider('fogNear', v)}
              color="#88aaff"
            />

            <SliderRow
              label="🌫️ Sương kết thúc"
              value={manual.fogFar}
              min={20} max={400} step={5}
              onChange={v => handleSlider('fogFar', v)}
              color="#88aaff"
            />

            <SliderRow
              label="💡 Ánh sáng"
              value={manual.ambientIntensity}
              min={0} max={3} step={0.05}
              onChange={v => handleSlider('ambientIntensity', v)}
              color="#ffdd88"
            />

            <SliderRow
              label="🌧️ Số hạt mưa"
              value={manual.rainCount}
              min={0} max={150000} step={1000}
              onChange={v => handleSlider('rainCount', Math.round(v))}
              color="#aaddff"
            />

            <SliderRow
              label="📏 Độ dài hạt mưa"
              value={manual.rainLength}
              min={0.1} max={3.0} step={0.05}
              onChange={v => handleSlider('rainLength', v)}
              color="#88ccff"
            />

            <SliderRow
              label="🌧️ Độ dày vùng mưa"
              value={manual.rainSpread}
              min={10} max={1500} step={50}
              onChange={v => handleSlider('rainSpread', Math.round(v))}
              color="#66bbff"
            />

            <SliderRow
              label="❄️ Số hạt tuyết"
              value={manual.snowCount}
              min={0} max={150000} step={1000}
              onChange={v => handleSlider('snowCount', Math.round(v))}
              color="#ddeeff"
            />

            <SliderRow
              label="🔵 Kích thước tuyết"
              value={manual.snowSize}
              min={0.05} max={0.8} step={0.01}
              onChange={v => handleSlider('snowSize', v)}
              color="#cceeff"
            />

            <SliderRow
              label="🌨️ Độ dày tuyết"
              value={manual.snowOpacity}
              min={0.1} max={1.0} step={0.05}
              onChange={v => handleSlider('snowOpacity', v)}
              color="#eef5ff"
            />

          </div>

          {/* Mode badge */}
          {isManualMode && (
            <div style={{
              marginTop: '12px',
              textAlign: 'center',
              fontSize: '11px',
              color: '#ffaa44',
              padding: '5px',
              borderRadius: '6px',
              background: 'rgba(255,150,50,0.1)',
              border: '1px solid rgba(255,150,50,0.2)',
            }}>
              ✏️ Chế độ tuỳ chỉnh
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── SLIDER ROW SUB-COMPONENT ─────────────────────────────────────────────────
function SliderRow({ label, value, min, max, step, onChange, color = '#88aaff' }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '11px', color: '#bbb' }}>{label}</span>
        <span style={{ fontSize: '11px', color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(2) : value}
        </span>
      </div>
      <div style={{ position: 'relative', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0,
          width: `${pct}%`, height: '100%',
          background: color, borderRadius: '2px',
          transition: 'width 0.05s',
        }} />
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          marginTop: '2px',
          opacity: 0,
          position: 'absolute',
          height: '18px',
          cursor: 'pointer',
          left: 0,
        }}
      />
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          marginTop: '-14px',
          appearance: 'none',
          background: 'transparent',
          cursor: 'pointer',
          height: '18px',
          outline: 'none',
        }}
      />
    </div>
  );
}

// Export preset mặc định để App.jsx dùng
export { WEATHER_PRESETS };