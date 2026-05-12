import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Stars } from '@react-three/drei';

// ─── WEATHER PRESETS ─────────────────────────────────────────────────────────
const WEATHER_PRESETS = {
  sunny: {
    label: '☀️ Nắng',
    fogColor: '#b0d0ff', 
    fogNear: 150,
    fogFar: 800,
    ambientIntensity: 0.4, 
    ambientColor: '#fff5e6', // Thêm sắc vàng nhẹ (warm white)
    sunIntensity: 1.5,   
    sunColor: '#ffedcc',    // Màu nắng vàng dịu cinematic
    rainCount: 0,
    rainLength: 0.5,
    rainSpread: 600,
    snowCount: 0,
    snowSize: 0.18,
    snowOpacity: 0.85,
    lightningCount: 0,
    skyTop: '#4fa9ff',   // Màu trời xanh biển cao cấp
    skyBottom: '#a0c8ff', // Chân trời sáng nhẹ
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
    rainCount: 8000,
    rainLength: 0.8,
    rainSpread: 1500,
    snowCount: 0,
    snowSize: 0.4,
    snowOpacity: 0.85,
    lightningCount: 3,
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
    rainSpread: 1500,
    snowCount: 5000,
    snowSize: 0.4,
    snowOpacity: 0.9,
    lightningCount: 0,
    skyTop: '#b0c8e8',
    skyBottom: '#dce8f5',
  },
  foggy: {
    label: '🌫️ Sương Mù',
    fogColor: '#b0b8c0',
    fogDensity: 0.045,  // Độ dày sương mù (dùng cho FogExp2)
    fogNear: 2,
    fogFar: 50,
    ambientIntensity: 0.4,
    ambientColor: '#b0b8c8',
    sunIntensity: 0.1,
    sunColor: '#a0a0b0',
    rainCount: 0,
    rainLength: 0.5,
    rainSpread: 200,
    snowCount: 0,
    snowSize: 0.18,
    snowOpacity: 0.85,
    lightningCount: 0,
    skyTop: '#9098a0',
    skyBottom: '#b0b8c0',
  },
  night: {
    label: '🌙 Ban Đêm',
    fogColor: '#001535', 
    fogNear: 50,      // Đẩy sương xa ra để không làm mờ UI
    fogFar: 300,
    ambientIntensity: 0.6, // Tăng ambient để vật thể rõ hơn
    ambientColor: '#1a2a4a',
    sunColor: '#88bbff', 
    rainCount: 0,
    rainLength: 0.5,
    rainSpread: 600,
    snowCount: 0,
    snowSize: 0.18,
    snowOpacity: 0.85,
    lightningCount: 0,
    skyTop: '#01081a',   
    skyBottom: '#0a2a5a', 
    stars: true,         
    sunIntensity: 1.8,   // Tăng ánh trăng thêm xíu cho biển lung linh
  },
};

// ─── LERP HELPER ─────────────────────────────────────────────────────────────
function lerpVal(a, b, t) { return a + (b - a) * t; }
function lerpColor(a, b, t) {
  const ca = new THREE.Color(a), cb = new THREE.Color(b);
  return '#' + ca.lerp(cb, t).getHexString();
}

// ─── RAIN PARTICLES (Wrapped World Space) ──────────────────────────────────
const MAX_RAIN = 150000;
function Rain({ count = 3000, color = '#aaddff', rainLength = 0.5, rainSpread = 1500 }) {
  const mesh = useRef();
  const positions = useMemo(() => new Float32Array(MAX_RAIN * 6), []);
  const velocities = useMemo(() => new Float32Array(MAX_RAIN), []);

  useEffect(() => {
    for (let i = 0; i < MAX_RAIN; i++) {
      const x = (Math.random() - 0.5) * rainSpread;
      const y = Math.random() * 45;
      const z = (Math.random() - 0.5) * rainSpread;
      const idx = i * 6;
      positions[idx] = x; positions[idx + 1] = y; positions[idx + 2] = z;
      positions[idx + 3] = x; positions[idx + 4] = y - rainLength; positions[idx + 5] = z;
      velocities[i] = 15 + Math.random() * 30;
    }
  }, [rainSpread, rainLength]);

  useFrame((state, delta) => {
    if (!mesh.current || count === 0) {
      if (mesh.current) mesh.current.visible = false;
      return;
    }
    mesh.current.visible = true;
    const pos = positions;
    const vel = velocities;
    const camX = state.camera.position.x;
    const camZ = state.camera.position.z;
    const halfSpread = rainSpread / 2;
    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < count; i++) {
      const idx = i * 6;
      // Rơi xuống
      const dy = vel[i] * dt;
      pos[idx + 1] -= dy;
      pos[idx + 4] -= dy;

      // Wrap Y - Dùng modulo hoặc giá trị cố định thay vì random() mỗi frame
      if (pos[idx + 1] < -10) {
        pos[idx + 1] = 65; 
        pos[idx + 4] = 65 - rainLength;
      }

      // Wrap X
      if (pos[idx] - camX > halfSpread) {
        pos[idx] -= rainSpread;
        pos[idx + 3] -= rainSpread;
      } else if (pos[idx] - camX < -halfSpread) {
        pos[idx] += rainSpread;
        pos[idx + 3] += rainSpread;
      }

      // Wrap Z
      if (pos[idx + 2] - camZ > halfSpread) {
        pos[idx + 2] -= rainSpread;
        pos[idx + 5] -= rainSpread;
      } else if (pos[idx + 2] - camZ < -halfSpread) {
        pos[idx + 2] += rainSpread;
        pos[idx + 5] += rainSpread;
      }
    }
    mesh.current.geometry.attributes.position.updateRange = { offset: 0, count: count * 6 };
    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.geometry.setDrawRange(0, count * 2);
  });

  return (
    <lineSegments ref={mesh} frustumCulled={false}>
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
        opacity={0.8}
        depthWrite={false}
        linewidth={2}
      />
    </lineSegments>
  );
}

// ─── SNOW PARTICLES (Wrapped World Space) ──────────────────────────────────
const MAX_SNOW = 150000;
function Snow({ count = 3000, snowSize = 0.4, snowOpacity = 0.85, snowSpread = 1500 }) {
  const mesh = useRef();
  const positions = useMemo(() => new Float32Array(MAX_SNOW * 3), []);
  const drifts = useMemo(() => new Float32Array(MAX_SNOW), []);
  // Lưu vận tốc riêng từng hạt – không dùng random() mỗi frame
  const speeds = useMemo(() => new Float32Array(MAX_SNOW), []);

  useEffect(() => {
    for (let i = 0; i < MAX_SNOW; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * snowSpread;
      // Trải đều Y – không khởi đầu cùng 1 mặt phẳng
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * snowSpread;
      drifts[i] = (Math.random() - 0.5) * 1.2;     // drift ngang rộng hơn
      speeds[i] = 0.4 + Math.random() * 3.0;        // tốc độ rơi 0.4 – 3.4 mỗi hạt khác nhau
    }
  }, []);

  useFrame((state, delta) => {
    if (!mesh.current || count === 0) {
      if (mesh.current) mesh.current.visible = false;
      return;
    }
    mesh.current.visible = true;
    const pos = positions;
    const spd = speeds;
    const drift = drifts;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const camX = state.camera.position.x;
    const camZ = state.camera.position.z;
    const halfSpread = snowSpread / 2;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      pos[idx + 1] -= spd[i] * dt;
      // Tối ưu: Chỉ tính Sin một lần cho hiệu ứng đung đưa nhẹ
      pos[idx] += (drift[i] * dt) + Math.sin(t + i) * 0.01;

      // Wrap Y 
      if (pos[idx + 1] < -5) {
        pos[idx + 1] = 60;
      }

      // Wrap X
      if (pos[idx] - camX > halfSpread) pos[idx] -= snowSpread;
      else if (pos[idx] - camX < -halfSpread) pos[idx] += snowSpread;

      // Wrap Z
      if (pos[idx + 2] - camZ > halfSpread) pos[idx + 2] -= snowSpread;
      else if (pos[idx + 2] - camZ < -halfSpread) pos[idx + 2] += snowSpread;
    }
    mesh.current.geometry.attributes.position.updateRange = { offset: 0, count: count * 3 };
    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.geometry.setDrawRange(0, count);
  });

  return (
    <points ref={mesh} frustumCulled={false}>
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

// ─── LIGHTNING EFFECT ─────────────────────────────────────────────────────────
const MAX_LIGHTNING = 3000;
const MAX_BOLT_SEGMENTS = 20; // max segments per bolt

// Điền dữ liệu tia sét vào Float32Array có sẵn — không tạo object mới
function fillBoltPositions(arr) {
  const segments = 10 + Math.floor(Math.random() * 8);
  const height = 35 + Math.random() * 25;
  let x = 0, z = 0;
  let count = 0;
  for (let s = 0; s <= segments && s < MAX_BOLT_SEGMENTS; s++) {
    const t = s / segments;
    const jitter = s > 0 && s < segments ? (Math.random() - 0.5) * 8 : 0;
    const jitterZ = s > 0 && s < segments ? (Math.random() - 0.5) * 5 : 0;
    x += jitter; z += jitterZ;
    arr[s * 3] = x;
    arr[s * 3 + 1] = height * (1 - t);
    arr[s * 3 + 2] = z;
    count = s + 1;
  }
  return count;
}

function Lightning({ count = 0, spread = 600 }) {
  const boltsRef = useRef([]);
  const timersRef = useRef([]);
  const groupRef = useRef();

  useEffect(() => {
    if (!groupRef.current) return;
    // Xoá bolt cũ
    while (groupRef.current.children.length > 0) {
      const child = groupRef.current.children[0];
      child.geometry?.dispose();
      child.material?.dispose();
      groupRef.current.remove(child);
    }
    boltsRef.current = [];
    timersRef.current = [];

    const clampedCount = Math.min(count, MAX_LIGHTNING);
    for (let i = 0; i < clampedCount; i++) {
      // Pre-allocate float array — tái sử dụng mãi mãi, không bao giờ dispose
      const posArr = new Float32Array(MAX_BOLT_SEGMENTS * 3);
      const segCount = fillBoltPositions(posArr);
      const geo = new THREE.BufferGeometry();
      const attr = new THREE.BufferAttribute(posArr, 3);
      attr.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('position', attr);
      geo.setDrawRange(0, segCount);

      const mat = new THREE.LineBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const line = new THREE.Line(geo, mat);
      line.visible = false;
      groupRef.current.add(line);
      boltsRef.current.push({
        line,
        posArr,
        phase: 'idle',
        flashTimer: 0,
        doubleFlash: false,
        cooldown: 0.5 + Math.random() * 7.5,
      });
      timersRef.current.push(Math.random() * 6);
    }
  }, [count, spread]);

  useFrame((state, delta) => {
    if (!groupRef.current || count === 0) return;
    const camX = state.camera.position.x;
    const camZ = state.camera.position.z;
    const half = spread / 2;

    boltsRef.current.forEach((bolt, i) => {
      timersRef.current[i] -= delta;

      if (bolt.phase === 'idle') {
        if (timersRef.current[i] <= 0) {
          const rx = camX + (Math.random() - 0.5) * Math.min(half, 300);
          const rz = camZ + (Math.random() - 0.5) * Math.min(half, 300);
          // Cập nhật geometry IN-PLACE — không dispose/tạo mới
          const segCount = fillBoltPositions(bolt.posArr);
          bolt.line.geometry.attributes.position.needsUpdate = true;
          bolt.line.geometry.setDrawRange(0, segCount);
          bolt.line.position.set(rx, 0, rz);
          bolt.line.visible = true;
          bolt.line.material.opacity = 1.0;
          bolt.phase = 'flash1';
          bolt.flashTimer = 0.04 + Math.random() * 0.06;
          bolt.doubleFlash = Math.random() < 0.6;
        }
      } else if (bolt.phase === 'flash1') {
        bolt.line.material.opacity = 0.85 + Math.sin(Date.now() * 0.08) * 0.15;
        bolt.flashTimer -= delta;
        if (bolt.flashTimer <= 0) {
          if (bolt.doubleFlash) {
            bolt.line.material.opacity = 0;
            bolt.line.visible = false;
            bolt.phase = 'gap';
            bolt.flashTimer = 0.03 + Math.random() * 0.04;
          } else {
            bolt.phase = 'fade';
          }
        }
      } else if (bolt.phase === 'gap') {
        bolt.flashTimer -= delta;
        if (bolt.flashTimer <= 0) {
          // Flash lần 2: cập nhật IN-PLACE
          const segCount = fillBoltPositions(bolt.posArr);
          bolt.line.geometry.attributes.position.needsUpdate = true;
          bolt.line.geometry.setDrawRange(0, segCount);
          bolt.line.visible = true;
          bolt.line.material.opacity = 1.0;
          bolt.phase = 'flash2';
          bolt.flashTimer = 0.03 + Math.random() * 0.05;
        }
      } else if (bolt.phase === 'flash2') {
        bolt.line.material.opacity = 0.8 + Math.sin(Date.now() * 0.1) * 0.2;
        bolt.flashTimer -= delta;
        if (bolt.flashTimer <= 0) {
          bolt.phase = 'fade';
        }
      } else if (bolt.phase === 'fade') {
        bolt.line.material.opacity -= delta * 10;
        if (bolt.line.material.opacity <= 0) {
          bolt.line.material.opacity = 0;
          bolt.line.visible = false;
          bolt.phase = 'idle';
          timersRef.current[i] = 0.5 + Math.random() * 7.5;
        }
      }
    });
  });

  return <group ref={groupRef} />;
}

// ─── SCENE UPDATER (nhận props và cập nhật scene Three.js) ───────────────────
function SceneUpdater({ weather }) {
  const { scene } = useThree();
  const fogRef = useRef(null);
  const ambientRef = useRef(null);
  const dirRef1 = useRef(null);

  useEffect(() => {
    // Sử dụng FogExp2 để sương mù trông dày đặc và bao phủ tốt hơn (atmospheric)
    const fog = new THREE.FogExp2(weather.fogColor, weather.fogDensity || 0.005);
    scene.fog = fog;
    fogRef.current = fog;
    return () => { scene.fog = null; };
  }, [scene]);

  const tempColor = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    // Nếu trên mặt nước, đảm bảo scene.fog luôn là object của hệ thống thời tiết
    if (state.camera.position.y >= -8.5) {
      if (!state.scene.fog || state.scene.fog !== fogRef.current) {
        state.scene.fog = fogRef.current;
      }
    }

    if (fogRef.current && state.scene.fog === fogRef.current) {
      const fog = fogRef.current;
      tempColor.set(weather.fogColor);
      
      // Cập nhật màu sắc sương mù
      fog.color.lerp(tempColor, 0.05);

      // Nếu là FogExp2 thì cập nhật density, nếu là Fog thường thì cập nhật near/far
      if (fog.isFogExp2) {
        const targetDensity = weather.fogDensity || (1 / (weather.fogFar * 1.5 || 500));
        fog.density = lerpVal(fog.density, targetDensity, 0.05);
      } else {
        fog.near = lerpVal(fog.near, weather.fogNear, 0.05);
        fog.far = lerpVal(fog.far, weather.fogFar, 0.05);
      }
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = lerpVal(ambientRef.current.intensity, weather.ambientIntensity, 0.05);
      tempColor.set(weather.ambientColor);
      ambientRef.current.color.lerp(tempColor, 0.05);
    }
    if (dirRef1.current) {
      dirRef1.current.intensity = lerpVal(dirRef1.current.intensity, weather.sunIntensity, 0.05);
      tempColor.set(weather.sunColor);
      dirRef1.current.color.lerp(tempColor, 0.05);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={weather.ambientIntensity} color={weather.ambientColor} />
      <directionalLight ref={dirRef1} position={[10, 20, 10]} intensity={weather.sunIntensity} color={weather.sunColor} />
    </>
  );
}

// ─── ENVIRONMENT COMPONENT (export mặc định) ─────────────────────────────────
export default function Environment({ weather }) {
  const { scene } = useThree();

  // Đảm bảo các vật thể trong môi trường nhận sương mù, trừ các vật thể UI/đặc biệt
  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach(m => {
          // Chỉ ép bật sương mù nếu vật liệu đó chưa được set fog={false} một cách chủ đích
          // (giúp giữ vạch đích, đồng xu... luôn sáng)
          if (m.fog !== false) {
            m.fog = true;
          }
        });
      }
    });
  }, [scene, weather]);

  return (
    <>
      <SceneUpdater weather={weather} />
      {weather.stars && (
        <group position={[0, 50, 0]}>
          <Stars 
            radius={500} 
            depth={50} 
            count={8000} 
            factor={6} 
            saturation={0} 
            fade 
            speed={1} 
          />
        </group>
      )}
      <Rain count={weather.rainCount} rainLength={weather.rainLength} rainSpread={weather.rainSpread ?? 600} />
      <Snow count={weather.snowCount} snowSize={weather.snowSize} snowOpacity={weather.snowOpacity} snowSpread={weather.rainSpread ?? 600} />
      <Lightning count={weather.lightningCount ?? 0} spread={weather.rainSpread ?? 600} />
    </>
  );
}

// ─── WEATHER CONTROL PANEL (UI overlay) ──────────────────────────────────────
export function WeatherPanel({ weather, setWeather }) {
  const [isOpen, setIsOpen] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [mode, setMode] = useState('sunny');
  const [isManualMode, setIsManualMode] = useState(false);

  // Sync mode when weather changes externally (e.g. from App.jsx or initial load)
  useEffect(() => {
    const currentKey = Object.keys(WEATHER_PRESETS).find(k => WEATHER_PRESETS[k].label === weather.label);
    if (currentKey && !isManualMode) {
      setMode(currentKey);
    }
  }, [weather, isManualMode]);

  // Auto weather interval
  useEffect(() => {
    if (!autoMode) return;
    // Chỉ lấy các loại thời tiết ban ngày để random (loại bỏ 'night')
    const presets = Object.keys(WEATHER_PRESETS).filter(k => k !== 'night');
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
    setWeather(p);
  }, [setWeather]);

  // Cập nhật từ slider thủ công
  const handleSlider = (key, value) => {
    setAutoMode(false);
    setIsManualMode(true);
    // Cập nhật trực tiếp vào state weather của App.jsx
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
                  border: `2px solid ${mode === key ? '#5588ff' : 'rgba(255,255,255,0.1)'}`,
                  background: mode === key
                    ? 'rgba(60,100,220,0.3)'
                    : 'rgba(255,255,255,0.05)',
                  color: mode === key ? '#c8d8ff' : '#aaa',
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
              value={weather.fogNear}
              min={1} max={100} step={1}
              onChange={v => handleSlider('fogNear', v)}
              color="#88aaff"
            />

            <SliderRow
              label="🌫️ Sương kết thúc"
              value={weather.fogFar}
              min={20} max={400} step={5}
              onChange={v => handleSlider('fogFar', v)}
              color="#88aaff"
            />

            <SliderRow
              label="💡 Ánh sáng"
              value={weather.ambientIntensity}
              min={0} max={3} step={0.05}
              onChange={v => handleSlider('ambientIntensity', v)}
              color="#ffdd88"
            />

            <SliderRow
              label="🌧️ Số hạt mưa"
              value={weather.rainCount}
              min={0} max={150000} step={1000}
              onChange={v => handleSlider('rainCount', Math.round(v))}
              color="#aaddff"
            />

            <SliderRow
              label="📏 Độ dài hạt mưa"
              value={weather.rainLength}
              min={0.1} max={3.0} step={0.05}
              onChange={v => handleSlider('rainLength', v)}
              color="#88ccff"
            />

            <SliderRow
              label="🌧️ Độ dày vùng mưa"
              value={weather.rainSpread}
              min={10} max={1500} step={50}
              onChange={v => handleSlider('rainSpread', Math.round(v))}
              color="#66bbff"
            />

            <SliderRow
              label="❄️ Số hạt tuyết"
              value={weather.snowCount}
              min={0} max={150000} step={1000}
              onChange={v => handleSlider('snowCount', Math.round(v))}
              color="#ddeeff"
            />

            <SliderRow
              label="🔵 Kích thước tuyết"
              value={weather.snowSize}
              min={0.05} max={0.8} step={0.01}
              onChange={v => handleSlider('snowSize', v)}
              color="#cceeff"
            />

            <SliderRow
              label="🌨️ Độ dày tuyết"
              value={weather.snowOpacity}
              min={0.1} max={1.0} step={0.05}
              onChange={v => handleSlider('snowOpacity', v)}
              color="#eef5ff"
            />

            <SliderRow
              label="⚡ Số tia sét"
              value={weather.lightningCount}
              min={0} max={30000} step={10}
              onChange={v => handleSlider('lightningCount', Math.round(v))}
              color="#ffe066"
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