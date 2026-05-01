import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ─── WEATHER PRESETS ─────────────────────────────────────────────────────────
const WEATHER_PRESETS = {
  sunny: {
    label: '☀️ Nắng',
    fogColor: '#f0905a',
    fogNear: 80,
    fogFar: 300,
    ambientIntensity: 1.5,
    ambientColor: '#fff5e0',
    sunIntensity: 2.0,
    sunColor: '#ffe0c0',
    rainCount: 0,
    rainLength: 0.5,
    rainSpread: 500,
    snowCount: 0,
    snowSize: 0.18,
    snowOpacity: 0.85,
    snowSpread: 500,
    skyTop: '#87CEEB',
    skyBottom: '#f0905a',
  },
  rainy: {
    label: '🌧️ Mưa',
    fogColor: '#6a7a8a',
    fogNear: 20,
    fogFar: 100,
    ambientIntensity: 0.6,
    ambientColor: '#c0d0e0',
    sunIntensity: 0.3,
    sunColor: '#aabbcc',
    rainCount: 2500,
    rainLength: 0.8,
    rainSpread: 500,
    snowCount: 0,
    snowSize: 0.18,
    snowOpacity: 0.85,
    snowSpread: 500,
    skyTop: '#4a5a6a',
    skyBottom: '#6a7a8a',
  },
  snowy: {
    label: '❄️ Tuyết',
    fogColor: '#dce8f5',
    fogNear: 15,
    fogFar: 80,
    ambientIntensity: 0.8,
    ambientColor: '#dce8ff',
    sunIntensity: 0.5,
    sunColor: '#cce0ff',
    rainCount: 0,
    rainLength: 0.5,
    rainSpread: 500,
    snowCount: 2500,
    snowSize: 0.22,
    snowOpacity: 0.9,
    snowSpread: 500,
    skyTop: '#b0c8e8',
    skyBottom: '#dce8f5',
  },
  foggy: {
    label: '🌫️ Sương Mù',
    fogColor: '#c8c8c0',
    fogNear: 5,
    fogFar: 40,
    ambientIntensity: 0.5,
    ambientColor: '#d0d0c8',
    sunIntensity: 0.2,
    sunColor: '#d0d0c0',
    rainCount: 0,
    rainLength: 0.5,
    rainSpread: 500,
    snowCount: 0,
    snowSize: 0.18,
    snowOpacity: 0.85,
    snowSpread: 500,
    skyTop: '#a0a098',
    skyBottom: '#c8c8c0',
  },
};

// ─── LERP HELPER ─────────────────────────────────────────────────────────────
function lerpVal(a, b, t) { return a + (b - a) * t; }
function lerpColor(a, b, t) {
  const ca = new THREE.Color(a), cb = new THREE.Color(b);
  return '#' + ca.lerp(cb, t).getHexString();
}

// ─── RAIN PARTICLES (LineSegments – hỗ trợ điều chỉnh độ dài) ────────────────
function Rain({ count, color = '#aaddff', rainLength = 0.5, rainSpread = 120 }) {
  const mesh = useRef();
  const positions = useRef(null);
  const velocities = useRef(null);

  useEffect(() => {
    if (count === 0) return;
    // Mỗi hạt mưa = 1 đoạn thẳng → 2 đỉnh → 6 số float
    const pos = new Float32Array(count * 6);
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * rainSpread;
      const y = Math.random() * 40 + 5;
      const z = (Math.random() - 0.5) * rainSpread;
      // Đỉnh trên
      pos[i * 6 + 0] = x;
      pos[i * 6 + 1] = y;
      pos[i * 6 + 2] = z;
      // Đỉnh dưới (cách nhau rainLength)
      pos[i * 6 + 3] = x;
      pos[i * 6 + 4] = y - rainLength;
      pos[i * 6 + 5] = z;
      vel[i] = 15 + Math.random() * 10;
    }
    positions.current = pos;
    velocities.current = vel;
    if (mesh.current) {
      mesh.current.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    }
  }, [count, rainLength, rainSpread]);

  useFrame((_, delta) => {
    if (!mesh.current || !positions.current || count === 0) return;
    const pos = positions.current;
    const vel = velocities.current;
    for (let i = 0; i < count; i++) {
      pos[i * 6 + 1] -= vel[i] * delta;
      pos[i * 6 + 4] -= vel[i] * delta;
      if (pos[i * 6 + 1] < 0) {
        const x = (Math.random() - 0.5) * rainSpread;
        const y = 40 + Math.random() * 10;
        const z = (Math.random() - 0.5) * rainSpread;
        pos[i * 6 + 0] = x;  pos[i * 6 + 1] = y;              pos[i * 6 + 2] = z;
        pos[i * 6 + 3] = x;  pos[i * 6 + 4] = y - rainLength;  pos[i * 6 + 5] = z;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  if (count === 0) return null;
  return (
    <lineSegments ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count * 2}
          array={new Float32Array(count * 6)}
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

// ─── SNOW PARTICLES (hỗ trợ điều chỉnh kích thước & độ dày) ─────────────────
function Snow({ count, snowSize = 0.18, snowOpacity = 0.85, snowSpread = 120 }) {
  const mesh = useRef();
  const positions = useRef(null);
  const drifts = useRef(null);

  useEffect(() => {
    if (count === 0) return;
    const pos = new Float32Array(count * 3);
    const drift = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * snowSpread;
      pos[i * 3 + 1] = Math.random() * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * snowSpread;
      drift[i] = (Math.random() - 0.5) * 0.5;
    }
    positions.current = pos;
    drifts.current = drift;
    if (mesh.current) {
      mesh.current.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    }
  }, [count, snowSpread]);

  useFrame((_, delta) => {
    if (!mesh.current || !positions.current || count === 0) return;
    const pos = positions.current;
    const drift = drifts.current;
    const t = Date.now() * 0.001;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= (1.5 + Math.random() * 0.5) * delta;
      pos[i * 3 + 0] += drift[i] * delta + Math.sin(t + i) * 0.01;
      if (pos[i * 3 + 1] < 0) {
        pos[i * 3 + 0] = (Math.random() - 0.5) * snowSpread;
        pos[i * 3 + 1] = 40;
        pos[i * 3 + 2] = (Math.random() - 0.5) * snowSpread;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  if (count === 0) return null;
  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={new Float32Array(count * 3)}
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

  useEffect(() => {
    if (!scene.fog) {
      scene.fog = new THREE.Fog(weather.fogColor, weather.fogNear, weather.fogFar);
    }
    fogRef.current = scene.fog;
  }, []);

  useFrame(() => {
    if (!fogRef.current) return;
    const fog = fogRef.current;
    const f = new THREE.Color(weather.fogColor);
    fog.color.lerp(f, 0.05);
    fog.near = lerpVal(fog.near, weather.fogNear, 0.05);
    fog.far  = lerpVal(fog.far,  weather.fogFar,  0.05);
  });

  return null;
}

// ─── ENVIRONMENT COMPONENT (export mặc định) ─────────────────────────────────
export default function Environment({ weather }) {
  return (
    <>
      <SceneUpdater weather={weather} />
      <Rain  count={weather.rainCount}  rainLength={weather.rainLength}  rainSpread={weather.rainSpread ?? 500} />
      <Snow  count={weather.snowCount}  snowSize={weather.snowSize}  snowOpacity={weather.snowOpacity}  snowSpread={weather.snowSpread ?? 500} />
    </>
  );
}

// ─── WEATHER CONTROL PANEL (UI overlay) ──────────────────────────────────────
export function WeatherPanel({ weather, setWeather }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('sunny');          // preset đang chọn
  const [manual, setManual] = useState({              // giá trị manual slider
    fogNear:          WEATHER_PRESETS.sunny.fogNear,
    fogFar:           WEATHER_PRESETS.sunny.fogFar,
    ambientIntensity: WEATHER_PRESETS.sunny.ambientIntensity,
    rainCount:        WEATHER_PRESETS.sunny.rainCount,
    rainLength:       WEATHER_PRESETS.sunny.rainLength,
    rainSpread:       WEATHER_PRESETS.sunny.rainSpread,
    snowCount:        WEATHER_PRESETS.sunny.snowCount,
    snowSize:         WEATHER_PRESETS.sunny.snowSize,
    snowOpacity:      WEATHER_PRESETS.sunny.snowOpacity,
    snowSpread:       WEATHER_PRESETS.sunny.snowSpread,
  });
  const [isManualMode, setIsManualMode] = useState(false);

  // Áp dụng preset
  const applyPreset = useCallback((key) => {
    setMode(key);
    setIsManualMode(false);
    const p = WEATHER_PRESETS[key];
    setManual({
      fogNear:          p.fogNear,
      fogFar:           p.fogFar,
      ambientIntensity: p.ambientIntensity,
      rainCount:        p.rainCount,
      rainLength:       p.rainLength,
      rainSpread:       p.rainSpread,
      snowCount:        p.snowCount,
      snowSize:         p.snowSize,
      snowOpacity:      p.snowOpacity,
      snowSpread:       p.snowSpread,
    });
    setWeather(p);
  }, [setWeather]);

  // Cập nhật từ slider thủ công
  const handleSlider = (key, value) => {
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
              min={0} max={5000} step={50}
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
              min={10} max={1000} step={10}
              onChange={v => handleSlider('rainSpread', Math.round(v))}
              color="#66bbff"
            />

            <SliderRow
              label="❄️ Số hạt tuyết"
              value={manual.snowCount}
              min={0} max={50000} step={50}
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

            <SliderRow
              label="🌨️ Độ dày vùng tuyết"
              value={manual.snowSpread}
              min={10} max={1000} step={10}
              onChange={v => handleSlider('snowSpread', Math.round(v))}
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