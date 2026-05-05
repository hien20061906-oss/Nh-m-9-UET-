import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, useContext, useTransition, useLayoutEffect } from 'react';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, Debug, useBox, usePlane, useRaycastVehicle, useCylinder, useCompoundBody, useSphere, useTrimesh, useConvexPolyhedron } from '@react-three/cannon';
import * as THREE from 'three';
import { useGLTF, useKeyboardControls, PerspectiveCamera, Html, Stars, Sky, Cloud, Float, Text, Center, Clone, Preload } from '@react-three/drei';
import { threeToCannon, ShapeType } from 'three-to-cannon';
import Environment, { WeatherPanel, WEATHER_PRESETS } from './Enviroment';
import RaceManager, { RaceContext, RACE_STATES, RaceTicker } from './RaceManager';
import Minimap, { MinimapPlayerTracker } from './Minimap';
import { AchievementSystem, AchievementUI, AchievementBoard } from './Achievement';
import TeleportOverlay from './TeleportOverlay';
import RaceTrack from './RaceTrack';
import RaceUI from './RaceUI';
import LoginScreen from './LoginScreen';
import { MapCoins, CoinParticles3D, CoinCollectUI } from './CoinSystem';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { playSound, playRandomSound, startLoop, stopLoop, fadeVolume, BackgroundMusic, WeatherAudio, MasterMuteButton, setGlobalMuted } from './SoundManager';

// ─── LOADING SCREEN ─────────────────────────────────────────────────────────
const LoadingScreen = ({ onFinished }) => {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  const tips = [
    "Đang làm nóng lốp xe...",
    "Đồng bộ hóa lưới đèn Neon...",
    "Tính toán vectơ drift...",
    "Nạp nhiên liệu Nitrous...",
    "Kiểm tra hệ thống treo...",
    "Đang kết nối với vệ tinh đường đua...",
    "Chuẩn bị hiệu ứng ánh sáng..."
  ];

  useEffect(() => {
    const duration = 15000; // 15 seconds
    const interval = 100; // Update every 100ms
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onFinished, 500);
          return 100;
        }
        return prev + step;
      });
    }, interval);

    const tipTimer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % tips.length);
    }, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(tipTimer);
    };
  }, [onFinished]);

  return (
    <div className="loading-screen-wrapper">
      <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;700&display=swap" rel="stylesheet" />
      <style>{`
        .loading-screen-wrapper {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #050505;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: 'Chakra Petch', sans-serif;
          overflow: hidden;
        }

        /* Perspective Grid Background */
        .loading-screen-wrapper::before {
          content: "";
          position: absolute;
          width: 200%;
          height: 200%;
          bottom: -50%;
          left: -50%;
          background-image: 
            linear-gradient(rgba(112, 0, 255, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(112, 0, 255, 0.2) 1px, transparent 1px);
          background-size: 50px 50px;
          transform: perspective(500px) rotateX(60deg);
          animation: gridMove 4s linear infinite;
          z-index: 0;
        }

        @keyframes gridMove {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
        }

        .main-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .neon-title {
          font-size: 3.5rem;
          font-weight: 700;
          text-transform: uppercase;
          background: linear-gradient(90deg, #00f2ff, #7000ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 15px rgba(0, 242, 255, 0.8)) drop-shadow(0 0 30px rgba(112, 0, 255, 0.6));
          margin-bottom: 2rem;
          line-height: 1.2;
          letter-spacing: 2px;
        }

        .loading-label {
          font-size: 2.2rem;
          font-weight: 700;
          color: #00f2ff;
          text-shadow: 0 0 10px #00f2ff;
          letter-spacing: 4px;
          margin-bottom: 1.5rem;
          animation: blink 1.5s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .percentage {
          font-size: 1.8rem;
          font-weight: 700;
          color: #00f2ff;
          margin-bottom: 1rem;
        }

        .loading-container {
          width: 500px;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          position: relative;
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .loading-bar {
          height: 100%;
          background: linear-gradient(90deg, #00f2ff, #7000ff);
          box-shadow: 0 0 10px #00f2ff;
          transition: width 0.1s linear;
        }

        .status-text {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: Arial, sans-serif;
          height: 1rem;
        }

        .bottom-tag {
          position: absolute;
          bottom: 30px;
          font-size: 0.6rem;
          color: rgba(255, 255, 255, 0.3);
          letter-spacing: 2px;
        }
      `}</style>

      <div className="main-content">
        <h1 className="neon-title">GIẢNG ĐƯỜNG<br />TRONG MƠ</h1>

        <div className="loading-label">LOADING...</div>

        <div className="percentage">{Math.round(progress)}%</div>

        <div className="loading-container">
          <div className="loading-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="status-text">
          {tips[tipIndex]}
        </div>
      </div>

      <div className="bottom-tag">
        GAME ENGINE INITIALIZING...
      </div>
    </div>
  );
};


// ─── CONTROLS ────────────────────────────────────────────────────────────────
function usePlayerControls() {
  const keys = useRef({
    forward: false, backward: false, left: false, right: false,
    brake: false, reset: false, boost: false, change: false,
    up: false, down: false, yawLeft: false, yawRight: false, honk: false
  });
  useEffect(() => {
    const down = (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.current.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.current.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') { keys.current.left = true; keys.current.yawLeft = true; }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') { keys.current.right = true; keys.current.yawRight = true; }
      if (e.code === 'Space') { e.preventDefault(); keys.current.brake = true; keys.current.up = true; }
      if (e.code === 'KeyI') keys.current.up = true;
      if (e.code === 'KeyK') keys.current.down = true;
      if (e.code === 'KeyR') keys.current.reset = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { e.preventDefault(); keys.current.boost = true; keys.current.down = true; }
      if (e.code === 'KeyC') keys.current.change = true;
      if (e.code === 'KeyH') keys.current.honk = true;
    };
    const up = (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.current.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.current.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') { keys.current.left = false; keys.current.yawLeft = false; }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') { keys.current.right = false; keys.current.yawRight = false; }
      if (e.code === 'Space') { keys.current.brake = false; keys.current.up = false; }
      if (e.code === 'KeyI') keys.current.up = false;
      if (e.code === 'KeyK') keys.current.down = false;
      if (e.code === 'KeyR') keys.current.reset = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { keys.current.boost = false; keys.current.down = false; }
      if (e.code === 'KeyC') keys.current.change = false;
      if (e.code === 'KeyH') keys.current.honk = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);
  return keys;
}

const WheelModel = ({ leftSide, folder = 'default', visible = true }) => {
  const wheelFile = folder === 'alternative' ? 'wheel2.glb' : 'wheel.glb';
  const { scene } = useGLTF(`/models/car/${folder}/${wheelFile}`);
  const copiedScene = React.useMemo(() => {
    const clone = scene.clone();

    // Cách 2 Nâng Cao: Tự động tính toán tâm thực sự bằng Box3 và bù trừ (offset) về [0,0,0]
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center); // dời mô hình ngược lại đúng bằng khoảng cách lệch tâm

    // Bọc vào group để lưới xoay quanh tâm mới
    const wrapper = new THREE.Group();
    wrapper.add(clone);
    return wrapper;
  }, [scene]);

  // Xoay bánh xe theo trục Y để quay mặt mâm bánh xe ra ngoài
  return <primitive object={copiedScene} visible={visible} rotation={[0, leftSide ? -Math.PI / 2 : Math.PI / 2, 0]} />;
};

const Wheel = React.forwardRef(({ radius = 0.25, width = 0.24, leftSide, folder = 'default', visible = true, position, rotation }, ref) => {
  useCylinder(() => ({
    mass: 5,
    type: 'Kinematic',
    material: 'wheel',
    collisionFilterGroup: 0,
    collisionFilterMask: 0,
    args: [radius, radius, width, 16],
    position,
    rotation
  }), ref);

  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <React.Suspense fallback={null}>
        <WheelModel leftSide={leftSide} folder={folder} visible={visible} />
      </React.Suspense>
    </mesh>
  );
});

// ─── VEHICLE CONFIGS (Module-level constant, tránh tạo lại mỗi lần render) ──
const VEHICLE_CONFIGS = {
  default: {
    front: -0.55,
    back: 0.55,
    width: 0.55,
    wheelY: 0,
    chassisY: -0.25,
    suspensionStiffness: 150,
    dampingRelaxation: 6.0,
    dampingCompression: 6.0,
    mass: 150,
  },
  alternative: {
    front: -0.82,
    back: 0.82,
    width: 0.4,
    wheelY: -0.1, // Bánh xe nhỏ hơn/sâu hơn
    chassisY: -0.25,
    suspensionStiffness: 150,
    dampingRelaxation: 6.0,
    dampingCompression: 6.0,
    mass: 150,
  },
  rolls_royce: {
    front: -1.145,
    back: 0.821,
    width: 0.45,
    wheelY: 0,
    chassisY: -0.25,
    suspensionStiffness: 150,
    dampingRelaxation: 12.0,
    dampingCompression: 12.0,
    mass: 800,
  },
  ship: {
    front: -0.8,
    back: 0.8,
    width: 0.7,
    wheelY: 0.1, // Nhích lên một chút so với lúc nãy để không bị kẹt gầm
    chassisY: -0.25,
    suspensionStiffness: 400,
    dampingRelaxation: 10.0,
    dampingCompression: 10.0,
    mass: 800,
  }
};

const Car = ({ folder, lastPos, lastRot, controls, weather }) => {
  const { raceState } = useContext(RaceContext);
  const lastChange = useRef(false);
  const { camera } = useThree();
  const carLightRef = useRef();

  // --- Physics chassis (Trở về useBox chuẩn của bạn) ---
  const chassisWidth = 0.8;
  // Làm khung vật lý mỏng lại để KHÔNG BAO GIỜ cạ gầm vào mặt đường
  const chassisHeight = 0.2;
  const chassisDepth = 2.03;

  const config = VEHICLE_CONFIGS[folder] || VEHICLE_CONFIGS.default;
  const { front: fO, back: bO, width: oW, wheelY, chassisY } = config;

  // Âm thanh còi xe
  const honkSound = useMemo(() => {
    const audio = new window.Audio('/sounds/honk.mp3');
    audio.volume = 0.5;
    return audio;
  }, []);

  // ─── ENGINE SOUND ─────────────────────────────────────────────────────
  const engineAudio = useRef(null);
  const nitroAudio = useRef(null);
  const isNitroPlaying = useRef(false);

  useEffect(() => {
    // Khởi tạo tiếng động cơ (loop)
    const eng = new Audio('/sounds/vehicle/engine/muscle car engine loop idle.mp3');
    eng.loop = true;
    eng.volume = 0.12;
    eng.playbackRate = 0.8;
    engineAudio.current = eng;
    eng.play().catch(() => { });

    return () => {
      eng.pause();
      eng.currentTime = 0;
    };
  }, []);

  const velocity = useRef([0, 0, 0]);

  // ─── COLLISION SOUND ──────────────────────────────────────────────────
  const lastCollisionTime = useRef(0);
  useEffect(() => {
    // Dùng sự kiện va chạm từ cannon.js
    const handleCollide = () => {
      const now = performance.now();
      if (now - lastCollisionTime.current < 500) return; // Cooldown 500ms
      lastCollisionTime.current = now;
      const spd = Math.sqrt(velocity.current[0] ** 2 + velocity.current[2] ** 2);
      if (spd > 3) { // Chỉ phát khi tốc độ > 3
        const vol = Math.min(0.5, spd * 0.03);
        playRandomSound(['hit1', 'hit2', 'hit3', 'hit4', 'hitMetal'], vol);
      }
    };
    window.addEventListener('vehicle-collision', handleCollide);
    return () => {
      window.removeEventListener('vehicle-collision', handleCollide);
    };
  }, []);
  const isHonking = useRef(false);

  // Sử dụng useCompoundBody
  const [chassisRef, chassisApi] = useCompoundBody(() => ({
    mass: config.mass || 150,
    // Luôn đưa xe về mặt đất nếu nó đang ở quá cao (tránh rơi từ trực thăng)
    position: [lastPos.current[0], Math.min(lastPos.current[1], 1.5) + 0.5, lastPos.current[2]],
    rotation: [0, lastRot.current[1], 0],
    velocity: [0, 0, 0],
    angularVelocity: [0, 0, 0],
    allowSleep: false,
    linearDamping: 0.4,
    angularDamping: 0.9,
    angularFactor: [0, 1, 0],
    name: 'chassis-body',
    onCollide: (e) => {
      // Dispatch event để collision sound handler bắt được
      window.dispatchEvent(new CustomEvent('vehicle-collision'));
    },
    shapes: [
      // Lớp 1 (Gầm xe): Hình hộp mỏng (0.3).
      { type: 'Box', position: [0, 0, 0], rotation: [0, 0, 0], args: [chassisWidth, 0.3, chassisDepth] },

      // Lớp 2: Chỉ dùng 2 hình cầu lớn ở đầu và đuôi để tối ưu hiệu năng (tránh lag).
      // Đẩy sát ra mép xe hơn để tránh kẹt rào.
      { type: 'Sphere', position: [0, 0.35, 0.9], args: [0.45] },  // Mũi xe (đã dịch lên trên)
      { type: 'Sphere', position: [0, 0.35, -0.9], args: [0.45] } // Đuôi xe
    ]
  }));

  useEffect(() => {
    const unsubPos = chassisApi.position.subscribe(v => { lastPos.current = v; });
    const unsubRot = chassisApi.rotation.subscribe(v => { lastRot.current = v; });

    /**
     * Lắng nghe lệnh dịch chuyển xe
     * Lấy cơ chế từ MiniDrive Player.js respawn() line 469-488:
     * - Reset position → target location
     * - Reset velocity → [0, 0, 0]
     * - Reset angularVelocity → [0, 0, 0]
     * - Reset rotation → [0, targetYaw, 0] (QUAN TRỌNG: phải reset đúng hướng)
     */
    const handleTeleport = (e) => {
      const { position, rotation } = e.detail;
      const yaw = typeof rotation === 'number' ? rotation : 0;
      chassisApi.position.set(...position);
      chassisApi.velocity.set(0, 0, 0);
      chassisApi.angularVelocity.set(0, 0, 0);
      chassisApi.rotation.set(0, yaw, 0);
    };
    window.addEventListener('teleport-execute', handleTeleport);

    return () => {
      unsubPos();
      unsubRot();
      window.removeEventListener('teleport-execute', handleTeleport);
    };
  }, [chassisApi, lastPos, lastRot]);

  // --- Hệ thống treo CÂN BẰNG ---
  const wheelRadius = 0.25;
  const wheelHeight = 0.25;

  // Moved to the top to prevent TDZ issues

  const wheelInfos = useMemo(() => {
    // Nếu là Rolls Royce, sử dụng bộ tọa độ riêng biệt để dễ chỉnh sửa
    if (folder === 'rolls_royce') {
      const { suspensionStiffness, dampingRelaxation, dampingCompression } = config;
      return [
        { radius: wheelRadius, directionLocal: [0, -1, 0], axleLocal: [-1, 0, 0], suspensionRestLength: 0.35, maxSuspensionForce: 100000, maxSuspensionTravel: 0.25, frictionSlip: 6.0, rollInfluence: 0.0, suspensionStiffness, dampingRelaxation, dampingCompression, chassisConnectionPointLocal: [-0.45, 0, -1.145], isFrontWheel: true },
        { radius: wheelRadius, directionLocal: [0, -1, 0], axleLocal: [-1, 0, 0], suspensionRestLength: 0.35, maxSuspensionForce: 100000, maxSuspensionTravel: 0.25, frictionSlip: 6.0, rollInfluence: 0.0, suspensionStiffness, dampingRelaxation, dampingCompression, chassisConnectionPointLocal: [0.45, 0, -1.145], isFrontWheel: true },
        { radius: wheelRadius, directionLocal: [0, -1, -0.15], axleLocal: [-1, 0, 0], suspensionRestLength: 0.35, maxSuspensionForce: 100000, maxSuspensionTravel: 0.25, frictionSlip: 6.0, rollInfluence: 0.0, suspensionStiffness, dampingRelaxation, dampingCompression, chassisConnectionPointLocal: [-0.45, 0, 0.821], isFrontWheel: false },
        { radius: wheelRadius, directionLocal: [0, -1, -0.15], axleLocal: [-1, 0, 0], suspensionRestLength: 0.35, maxSuspensionForce: 100000, maxSuspensionTravel: 0.25, frictionSlip: 6.0, rollInfluence: 0.0, suspensionStiffness, dampingRelaxation, dampingCompression, chassisConnectionPointLocal: [0.45, 0, 0.821], isFrontWheel: false },
      ];
    }

    // Các xe khác vẫn dùng công thức chung dựa trên VEHICLE_CONFIGS
    return [
      { radius: wheelRadius, directionLocal: [0, -1, 0], axleLocal: [-1, 0, 0], suspensionRestLength: 0.35, maxSuspensionForce: 100000, maxSuspensionTravel: 0.25, frictionSlip: 6.0, rollInfluence: 0.0, suspensionStiffness: config.suspensionStiffness, dampingRelaxation: config.dampingRelaxation, dampingCompression: config.dampingCompression, chassisConnectionPointLocal: [-oW, wheelY, fO], isFrontWheel: true },
      { radius: wheelRadius, directionLocal: [0, -1, 0], axleLocal: [-1, 0, 0], suspensionRestLength: 0.35, maxSuspensionForce: 100000, maxSuspensionTravel: 0.25, frictionSlip: 6.0, rollInfluence: 0.0, suspensionStiffness: config.suspensionStiffness, dampingRelaxation: config.dampingRelaxation, dampingCompression: config.dampingCompression, chassisConnectionPointLocal: [oW, wheelY, fO], isFrontWheel: true },
      { radius: wheelRadius, directionLocal: [0, -1, 0], axleLocal: [-1, 0, 0], suspensionRestLength: 0.35, maxSuspensionForce: 100000, maxSuspensionTravel: 0.25, frictionSlip: 6.0, rollInfluence: 0.0, suspensionStiffness: config.suspensionStiffness, dampingRelaxation: config.dampingRelaxation, dampingCompression: config.dampingCompression, chassisConnectionPointLocal: [-oW, wheelY, bO], isFrontWheel: false },
      { radius: wheelRadius, directionLocal: [0, -1, 0], axleLocal: [-1, 0, 0], suspensionRestLength: 0.35, maxSuspensionForce: 100000, maxSuspensionTravel: 0.25, frictionSlip: 6.0, rollInfluence: 0.0, suspensionStiffness: config.suspensionStiffness, dampingRelaxation: config.dampingRelaxation, dampingCompression: config.dampingCompression, chassisConnectionPointLocal: [oW, wheelY, bO], isFrontWheel: false },
    ];
  }, [folder, config, oW, wheelY, fO, bO]);

  const wheel0 = useRef(null);
  const wheel1 = useRef(null);
  const wheel2 = useRef(null);
  const wheel3 = useRef(null);
  const firstFrame = useRef(true);
  const resetWasPressed = useRef(false);

  const [vehicle, vehicleApi] = useRaycastVehicle(() => ({
    chassisBody: chassisRef,
    wheelInfos,
    wheels: [wheel0, wheel1, wheel2, wheel3],
    indexForwardAxis: 2,
    indexRightAxis: 0,
    indexUpAxis: 1,
  }));


  // --- Models ---
  const modelFolder = folder;
  const chassisFile = modelFolder === 'alternative' ? 'chassis2.glb' : 'chassis.glb';
  const { scene: chassisSceneRaw } = useGLTF(`/models/car/${modelFolder}/${chassisFile}`);
  // Clone scene để tránh chia sẻ object 3D giữa các instance → gây biến dạng khi đổi xe
  const chassisScene = useMemo(() => chassisSceneRaw.clone(true), [chassisSceneRaw]);

  useEffect(() => {
    const unsub = chassisApi.velocity.subscribe(v => { velocity.current = v; });
    return unsub;
  }, [chassisApi]);

  // Steering state
  const currentSteering = useRef(0);

  const smoothRot = useRef(0);
  const isBraking = useRef(false); // Trạng thái phanh để tối ưu hóa damping

  // --- Camera state ---
  const camPos = useRef(new THREE.Vector3(0, 5, 10));
  const camTarget = useRef(new THREE.Vector3());

  // --- Mouse camera control ---
  const camAngle = useRef({ x: 0, y: 0.35, dist: 7 });
  useEffect(() => {
    let middleDown = false;
    const onWheel = (e) => {
      camAngle.current.dist = Math.max(3, Math.min(25, camAngle.current.dist + e.deltaY * 0.01));
    };
    const onDown = (e) => { if (e.button === 1) middleDown = true; };
    const onUp = (e) => { if (e.button === 1) middleDown = false; };
    const onMove = (e) => {
      if (!middleDown) return;
      camAngle.current.x -= e.movementX * 0.005;
      camAngle.current.y = Math.max(0.05, Math.min(Math.PI / 2.2, camAngle.current.y + e.movementY * 0.005));
    };
    window.addEventListener('wheel', onWheel);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  // ─── MAIN LOOP ───────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (carLightRef.current && weather) {
      // Light logic removed as requested
    }

    // Sửa lỗi crash: controls có thể là ref hoặc object thường (lúc đếm ngược)
    const ctrl = controls.current || controls;
    const { forward, backward, left, right, brake, reset, boost, change, honk } = ctrl;

    // Xử lý còi xe (chỉ dành cho ô tô, không dành cho Tàu Thủy)
    if (honk && folder !== 'ship' && !isHonking.current) {
      honkSound.currentTime = 0;
      honkSound.play().catch(e => console.log('Audio play failed:', e));
      isHonking.current = true;
    } else if (!honk) {
      isHonking.current = false;
    }

    const dt = Math.min(delta, 0.05); // clamp delta để tránh spike lag

    // Reset xe (Nhấn R): Dịch chuyển xe lên trên một chút và dựng thẳng xe lại
    if (reset) {
      if (!resetWasPressed.current && chassisRef.current) {
        // Lấy tọa độ hiện tại
        const pos = chassisRef.current.position;
        const rot = chassisRef.current.rotation;

        // Reset: Nhấc lên 2m, giữ nguyên vị trí X, Z, reset rotation về thẳng đứng (chỉ giữ lại góc quay ngang)
        chassisApi.position.set(pos.x, pos.y + 2, pos.z);
        chassisApi.velocity.set(0, 0, 0);
        chassisApi.angularVelocity.set(0, 0, 0);
        chassisApi.rotation.set(0, rot.y, 0);

        resetWasPressed.current = true;
      }
    } else {
      resetWasPressed.current = false;
    }

    const speed = Math.sqrt(velocity.current[0] ** 2 + velocity.current[2] ** 2);
    const baseForce = boost ? 1500 : 800;
    // Tỉ lệ lực động cơ theo khối lượng để xe nặng (Rolls Royce) vẫn chạy nhanh
    const engineForce = baseForce * ((config.mass || 150) / 150);

    // ─── Cập nhật âm thanh động cơ theo tốc độ ──────────────────────────
    if (engineAudio.current) {
      // playbackRate: 0.7 (idle) → 1.8 (max speed)
      const targetRate = 0.7 + Math.min(speed * 0.04, 1.1);
      engineAudio.current.playbackRate = THREE.MathUtils.lerp(engineAudio.current.playbackRate, targetRate, 0.1);
      // Volume: tăng nhẹ khi ga
      const targetVol = forward || backward ? Math.min(0.22, 0.12 + speed * 0.005) : 0.08;
      engineAudio.current.volume = THREE.MathUtils.lerp(engineAudio.current.volume, targetVol, 0.1);
    }

    // ─── Âm thanh Nitro ──────────────────────────────────────────────────
    if (boost && !isNitroPlaying.current) {
      isNitroPlaying.current = true;
      if (!nitroAudio.current) {
        nitroAudio.current = new Audio('/sounds/vehicle/energy/Energy_-_force_field_8_loop.mp3');
        nitroAudio.current.loop = true;
      }
      nitroAudio.current.volume = 0.15;
      nitroAudio.current.play().catch(() => { });
    } else if (!boost && isNitroPlaying.current) {
      isNitroPlaying.current = false;
      if (nitroAudio.current) {
        nitroAudio.current.pause();
        nitroAudio.current.currentTime = 0;
      }
    }

    // Khôi phục Anti-Drift: Thêm lực nén nhưng giới hạn tối đa (cap) để không làm sập phuộc xe
    const downforce = Math.min(speed * 60, 1800);
    chassisApi.applyLocalForce([0, -downforce, 0], [0, 0, 0]);

    // Speed-sensitive steering (0.45 baseline như bản cũ bạn thích)
    const maxSteerVal = Math.max(0.1, 0.45 - (speed * 0.012));
    const steerSpeed = delta * 10;

    // Steering làm mượt
    if (left) {
      currentSteering.current += steerSpeed;
    } else if (right) {
      currentSteering.current -= steerSpeed;
    } else {
      if (Math.abs(currentSteering.current) > steerSpeed) {
        currentSteering.current -= steerSpeed * Math.sign(currentSteering.current);
      } else {
        currentSteering.current = 0;
      }
    }

    if (Math.abs(currentSteering.current) > maxSteerVal) {
      currentSteering.current = Math.sign(currentSteering.current) * maxSteerVal;
    }

    vehicleApi.setSteeringValue(currentSteering.current, 0);
    vehicleApi.setSteeringValue(currentSteering.current, 1);

    // Engine
    const finalEngineForce = folder === 'ship' ? engineForce * 2.5 : engineForce; // Xe tăng cần lực đẩy cực lớn
    if (forward) {
      vehicleApi.applyEngineForce(finalEngineForce, 2);
      vehicleApi.applyEngineForce(finalEngineForce, 3);
    } else if (backward) {
      vehicleApi.applyEngineForce(-finalEngineForce, 2);
      vehicleApi.applyEngineForce(-finalEngineForce, 3);
    } else {
      vehicleApi.applyEngineForce(0, 2);
      vehicleApi.applyEngineForce(0, 3);
    }

    // Logic Phanh tối ưu để tránh rung lắc
    if (brake !== isBraking.current) {
      isBraking.current = brake;
      if (brake) {
        chassisApi.linearDamping.set(0.95);
        chassisApi.angularDamping.set(1.0);
      } else {
        chassisApi.linearDamping.set(0.2);
        // Trả về 0.9 thay vì 0.3 để xe không bị tròng trành khi thả phím
        chassisApi.angularDamping.set(0.9);
      }
    }

    // --- Braking & Damping Logic ---
    if (brake) {
      vehicleApi.setBrake(100, 2);
      vehicleApi.setBrake(100, 3);
      chassisApi.linearDamping.set(0.95);
      chassisApi.angularDamping.set(1.0);
    } else if (!forward && !backward) {
      // Nhả ga: Để xe trôi tự nhiên (bánh sau vẫn xoay theo đà)
      // Chỉ phanh nhẹ khi tốc độ đã rất thấp để xe dừng hẳn
      const autoBrake = speed < 1.0 ? 15 * ((config.mass || 150) / 150) : 0;
      vehicleApi.setBrake(0, 0);
      vehicleApi.setBrake(0, 1);
      vehicleApi.setBrake(autoBrake, 2);
      vehicleApi.setBrake(autoBrake, 3);
    } else {
      // Đang chạy: nhả phanh
      vehicleApi.setBrake(0, 0);
      vehicleApi.setBrake(0, 1);
      vehicleApi.setBrake(0, 2);
      vehicleApi.setBrake(0, 3);
    }

    // --- Hard Stop Logic: Triệt tiêu rung lắc tuyệt đối khi xe gần dừng hẳn ---
    if (raceState === 'COUNTDOWN') {
      // Khóa chặt xe trong lúc đếm ngược
      chassisApi.velocity.set(0, 0, 0);
      chassisApi.angularVelocity.set(0, 0, 0);
      chassisApi.linearDamping.set(1.0);
      chassisApi.angularDamping.set(1.0);
    } else if (!forward && !backward && !left && !right && speed < 0.25) {
      chassisApi.velocity.set(0, 0, 0);
      chassisApi.angularVelocity.set(0, 0, 0);
      chassisApi.linearDamping.set(0.99);
      chassisApi.angularDamping.set(1.0);
    } else if (!brake) {
      // Trả lại damping bình thường khi đang lái xe
      chassisApi.linearDamping.set(0.2);
      chassisApi.angularDamping.set(0.9);
    }

    // ─── CAMERA ──────────────────────────────────────────────────────────
    if (!chassisRef.current) return;

    const currentPosition = new THREE.Vector3();
    chassisRef.current.getWorldPosition(currentPosition);
    const rawRot = chassisRef.current.rotation.y;

    // Làm mượt góc xoay để chống giật
    let diff = rawRot - smoothRot.current;
    diff = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;

    // Nếu là khung hình đầu tiên của xe mới, cho camera nhảy thẳng đến vị trí chuẩn
    if (firstFrame.current) {
      smoothRot.current = rawRot;
      firstFrame.current = false;
    } else {
      smoothRot.current += diff * (1 - Math.exp(-20 * dt));
    }

    const dist = camAngle.current.dist;
    const ax = camAngle.current.x;
    const ay = camAngle.current.y;

    const horizontalDist = Math.cos(ay) * dist;
    const offsetX = Math.sin(ax) * horizontalDist;
    const offsetY = Math.sin(ay) * dist;
    const offsetZ = Math.cos(ax) * horizontalDist;

    const idealOffset = new THREE.Vector3(offsetX, offsetY, offsetZ);
    idealOffset.applyEuler(new THREE.Euler(0, smoothRot.current, 0));

    // Khóa cứng Camera (copy) để triệt tiêu hiện tượng nhòe/bóng ma khi chạy nhanh
    camera.position.copy(currentPosition).add(idealOffset);

    const lookAtPos = currentPosition.clone().add(new THREE.Vector3(0, 0, -2).applyEuler(new THREE.Euler(0, smoothRot.current, 0)));
    camera.lookAt(lookAtPos);

    // Lưu vị trí và góc xoay cuối cho Minimap, Achievement và chuyển đổi xe
    lastPos.current = [currentPosition.x, currentPosition.y, currentPosition.z];
    lastRot.current = [0, smoothRot.current, 0];
  });

  return (
    <group ref={vehicle}>
      <group ref={chassisRef} name="chassis-body-visual">
        <mesh castShadow>
          <meshStandardMaterial visible={false} />
          <group position={[0, chassisY, 0]} rotation={[0, Math.PI / 2, 0]}>
            <primitive object={chassisScene} />
          </group>
        </mesh>
      </group>

      {wheelInfos.map((info, i) => {
        const p = info.chassisConnectionPointLocal;
        // Tính toán vị trí ban đầu của bánh xe để không bị biến dị ở frame 0
        const spawnPos = lastPos.current || [0, 0.5, 0];
        const spawnRot = lastRot.current || [0, 0, 0];

        // Quay điểm offset theo góc xoay của xe
        const v = new THREE.Vector3(p[0], p[1], p[2]).applyEuler(new THREE.Euler(spawnRot[0], spawnRot[1], spawnRot[2]));
        const initPos = [spawnPos[0] + v.x, spawnPos[1] + v.y, spawnPos[2] + v.z];

        const wheelRefs = [wheel0, wheel1, wheel2, wheel3];
        return (
          <Wheel
            key={i}
            ref={wheelRefs[i]}
            radius={wheelRadius}
            width={wheelHeight}
            leftSide={i % 2 === 0}
            folder={folder === 'ship' ? 'default' : folder}
            visible={folder !== 'ship'}
            position={initPos}
            rotation={spawnRot}
          />
        );
      })}
    </group>
  );
};

// ─── ENVIRONMENT & OBSTACLES ──────────────────────────────────────────────────

// ─── HELICOPTER COMPONENTS ──────────────────────────────────────────────────
const Propeller = ({ url, axis = 'y', position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, lastPos }) => {
  const { scene } = useGLTF(url);
  const rotRef = useRef();

  // Lấy danh sách mesh và căn tâm geometry (Logic từ GitHub)
  const meshes = useMemo(() => {
    const list = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        const g = child.geometry.clone();
        g.center(); // Đảm bảo xoay đúng tại tâm trục bánh xe
        list.push({ geometry: g, material: child.material });
      }
    });
    return list;
  }, [scene]);

  const keys = usePlayerControls();
  const speedRef = useRef(0);

  useFrame((state, delta) => {
    // Logic tốc độ: luôn có tốc độ nền (5) để cánh quạt không bao giờ dừng hẳn
    const isFlying = keys.current.up || keys.current.down || (lastPos && lastPos.current && lastPos.current[1] > 1.0);
    const targetSpeed = isFlying ? 50 : 10;
    const lerpFactor = isFlying ? 0.05 : 0.01;
    speedRef.current = THREE.MathUtils.lerp(speedRef.current, targetSpeed, lerpFactor);

    if (rotRef.current && speedRef.current > 0.1) {
      rotRef.current.rotation[axis] += delta * speedRef.current;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <group ref={rotRef}>
        {meshes.map((m, i) => (
          <mesh key={i} geometry={m.geometry} material={m.material} scale={scale} />
        ))}
      </group>
    </group>
  );
};

const Helicopter = ({ lastPos, lastRot, weather }) => {
  const { scene } = useGLTF('/models/car/helicopter/chassis.glb');
  const camAngle = useRef({ x: 0, y: 0.35, dist: 12 });
  const smoothRot = useRef(0);
  const k = usePlayerControls();
  const carLightRef = useRef();

  // ─── HELICOPTER ROTOR SOUND ───────────────────────────────────────────
  const rotorAudio = useRef(null);
  useEffect(() => {
    const audio = new Audio('/sounds/vehicle/spin/41051 Glass stone turning loop 09-full.mp3');
    audio.loop = true;
    audio.volume = 0.12;
    audio.playbackRate = 0.6;
    rotorAudio.current = audio;
    audio.play().catch(() => { });
    return () => { audio.pause(); audio.currentTime = 0; };
  }, []);

  // ─── PHYSICS BODY (HỒN) ─────────────────────────────────────────────────────
  // Sử dụng Compound Body để có Hitbox chuẩn (Thân + Đuôi)
  const [physicsRef, api] = useCompoundBody(() => ({
    mass: 1,
    type: 'Dynamic',
    position: [lastPos.current[0], lastPos.current[1] + 2, lastPos.current[2]],
    shapes: [
      { type: 'Box', args: [1.2, 0.8, 1.5], position: [0, 0, 0] }, // Lõi trung tâm
      { type: 'Sphere', args: [0.8], position: [0, 0, -1.2] },    // Mũi máy bay (Bọc bi)
      { type: 'Sphere', args: [0.6], position: [0, 0.2, 1.0] },   // Phần đầu đuôi
      { type: 'Sphere', args: [0.4], position: [0, 0.3, 2.2] }    // Cuối đuôi
    ],
    fixedRotation: true,
    linearDamping: 0.5,
    angularDamping: 0.5,
    allowSleep: false,
  }));

  // ─── VISUAL REF (XÁC) ──────────────────────────────────────────────────────
  const visualRef = useRef();

  const localState = useRef({
    pos: new THREE.Vector3().fromArray(lastPos.current),
    rot: 0,
    vel: new THREE.Vector3(),
    propSpeed: 0
  });

  useEffect(() => {
    let down = false;
    const onWheel = (e) => camAngle.current.dist = Math.max(5, Math.min(50, camAngle.current.dist + e.deltaY * 0.05));
    const onDown = (e) => { if (e.button === 1) down = true; };
    const onUp = (e) => { if (e.button === 1) down = false; };
    const onMove = (e) => {
      if (!down) return;
      camAngle.current.x -= e.movementX * 0.005;
      camAngle.current.y = Math.max(0.05, Math.min(Math.PI / 2.1, camAngle.current.y + e.movementY * 0.005));
    };
    window.addEventListener('wheel', onWheel);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  useFrame((state, delta) => {
    if (carLightRef.current && weather) {
      // Light logic removed as requested
    }

    if (!visualRef.current || !physicsRef.current) return;
    const controls = k.current;

    // Các thông số bay chậm và mượt hơn
    const SPEED = 20;
    const VERT_SPEED = 10;
    const YAW_SPEED = 1.5;

    // Cập nhật âm thanh cánh quạt theo trạng thái bay
    if (rotorAudio.current) {
      const isFlying = controls.forward || controls.backward || controls.up || controls.down;
      const targetRate = isFlying ? 1.2 : 0.6;
      const targetVol = isFlying ? 0.2 : 0.1;
      rotorAudio.current.playbackRate = THREE.MathUtils.lerp(rotorAudio.current.playbackRate, targetRate, 0.05);
      rotorAudio.current.volume = THREE.MathUtils.lerp(rotorAudio.current.volume, targetVol, 0.05);
    }

    // 1. Xử lý xoay (Yaw)
    if (controls.left) localState.current.rot += YAW_SPEED * delta;
    if (controls.right) localState.current.rot -= YAW_SPEED * delta;

    // 2. Tính toán vận tốc mục tiêu
    const targetVel = new THREE.Vector3();
    if (controls.forward) {
      targetVel.z = -Math.cos(localState.current.rot) * SPEED;
      targetVel.x = -Math.sin(localState.current.rot) * SPEED;
    } else if (controls.backward) {
      targetVel.z = Math.cos(localState.current.rot) * SPEED;
      targetVel.x = Math.sin(localState.current.rot) * SPEED;
    }

    if (controls.up) targetVel.y = VERT_SPEED;
    else if (controls.down) targetVel.y = -VERT_SPEED;

    // 3. Làm mượt vận tốc (Lerp)
    localState.current.vel.lerp(targetVel, 0.1);

    // 4. Đẩy vận tốc vào vật lý (Để nó tự dừng khi đụng tường)
    api.velocity.set(localState.current.vel.x, localState.current.vel.y, localState.current.vel.z);
    api.angularVelocity.set(0, 0, 0); // Chống xoay bậy bạ
    api.rotation.set(0, localState.current.rot, 0);

    // 5. Lấy vị trí thực tế từ Physics (Hồn) để đồng bộ vào Xác (Visual)
    const currentPos = new THREE.Vector3();
    physicsRef.current.getWorldPosition(currentPos);

    visualRef.current.position.copy(currentPos);
    visualRef.current.rotation.y = localState.current.rot;

    // Lưu vị trí cuối cho hệ thống chuyển đổi xe
    lastPos.current = [currentPos.x, currentPos.y, currentPos.z];

    const dt = Math.min(delta, 0.1);
    let diff = localState.current.rot - smoothRot.current;
    diff = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;
    smoothRot.current += diff * (1 - Math.exp(-10 * dt));

    const dist = camAngle.current.dist;
    const hDist = Math.cos(camAngle.current.y) * dist;
    const offset = new THREE.Vector3(Math.sin(camAngle.current.x) * hDist, Math.sin(camAngle.current.y) * dist, Math.cos(camAngle.current.x) * hDist).applyEuler(new THREE.Euler(0, smoothRot.current, 0));

    state.camera.position.copy(currentPos).add(offset);
    state.camera.lookAt(currentPos.clone().add(new THREE.Vector3(0, 0, -2).applyEuler(new THREE.Euler(0, smoothRot.current, 0))));
  });

  return (
    <>
      {/* Khối vật lý tàng hình (Đã xóa mesh thừa để tránh lỗi Hitbox On) */}
      <group ref={physicsRef} />

      {/* Mô hình hiển thị thực sự */}
      <group ref={visualRef}>
        <primitive object={scene.clone()} />
        {/* Cánh quạt chính - Thông số chuẩn GitHub */}
        <Propeller
          lastPos={lastPos}
          url="/models/car/helicopter/rotor_main.glb"
          axis="y"
          position={[-0.009, 0.75, 0.01]}
          scale={0.01}
        />
        {/* CHỈNH CÁNH ĐUÔI Ở DƯỚI ĐÂY: */}
        {/* position: [Trái/Phải, Lên/Xuống, Trước/Sau] */}
        {/* rotation: [X, Y, Z] - Hãy chỉnh con số 1.47 để nắn độ nghiêng */}
        <Propeller
          lastPos={lastPos}
          url="/models/car/helicopter/rotor_tail.glb"
          axis="y"
          position={[-0.15, 0.83, 1.59]}
          scale={0.002}
          rotation={[0, 0, 1.52]}
        />
      </group>
    </>
  );
};

// ─── GROUND ──────────────────────────────────────────────────────────────────
const Ground = () => {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0] }));
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[2000, 2000]} />
      <meshStandardMaterial color="#FF7A2F" roughness={1} metalness={0} />
    </mesh>
  );
};




// ─── MAP OBJECT (dùng useBox đơn giản) ───────────────────────────────────────
const MapObject = ({ filename, position, args = [2, 2, 2], scale = 1, rotation = [0, 0, 0], hasPhysics = true }) => {
  const { scene } = useGLTF(`/models/map/${filename}`);
  const [ref] = useBox(() => ({
    type: 'Static',
    position,
    args,
    rotation,
    collisionFilterGroup: hasPhysics ? 1 : 0,
    collisionFilterMask: hasPhysics ? 1 : 0,
  }));

  if (!hasPhysics) {
    return <primitive object={scene.clone()} position={position} scale={scale} rotation={rotation} />;
  }
  return <primitive ref={ref} object={scene.clone()} scale={scale} />;
};

// ─── MAP WITH COLLISION (Trimesh 100% ôm sát bề mặt) ──────
const MapCollision = ({ collisionFile, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const { scene } = useGLTF(`/models/map/${collisionFile}`);

  const meshes = useMemo(() => {
    const list = [];
    const cloned = scene.clone();
    cloned.updateWorldMatrix(true, true);

    cloned.traverse(node => {
      if (node.isMesh && node.geometry) {
        const geom = node.geometry.clone();
        geom.applyMatrix4(node.matrixWorld);

        if (scale !== 1) {
          const scaleMat = new THREE.Matrix4().makeScale(scale, scale, scale);
          geom.applyMatrix4(scaleMat);
        }

        const posArr = geom.attributes.position.array;
        if (!posArr || posArr.length === 0) return;

        let indices;
        if (geom.index) {
          indices = new Uint32Array(geom.index.array);
        } else {
          indices = new Uint32Array(posArr.length / 3);
          for (let i = 0; i < indices.length; i++) indices[i] = i;
        }

        const vertices = new Float32Array(posArr);

        if (vertices.length > 0 && indices.length > 0) {
          list.push({ vertices, indices });
        }
      }
    });
    return list;
  }, [scene, scale]);

  return (
    <>
      {meshes.map((m, i) => (
        <TrimeshCollider
          key={`tri-${i}`}
          vertices={m.vertices}
          indices={m.indices}
          position={position}
          rotation={rotation}
          allowSleep={true} // Cho phép ngủ để tăng hiệu năng
        />
      ))}
    </>
  );
};

const TrimeshCollider = ({ vertices, indices, position, rotation }) => {
  const [ref] = useTrimesh(() => ({
    mass: 0,
    type: 'Static',
    position,
    rotation,
    args: [vertices, indices],
  }));
  return <mesh ref={ref} />;
};

const MapWithPhysics = ({ mapFile = 'map.glb', collisionFile = 'map_collision.glb', position = [0, 0, 0], scale = 1, rotation = [0, 0, 0] }) => {
  const { scene } = useGLTF(`/models/map/${mapFile}`);

  return (
    <>
      {/* Hiển thị map đẹp */}
      <primitive object={scene.clone()} position={position} scale={scale} rotation={rotation} />
      {/* Hitbox từ file collision */}
      <MapCollision collisionFile={collisionFile} position={position} rotation={rotation} scale={scale} />
    </>
  );
};

// ─── PRELOAD MODELS ─────────────────────────────────────────────────────────
useGLTF.preload('/models/car/helicopter/chassis.glb');
useGLTF.preload('/models/car/helicopter/rotor_main.glb');
useGLTF.preload('/models/car/helicopter/rotor_tail.glb');
useGLTF.preload('/models/car/default/chassis.glb');
useGLTF.preload('/models/car/default/wheel.glb');
useGLTF.preload('/models/car/alternative/chassis2.glb');
useGLTF.preload('/models/car/alternative/wheel2.glb');
useGLTF.preload('/models/car/rolls_royce/chassis.glb');
useGLTF.preload('/models/car/rolls_royce/wheel.glb');
useGLTF.preload('/models/car/ship/chassis.glb');

// ─── APP ─────────────────────────────────────────────────────────────────────
function Game({ weather, vehicleFolder, setVehicleFolder, debug, userName, userAvatar, gold, setGold, unlockedAchievements, setUnlockedAchievements }) {
  const { raceState, resetRace, endRace, setPlayerName, setPlayerAvatar } = useContext(RaceContext);
  const controls = usePlayerControls();

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('racestate-change', { detail: raceState }));
  }, [raceState]);

  // Tọa độ an toàn toàn cục (Hạ thấp xuống 0.5m để vào game là chạy được ngay)
  const lastPos = useRef([0, 0.5, 0]);
  const lastRot = useRef([0, 0, 0]);

  // Tọa độ dịch chuyển xe VÀO ĐƯỜNG ĐUA (khi nhấn E / click bảng)
  // Đây là vạch xuất phát thực tế trên đường đua
  const teleportPos = [172, 1, -303];

  const teleportToTrack = () => {
    window.dispatchEvent(new CustomEvent('teleport-start', {
      detail: { name: 'Vạch Xuất Phát', position: teleportPos, rotation: 0 }
    }));
  };

  // ─── Ép tọa độ an toàn mỗi khi đổi xe (chạy trước khi xe mới mount) ───
  useEffect(() => {
    if (lastPos.current) {
      lastPos.current = [lastPos.current[0], Math.max(lastPos.current[1], 0.5), lastPos.current[2]];
    }
    if (lastRot.current) {
      lastRot.current = [0, lastRot.current[1], 0];
    }
  }, [vehicleFolder]);

  const countdownControls = { forward: false, backward: false, left: false, right: false, brake: true, reset: false, shift: false, horn: false };

  let VehicleContainer;
  if (vehicleFolder === 'helicopter') {
    VehicleContainer = <Helicopter key="helicopter" lastPos={lastPos} lastRot={lastRot} weather={weather} />;
  } else {
    VehicleContainer = (
      <Car
        key={vehicleFolder}
        folder={vehicleFolder}
        lastPos={lastPos}
        lastRot={lastRot}
        controls={raceState === 'COUNTDOWN' ? countdownControls : controls}
        weather={weather}
      />
    );
  }

  const contents = (
    <>
      <Suspense fallback={null}>
        {VehicleContainer}
      </Suspense>
      <RaceTrack
        position={[180, 0, -300]}
        scale={0.7}
        onEnterTrack={teleportToTrack}
        sensorOffset={[-100, 0, 50]}
        sensorRadius={30}
        uiScale={1.2}
        sensorRotation={-90}
        finishOffset={[-8, 1, 5]}
        startLinePos={teleportPos}
      />
      <Ground />
      <MapWithPhysics mapFile="map.glb" collisionFile="map_collision.glb" position={[0, 0, 0]} scale={1} />

      {/* Hệ thống coin */}
      {raceState === 'IDLE' && (
        <MapCoins numCoins={15} onCollect={(value) => {
          setGold(prev => {
            const newGold = prev + value;
            const accountsStr = localStorage.getItem('game_accounts');
            if (accountsStr && !userName.startsWith('Khách_')) {
              const accounts = JSON.parse(accountsStr);
              if (accounts[userName]) {
                accounts[userName].gold = newGold;
                localStorage.setItem('game_accounts', JSON.stringify(accounts));
              }
            }
            window.dispatchEvent(new CustomEvent('coin-collected', { detail: { value } }));
            return newGold;
          });
        }} />
      )}
      <AchievementSystem
        lastPos={lastPos}
        unlocked={unlockedAchievements}
        onUnlock={(key) => setUnlockedAchievements(prev => [...new Set([...prev, key])])}
      />
    </>
  );

  // Tự động đưa xe về Billboard sau khi đua xong
  useEffect(() => {
    if (raceState === 'FINISHED') {
      const timer = setTimeout(() => {
        const billboardPos = [99, 1, -258];
        window.dispatchEvent(new CustomEvent('teleport-start', {
          detail: { name: 'Đường Đua', position: billboardPos, rotation: -Math.PI / 2 }
        }));

        // QUAN TRỌNG: Đưa trạng thái về IDLE để cái bảng hiện ra trở lại
        resetRace();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [raceState, resetRace]);

  // Hủy đua khi teleport ra ngoài đường đua bằng minimap
  useEffect(() => {
    const handleForceEnd = () => {
      if (raceState !== 'IDLE') {
        console.log('🚫 Đua bị hủy — teleport ra ngoài đường đua');
        endRace();
      }
    };
    window.addEventListener('race-force-end', handleForceEnd);
    return () => window.removeEventListener('race-force-end', handleForceEnd);
  }, [raceState, endRace]);

  // Đồng bộ tên và avatar người chơi từ App sang RaceManager
  useEffect(() => {
    setPlayerName(userName);
    setPlayerAvatar(userAvatar);
  }, [userName, userAvatar, setPlayerName, setPlayerAvatar]);

  return (
    <Physics
      gravity={[0, -9.81, 0]}
      allowSleep={true}
      iterations={12}
      tolerance={0.002}
      broadphase="SAP"
      defaultContactMaterial={{
        friction: 0.3,
        restitution: 0.1,
        contactEquationStiffness: 1e7,
        contactEquationRelaxation: 4
      }}
    >
      {debug ? <Debug color="white" scale={1.02}>{contents}</Debug> : contents}
    </Physics>
  );
}

const simulateKey = (code, isDown) => {
  const event = new KeyboardEvent(isDown ? 'keydown' : 'keyup', { code, bubbles: true });
  window.dispatchEvent(event);
};

const MobileControls = ({ vehicleFolder }) => {
  useEffect(() => {
    const preventContext = (e) => e.preventDefault();
    document.addEventListener('contextmenu', preventContext);
    return () => document.removeEventListener('contextmenu', preventContext);
  }, []);

  const handlePointerDown = (code) => (e) => {
    e.preventDefault();
    simulateKey(code, true);
  };

  const handlePointerUp = (code) => (e) => {
    e.preventDefault();
    simulateKey(code, false);
  };

  return (
    <div className="mobile-controls">
      <div className="mc-left">
        <button className="mc-btn" onPointerDown={handlePointerDown('KeyA')} onPointerUp={handlePointerUp('KeyA')} onPointerLeave={handlePointerUp('KeyA')}>◀</button>
        <button className="mc-btn" onPointerDown={handlePointerDown('KeyD')} onPointerUp={handlePointerUp('KeyD')} onPointerLeave={handlePointerUp('KeyD')}>▶</button>
        <button className="mc-btn action-btn" style={{ marginLeft: '10px' }} onPointerDown={handlePointerDown('ShiftLeft')} onPointerUp={handlePointerUp('ShiftLeft')} onPointerLeave={handlePointerUp('ShiftLeft')}>{vehicleFolder === 'helicopter' ? 'Xuống' : 'Nitro'}</button>
      </div>

      <div className="mc-top-right">
        {vehicleFolder !== 'helicopter' && vehicleFolder !== 'ship' && (
          <button className="mc-btn action-btn" style={{ fontSize: '20px' }} onPointerDown={handlePointerDown('KeyH')} onPointerUp={handlePointerUp('KeyH')} onPointerLeave={handlePointerUp('KeyH')}>📢</button>
        )}
        <button className="mc-btn action-btn" onPointerDown={handlePointerDown('Space')} onPointerUp={handlePointerUp('Space')} onPointerLeave={handlePointerUp('Space')}>{vehicleFolder === 'helicopter' ? 'Lên' : 'Phanh'}</button>
      </div>

      <div className="mc-right">
        <button className="mc-btn gas-btn" onPointerDown={handlePointerDown('KeyW')} onPointerUp={handlePointerUp('KeyW')} onPointerLeave={handlePointerUp('KeyW')}>▲</button>
        <button className="mc-btn brake-btn" onPointerDown={handlePointerDown('KeyS')} onPointerUp={handlePointerUp('KeyS')} onPointerLeave={handlePointerUp('KeyS')}>▼</button>
      </div>
    </div>
  );
};

export default function App() {
  const [vehicleFolder, setVehicleFolder] = useState('default');
  const [isPending, startTransition] = useTransition();
  const vehicleLoadProgress = useVehicleLoadProgress();
  // Cooldown 4 giây sau khi đổi xe — tránh switch quá nhanh gây lỗi physics
  const [vehicleCooldown, setVehicleCooldown] = useState(0); // giây còn lại
  const cooldownTimer = useRef(null);

  const handleSelectVehicle = useCallback((folder) => {
    if (vehicleCooldown > 0) return; // Đang trong cooldown, bỏ qua
    playSound('click', 0.3);
    startTransition(() => setVehicleFolder(folder));
    setShowMenu(false);
    // Bắt đầu đếm ngược 4 giây
    setVehicleCooldown(4);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setVehicleCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownTimer.current);
          cooldownTimer.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [vehicleCooldown, startTransition]);

  useEffect(() => () => { if (cooldownTimer.current) clearInterval(cooldownTimer.current); }, []);
  const [showMenu, setShowMenu] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [debug, setDebug] = useState(false);
  const [weather, setWeather] = useState(WEATHER_PRESETS.sunny);
  const [masterMuted, setMasterMuted] = useState(false);
  const [isRacing, setIsRacing] = useState(false);

  useEffect(() => {
    const handleRaceState = (e) => setIsRacing(e.detail !== 'IDLE');
    window.addEventListener('racestate-change', handleRaceState);
    return () => window.removeEventListener('racestate-change', handleRaceState);
  }, []);

  const activeWeather = isRacing ? WEATHER_PRESETS.sunny : weather;

  // Hệ thống vàng và xe đã mở khóa
  const [gold, setGold] = useState(10000); // Tặng 10,000 vàng khởi đầu để người chơi thoải mái mua sắm
  const [unlockedVehicles, setUnlockedVehicles] = useState(['default']);

  // Hệ thống hồ sơ người chơi
  const [userName, setUserName] = useState('Người Chơi 1');
  const [userAvatar, setUserAvatar] = useState('👤');
  const [showProfile, setShowProfile] = useState(false); // Không hiện profile lúc đầu nữa vì đã có màn hình login
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGameLoading, setIsGameLoading] = useState(true);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [showAchievements, setShowAchievements] = useState(false);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    setShowProfile(false);
    const accountsStr = localStorage.getItem('game_accounts');
    if (accountsStr && !userName.startsWith('Khách_')) {
      const accounts = JSON.parse(accountsStr);
      if (accounts[userName]) {
        accounts[userName].avatar = userAvatar;
        localStorage.setItem('game_accounts', JSON.stringify(accounts));
      }
    }
  };

  const avatars = ['👤', '🏎️', '🚓', '🚁', '🚜', '🚢', '🚀', '🐱', '🐶', '🔥', '⚡'];

  const vehiclePrices = {
    alternative: 500,
    helicopter: 1500,
    ship: 1000,
    rolls_royce: 2500
  };

  const buyVehicle = (type) => {
    const price = vehiclePrices[type];
    if (gold >= price) {
      playSound('ding', 0.5);
      const newGold = gold - price;
      setGold(newGold);

      setUnlockedVehicles(prev => {
        const newVehicles = [...prev, type];
        const accountsStr = localStorage.getItem('game_accounts');
        if (accountsStr && !userName.startsWith('Khách_')) {
          const accounts = JSON.parse(accountsStr);
          if (accounts[userName]) {
            accounts[userName].gold = newGold;
            accounts[userName].unlockedVehicles = newVehicles;
            localStorage.setItem('game_accounts', JSON.stringify(accounts));
          }
        }
        return newVehicles;
      });

      const vehicleNames = { alternative: 'Xe Cảnh Sát', helicopter: 'Máy Bay', ship: 'Xe Tăng', rolls_royce: 'Rolls Royce' };
      alert(`Chúc mừng! Bạn đã mở khóa ${vehicleNames[type]}!`);
    } else {
      alert('Bạn không đủ vàng!');
    }
  };

  // Toggle master mute
  const toggleMasterMute = useCallback(() => {
    setMasterMuted(prev => {
      const next = !prev;
      setGlobalMuted(next);
      return next;
    });
  }, []);

  // ─── FIREBASE SYNC ────────────────────────────────────────────────────────
  useEffect(() => {
    const syncData = async () => {
      if (isLoggedIn && auth.currentUser) {
        try {
          const userRef = doc(db, "users", auth.currentUser.uid);
          await updateDoc(userRef, {
            gold,
            unlockedVehicles,
            unlockedAchievements,
            userName,
            userAvatar
          });
          console.log("Data synced to Firebase");
        } catch (err) {
          console.error("Error syncing data:", err);
        }
      } else if (!isLoggedIn && !userName.startsWith('Khách')) {
        // Fallback for non-logged in users (local save)
        localStorage.setItem('last_gold', gold);
        localStorage.setItem('last_vehicles', JSON.stringify(unlockedVehicles));
        localStorage.setItem('game_achievements', JSON.stringify(unlockedAchievements));
      }
    };

    // Debounce sync to avoid too many writes
    const timer = setTimeout(syncData, 1000);
    return () => clearTimeout(timer);
  }, [gold, unlockedVehicles, userName, userAvatar, isLoggedIn]);



  return (
    <RaceManager>
      <div style={{ width: '100vw', height: '100vh', background: `linear-gradient(to bottom, ${activeWeather.skyTop}, ${activeWeather.skyBottom})`, transition: 'background 8s ease, all 8s ease', margin: 0, padding: 0, overflow: 'hidden', position: 'relative', fontFamily: 'Arial, sans-serif' }}>
        {isGameLoading && <LoadingScreen onFinished={() => setIsGameLoading(false)} />}
        {!isLoggedIn && (
          <LoginScreen onLoginSuccess={(name, isGuest, savedAvatar, savedGold, savedVehicles, savedAchievements) => {
            setUserName(name);
            setIsLoggedIn(true);
            if (savedAvatar) setUserAvatar(savedAvatar);
            if (savedGold !== undefined) setGold(savedGold);
            if (savedVehicles) setUnlockedVehicles(savedVehicles);
            if (savedAchievements) setUnlockedAchievements(savedAchievements);
            if (isGuest) setShowProfile(true);
          }} />
        )}

        <AchievementUI />
        <AchievementBoard
          isOpen={showAchievements}
          onClose={() => setShowAchievements(false)}
          unlocked={unlockedAchievements}
        />

        {/* Nút mở Achievement Board — Chuyển lên trên góc phải (dưới thời tiết) */}
        <button
          onClick={() => setShowAchievements(true)}
          style={{
            position: 'fixed',
            top: '70px',
            right: '15px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            border: '3px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(255, 170, 0, 0.4)',
            cursor: 'pointer',
            fontSize: '24px',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
        >
          🏆
        </button>

        <style>{`
          * { margin:0; padding:0; box-sizing:border-box; }
          body { overflow:hidden; }
          
          .top-ui {
            position: absolute;
            top: 20px;
            left: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 100;
          }

          /* Ẩn nút ảo trên máy tính (nơi có chuột thực sự), hiện trên mọi màn hình cảm ứng kể cả lúc xoay ngang */
          @media (hover: hover) and (pointer: fine) {
            .mobile-controls { display: none !important; }
          }
          .mobile-controls {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            pointer-events: none;
            z-index: 50;
          }
          .mc-btn {
            pointer-events: auto;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.4);
            color: white;
            border-radius: 50%;
            font-size: 24px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            -webkit-user-select: none;
            touch-action: none;
            cursor: pointer;
          }
          .mc-btn:active { background: rgba(255, 255, 255, 0.5); transform: scale(0.95); }
          .mc-left { position: absolute; bottom: 30px; left: 20px; display: flex; gap: 15px; }
          .mc-left .mc-btn { width: 60px; height: 60px; }
          .mc-left .small-btn { width: 40px; height: 40px; font-size: 16px; margin-top: 10px; }
          
          .mc-right { position: absolute; bottom: 30px; right: 20px; display: flex; flex-direction: column; gap: 15px; }
          .mc-right .mc-btn { width: 60px; height: 60px; }
          .mc-right .gas-btn { border-radius: 15px; background: rgba(76, 175, 80, 0.4); }
          .mc-right .brake-btn { border-radius: 15px; background: rgba(244, 67, 54, 0.4); }

          .mc-top-right { position: absolute; top: 50%; right: 20px; transform: translateY(-50%); display: flex; flex-direction: column; gap: 15px; }
          .mc-top-right .action-btn { width: 60px; height: 60px; border-radius: 50%; font-size: 14px; background: rgba(33, 150, 243, 0.4); }


          .user-profile-hud {
            background: rgba(0, 0, 0, 0.7);
            padding: 8px 20px 8px 8px;
            border-radius: 50px;
            display: flex;
            align-items: center;
            gap: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            cursor: pointer;
            transition: all 0.3s;
            backdrop-filter: blur(10px);
          }
          .user-profile-hud:hover { background: rgba(0, 0, 0, 0.8); transform: scale(1.02); }
          
          .hud-avatar {
            width: 42px;
            height: 42px;
            background: #333;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            border: 2px solid #FF7A2F;
            overflow: hidden;
          }
          .hud-avatar img { width: 100%; height: 100%; object-fit: cover; }

          .hud-info { display: flex; flex-direction: column; }
          .hud-name { color: white; font-weight: bold; font-size: 14px; }
          .hud-gold { color: #FFD700; font-size: 12px; font-weight: bold; }

          .menu-button, .shop-button {
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 12px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
          }

          .menu-button:hover, .shop-button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
          }

          .shop-button { background: rgba(255, 122, 47, 0.5); border-color: #FF7A2F; }

          .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            backdrop-filter: blur(8px);
          }
          
          .overlay.active { display: flex; }
          
          .menu-card {
            background: #111;
            padding: 40px;
            border-radius: 32px;
            text-align: center;
            max-width: 600px;
            width: 95%;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          }

          .menu-card h2 { color: white; margin-bottom: 25px; font-size: 28px; text-transform: uppercase; }
          
          .profile-edit-input {
            width: 100%;
            padding: 15px;
            background: #222;
            border: 2px solid #333;
            border-radius: 12px;
            color: white;
            font-size: 18px;
            margin-bottom: 10px;
            text-align: center;
          }
          .profile-edit-input:focus { border-color: #FF7A2F; outline: none; }

          .avatar-preview-large {
            width: 120px;
            height: 120px;
            background: #222;
            border-radius: 50%;
            margin: 0 auto 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 60px;
            border: 4px solid #FF7A2F;
            overflow: hidden;
            cursor: pointer;
            position: relative;
            transition: transform 0.3s;
          }
          .avatar-preview-large:hover { transform: scale(1.05); }
          .avatar-preview-large img { width: 100%; height: 100%; object-fit: cover; }
          
          .change-photo-btn {
            background: #FF7A2F;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            margin-bottom: 20px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
          }

          .avatar-selector {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin-bottom: 20px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
          }
          .avatar-item {
            font-size: 32px;
            padding: 10px;
            background: #222;
            border-radius: 12px;
            cursor: pointer;
            transition: 0.2s;
            border: 2px solid transparent;
          }
          .avatar-item:hover { transform: scale(1.1); background: #333; }
          .avatar-item.selected { border-color: #FF7A2F; background: #332211; }

          .upload-hint { color: #888; font-size: 13px; margin-bottom: 15px; }

          .vehicle-options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
          }
          
          .vehicle-option {
            background: #222;
            padding: 20px;
            border-radius: 24px;
            cursor: pointer;
            transition: all 0.3s;
            border: 2px solid transparent;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .vehicle-option:hover:not(.loading) { background: #2a2a2a; transform: translateY(-5px); }
          .vehicle-option.selected { border-color: #FF7A2F; background: #332211; }
          .vehicle-option.loading {
            opacity: 0.6;
            cursor: not-allowed;
            border-color: #444;
            filter: grayscale(0.4);
          }
          .load-bar {
            width: 100%;
            height: 4px;
            background: #333;
            border-radius: 2px;
            overflow: hidden;
            margin-top: 8px;
          }
          .load-fill {
            height: 100%;
            background: linear-gradient(90deg, #00f2ff, #7000ff);
            border-radius: 2px;
            transition: width 0.3s ease;
            box-shadow: 0 0 6px #00f2ff88;
          }
          
          .vehicle-icon { font-size: 40px; margin-bottom: 10px; }
          .vehicle-option h3 { color: white; font-size: 14px; margin: 0; }
          .price-tag { color: #FFD700; font-weight: bold; margin-top: 10px; font-size: 14px; }

          .cooldown-badge {
            display: inline-block;
            margin-left: 10px;
            padding: 3px 10px;
            background: linear-gradient(90deg, #ff6600, #ff9900);
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: bold;
            color: white;
            vertical-align: middle;
            animation: pulseBadge 1s ease-in-out infinite;
            box-shadow: 0 0 8px #ff990066;
          }
          @keyframes pulseBadge {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.75; transform: scale(0.95); }
          }


          .buy-btn, .save-btn {
            margin-top: 15px;
            padding: 14px 25px;
            background: #FF7A2F;
            border: none;
            color: white;
            border-radius: 16px;
            cursor: pointer;
            font-weight: bold;
            width: 100%;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .close-btn {
            padding: 12px 40px;
            background: #333;
            border: none;
            color: white;
            border-radius: 12px;
            cursor: pointer;
            font-weight: bold;
          }

          /* Tối ưu hóa UI cho điện thoại màn hình dọc và màn hình xoay ngang (Landscape) */
          @media (max-width: 900px), (max-height: 600px) {
            .menu-card { padding: 15px; max-height: 85vh; overflow-y: auto; }
            .menu-card h2 { font-size: 18px; margin-bottom: 10px; }
            /* Dùng auto-fit để tự động giãn cột: dọc thì 2 cột, ngang thì 3-4 cột tùy chiều rộng */
            .vehicle-options { grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; margin-bottom: 15px; }
            .vehicle-option { padding: 10px; border-radius: 12px; }
            .vehicle-icon { font-size: 26px; margin-bottom: 5px; }
            .vehicle-option h3 { font-size: 12px; }
            .price-tag { font-size: 11px; margin-top: 5px; }
            .buy-btn, .save-btn { padding: 8px 10px; font-size: 12px; border-radius: 10px; margin-top: 8px; }
            .close-btn { width: 100%; padding: 10px 15px; font-size: 14px; }
            
            .avatar-selector { grid-template-columns: repeat(5, 1fr); gap: 5px; margin-bottom: 10px; }
            .avatar-item { font-size: 20px; padding: 4px; }
            .avatar-preview-large { width: 60px; height: 60px; font-size: 30px; margin-bottom: 10px; }
            .change-photo-btn { font-size: 10px; padding: 5px 10px; margin-bottom: 10px; }
            
            .top-ui { flex-wrap: wrap; gap: 6px; top: 10px; left: 10px; right: 10px; }
            .user-profile-hud { padding: 4px 12px 4px 4px; }
            .hud-avatar { width: 28px; height: 28px; font-size: 14px; }
            .hud-name { font-size: 11px; }
            .hud-gold { font-size: 10px; }
            .menu-button, .shop-button { padding: 6px 10px; font-size: 11px; border-radius: 6px; }
            
            /* Giảm kích thước nút bấm ảo và sửa lỗi đè nút khi xoay ngang */
            .mc-btn { width: 50px; height: 50px; font-size: 18px; }
            .mc-left .mc-btn, .mc-right .mc-btn { width: 50px; height: 50px; }
            .mc-top-right .action-btn { width: 50px; height: 50px; font-size: 12px; }
            .mc-left, .mc-right { bottom: 50px; }
            .mc-left { left: 20px; }
            .mc-right { right: 20px; }
            .mc-top-right { 
              top: auto; bottom: 50px; right: 85px; 
              transform: none; 
              flex-direction: column; 
              gap: 6px; 
            }
            .mc-right { gap: 6px; }
          }
        `}</style>

        {/* Top HUD */}
        <div className="top-ui">
          <div className="user-profile-hud" onClick={() => setShowProfile(true)}>
            <div className="hud-avatar">
              {userAvatar.length > 5 ? <img src={userAvatar} alt="avatar" /> : userAvatar}
            </div>
            <div className="hud-info">
              <span className="hud-name">{userName}</span>
              <span className="hud-gold">💰 {gold.toLocaleString()}</span>
            </div>
          </div>
          <button className="menu-button" onClick={() => { playSound('click', 0.3); setShowMenu(true); }}>Ga-ra</button>
          <button className="shop-button" onClick={() => { playSound('click', 0.3); setShowShop(true); }}>Shop 🛒</button>
          <button className="menu-button" onClick={() => setDebug(!debug)} style={{ background: debug ? '#ff4444' : 'rgba(255,255,255,0.15)', border: debug ? '1px solid #ff0000' : '1px solid rgba(255,255,255,0.2)' }}>
            Hitbox: {debug ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Profile Edit Overlay */}
        <div className={`overlay ${showProfile ? 'active' : ''}`}>
          <div className="menu-card">
            <h2>Thiết Lập Hồ Sơ</h2>

            <div className="avatar-preview-large" onClick={() => document.getElementById('avatar-input').click()}>
              {userAvatar.length > 5 ? <img src={userAvatar} alt="avatar" /> : userAvatar}
            </div>
            <button className="change-photo-btn" onClick={() => document.getElementById('avatar-input').click()}>
              📸 TẢI ẢNH TỪ MÁY TÍNH
            </button>

            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarUpload}
            />
            <p className="upload-hint">Hoặc chọn một biểu tượng sẵn có:</p>

            <div className="avatar-selector">
              {avatars.map(a => (
                <div
                  key={a}
                  className={`avatar-item ${userAvatar === a ? 'selected' : ''}`}
                  onClick={() => setUserAvatar(a)}
                >
                  {a}
                </div>
              ))}
            </div>

            <input
              className="profile-edit-input"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Nhập tên của bạn..."
              maxLength={20}
            />

            <button className="save-btn" onClick={handleSaveProfile}>LƯU</button>
          </div>
        </div>


        {/* Ga-ra Overlay */}
        <div className={`overlay ${showMenu ? 'active' : ''}`}>
            <div className="menu-card">
              <h2>
                Xe Đã Sở Hữu
                {vehicleCooldown > 0 && (
                  <span className="cooldown-badge">
                    ⏳ Chờ {vehicleCooldown}s
                  </span>
                )}
              </h2>
              <div className="vehicle-options">
                {/* Xe Mặc Định — luôn available */}
                {(() => {
                  const pct = vehicleLoadProgress['default'] ?? 0;
                  const ready = pct >= 100;
                  const locked = vehicleCooldown > 0 || !ready;
                  return (
                    <div
                      className={`vehicle-option ${vehicleFolder === 'default' ? 'selected' : ''} ${locked ? 'loading' : ''}`}
                      onClick={() => { if (locked) return; handleSelectVehicle('default'); }}
                      title={vehicleCooldown > 0 ? `Chờ ${vehicleCooldown}s để đổi xe` : !ready ? `Đang tải... ${pct}%` : ''}
                    >
                      <span className="vehicle-icon">🏎️</span>
                      <h3>Xe Mặc Định</h3>
                      {!ready && <div className="load-bar"><div className="load-fill" style={{ width: `${pct}%` }} /></div>}
                      {!ready && <small style={{ color: '#aaa', fontSize: '0.65rem' }}>Đang tải {pct}%</small>}
                      {ready && vehicleCooldown > 0 && vehicleFolder !== 'default' && (
                        <small style={{ color: '#ff9900', fontSize: '0.65rem' }}>🔒 Chờ {vehicleCooldown}s</small>
                      )}
                    </div>
                  );
                })()}

                {unlockedVehicles.includes('alternative') && (() => {
                  const pct = vehicleLoadProgress['alternative'] ?? 0;
                  const ready = pct >= 100;
                  const locked = vehicleCooldown > 0 || !ready;
                  return (
                    <div
                      className={`vehicle-option ${vehicleFolder === 'alternative' ? 'selected' : ''} ${locked ? 'loading' : ''}`}
                      onClick={() => { if (locked) return; handleSelectVehicle('alternative'); }}
                      title={vehicleCooldown > 0 ? `Chờ ${vehicleCooldown}s để đổi xe` : !ready ? `Đang tải... ${pct}%` : ''}
                    >
                      <span className="vehicle-icon">🚓</span>
                      <h3>Xe Cảnh Sát</h3>
                      {!ready && <div className="load-bar"><div className="load-fill" style={{ width: `${pct}%` }} /></div>}
                      {!ready && <small style={{ color: '#aaa', fontSize: '0.65rem' }}>Đang tải {pct}%</small>}
                      {ready && vehicleCooldown > 0 && vehicleFolder !== 'alternative' && (
                        <small style={{ color: '#ff9900', fontSize: '0.65rem' }}>🔒 Chờ {vehicleCooldown}s</small>
                      )}
                    </div>
                  );
                })()}

                {unlockedVehicles.includes('helicopter') && (() => {
                  const pct = vehicleLoadProgress['helicopter'] ?? 0;
                  const ready = pct >= 100;
                  const locked = vehicleCooldown > 0 || !ready;
                  return (
                    <div
                      className={`vehicle-option ${vehicleFolder === 'helicopter' ? 'selected' : ''} ${locked ? 'loading' : ''}`}
                      onClick={() => { if (locked) return; handleSelectVehicle('helicopter'); }}
                      title={vehicleCooldown > 0 ? `Chờ ${vehicleCooldown}s để đổi xe` : !ready ? `Đang tải... ${pct}%` : ''}
                    >
                      <span className="vehicle-icon">🚁</span>
                      <h3>Máy Bay</h3>
                      {!ready && <div className="load-bar"><div className="load-fill" style={{ width: `${pct}%` }} /></div>}
                      {!ready && <small style={{ color: '#aaa', fontSize: '0.65rem' }}>Đang tải {pct}%</small>}
                      {ready && vehicleCooldown > 0 && vehicleFolder !== 'helicopter' && (
                        <small style={{ color: '#ff9900', fontSize: '0.65rem' }}>🔒 Chờ {vehicleCooldown}s</small>
                      )}
                    </div>
                  );
                })()}

                {unlockedVehicles.includes('ship') && (() => {
                  const pct = vehicleLoadProgress['ship'] ?? 0;
                  const ready = pct >= 100;
                  const locked = vehicleCooldown > 0 || !ready;
                  return (
                    <div
                      className={`vehicle-option ${vehicleFolder === 'ship' ? 'selected' : ''} ${locked ? 'loading' : ''}`}
                      onClick={() => { if (locked) return; handleSelectVehicle('ship'); }}
                      title={vehicleCooldown > 0 ? `Chờ ${vehicleCooldown}s để đổi xe` : !ready ? `Đang tải... ${pct}%` : ''}
                    >
                      <span className="vehicle-icon">🚜</span>
                      <h3>Xe Tăng</h3>
                      {!ready && <div className="load-bar"><div className="load-fill" style={{ width: `${pct}%` }} /></div>}
                      {!ready && <small style={{ color: '#aaa', fontSize: '0.65rem' }}>Đang tải {pct}%</small>}
                      {ready && vehicleCooldown > 0 && vehicleFolder !== 'ship' && (
                        <small style={{ color: '#ff9900', fontSize: '0.65rem' }}>🔒 Chờ {vehicleCooldown}s</small>
                      )}
                    </div>
                  );
                })()}

                {unlockedVehicles.includes('rolls_royce') && (() => {
                  const pct = vehicleLoadProgress['rolls_royce'] ?? 0;
                  const ready = pct >= 100;
                  const locked = vehicleCooldown > 0 || !ready;
                  return (
                    <div
                      className={`vehicle-option ${vehicleFolder === 'rolls_royce' ? 'selected' : ''} ${locked ? 'loading' : ''}`}
                      onClick={() => { if (locked) return; handleSelectVehicle('rolls_royce'); }}
                      title={vehicleCooldown > 0 ? `Chờ ${vehicleCooldown}s để đổi xe` : !ready ? `Đang tải... ${pct}%` : ''}
                    >
                      <span className="vehicle-icon">💎</span>
                      <h3>Rolls Royce</h3>
                      {!ready && <div className="load-bar"><div className="load-fill" style={{ width: `${pct}%` }} /></div>}
                      {!ready && <small style={{ color: '#aaa', fontSize: '0.65rem' }}>Đang tải {pct}%</small>}
                      {ready && vehicleCooldown > 0 && vehicleFolder !== 'rolls_royce' && (
                        <small style={{ color: '#ff9900', fontSize: '0.65rem' }}>🔒 Chờ {vehicleCooldown}s</small>
                      )}
                    </div>
                  );
                })()}
              </div>
              <button className="close-btn" onClick={() => setShowMenu(false)}>ĐÓNG</button>
          </div>
        </div>

        {/* Shop Overlay */}
        <div className={`overlay ${showShop ? 'active' : ''}`}>
          <div className="menu-card">
            <h2>Cửa Hàng Siêu Xe</h2>
            <div className="vehicle-options">
              <div className="vehicle-option">
                <span className="vehicle-icon">🚓</span>
                <h3>Xe Cảnh Sát</h3>
                <span className="price-tag">💰 500</span>
                {!unlockedVehicles.includes('alternative') ? (
                  <button className="buy-btn" onClick={() => buyVehicle('alternative')}>MUA</button>
                ) : (
                  <span style={{ color: '#4caf50', marginTop: '15px', fontWeight: 'bold' }}>SỞ HỮU</span>
                )}
              </div>

              <div className="vehicle-option">
                <span className="vehicle-icon">🚁</span>
                <h3>Máy Bay</h3>
                <span className="price-tag">💰 1500</span>
                {!unlockedVehicles.includes('helicopter') ? (
                  <button className="buy-btn" onClick={() => buyVehicle('helicopter')}>MUA</button>
                ) : (
                  <span style={{ color: '#4caf50', marginTop: '15px', fontWeight: 'bold' }}>SỞ HỮU</span>
                )}
              </div>



              <div className="vehicle-option">
                <span className="vehicle-icon">🚜</span>
                <h3>Xe Tăng</h3>
                <span className="price-tag">💰 1000</span>
                {!unlockedVehicles.includes('ship') ? (
                  <button className="buy-btn" onClick={() => buyVehicle('ship')}>MUA</button>
                ) : (
                  <span style={{ color: '#4caf50', marginTop: '15px', fontWeight: 'bold' }}>SỞ HỮU</span>
                )}
              </div>

              <div className="vehicle-option">
                <span className="vehicle-icon">💎</span>
                <h3>Rolls Royce</h3>
                <span className="price-tag">💰 2500</span>
                {!unlockedVehicles.includes('rolls_royce') ? (
                  <button className="buy-btn" onClick={() => buyVehicle('rolls_royce')}>MUA</button>
                ) : (
                  <span style={{ color: '#4caf50', marginTop: '15px', fontWeight: 'bold' }}>SỞ HỮU</span>
                )}
              </div>
            </div>
            <button className="close-btn" onClick={() => setShowShop(false)}>ĐÓNG</button>
          </div>
        </div>

        <Canvas camera={{ position: [0, 5, 10], fov: 60 }} style={{ background: 'transparent' }}>
          <RaceTicker />
          <MinimapPlayerTracker />
          <CoinParticles3D />
          <Environment weather={activeWeather} />
          <Suspense fallback={null}>
            <Game
              weather={activeWeather}
              vehicleFolder={vehicleFolder}
              setVehicleFolder={setVehicleFolder}
              debug={debug}
              userName={userName}
              userAvatar={userAvatar}
              gold={gold}
              setGold={setGold}
              unlockedAchievements={unlockedAchievements}
              setUnlockedAchievements={setUnlockedAchievements}
            />
            <Preload all />
          </Suspense>
        </Canvas>
        {!isRacing && <WeatherPanel weather={weather} setWeather={setWeather} />}
        <MobileControls vehicleFolder={vehicleFolder} />
        <RaceUI />
        <CoinCollectUI />
        <Minimap />
        <TeleportOverlay />
        <WeatherAudio weather={weather} masterMuted={masterMuted} />
        <BackgroundMusic masterMuted={masterMuted} />
        <MasterMuteButton muted={masterMuted} onToggle={toggleMasterMute} />
      </div>
    </RaceManager>
  );
}

// ─── PRELOAD ALL VEHICLE MODELS ──────────────────────────────────────────────
// Tải trước tất cả model GLB khi app khởi động để chuyển xe không bị lag
useGLTF.preload('/models/car/default/chassis.glb');
useGLTF.preload('/models/car/default/wheel.glb');
useGLTF.preload('/models/car/alternative/chassis2.glb');
useGLTF.preload('/models/car/alternative/wheel2.glb');
useGLTF.preload('/models/car/rolls_royce/chassis.glb');
useGLTF.preload('/models/car/rolls_royce/wheel.glb');
useGLTF.preload('/models/car/ship/chassis.glb');
useGLTF.preload('/models/car/helicopter/chassis.glb');
useGLTF.preload('/models/car/helicopter/rotor_main.glb');
useGLTF.preload('/models/car/helicopter/rotor_tail.glb');

// ─── VEHICLE LOAD PROGRESS TRACKER ──────────────────────────────────────────
// Danh sách file cần tải cho từng loại xe (theo thứ tự ưu tiên, file lớn nhất trước)
const VEHICLE_FILES = {
  default:     ['/models/car/default/wheel.glb', '/models/car/default/chassis.glb'],          // 34MB + 1.5MB
  alternative: ['/models/car/alternative/chassis2.glb', '/models/car/alternative/wheel2.glb'], // 17MB + 1.1MB
  rolls_royce: ['/models/car/rolls_royce/chassis.glb', '/models/car/rolls_royce/wheel.glb'],   // 25MB + 2MB
  ship:        ['/models/car/ship/chassis.glb'],                                               // 7MB
  helicopter:  ['/models/car/helicopter/chassis.glb', '/models/car/helicopter/rotor_main.glb', '/models/car/helicopter/rotor_tail.glb'], // 0.4+0.1+0.4MB
};

// Hook theo dõi tiến độ tải từng xe
function useVehicleLoadProgress() {
  const [progress, setProgress] = React.useState(() => ({
    default: 0, alternative: 0, rolls_royce: 0, ship: 0, helicopter: 0,
  }));

  React.useEffect(() => {
    const checkCacheAndLoad = async (vehicleKey, urls) => {
      let totalSize = 0;
      let loadedSize = 0;
      const responses = [];

      // Fetch tất cả file của xe này song song
      const fetches = urls.map(url =>
        fetch(url).then(async (res) => {
          if (!res.ok) return;
          const contentLength = Number(res.headers.get('content-length') || 0);
          totalSize += contentLength || 1_000_000; // fallback 1MB nếu không có header
          const reader = res.body.getReader();
          let receivedLength = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            receivedLength += value.length;
            loadedSize += value.length;
            // Cập nhật tiến độ realtime
            setProgress(prev => ({
              ...prev,
              [vehicleKey]: totalSize > 0 ? Math.min(99, Math.round((loadedSize / totalSize) * 100)) : 50,
            }));
          }
        }).catch(() => {})
      );

      await Promise.all(fetches);
      // Đánh dấu hoàn tất
      setProgress(prev => ({ ...prev, [vehicleKey]: 100 }));
    };

    // Tải song song tất cả xe (default đã load nên sẽ dùng cache)
    Object.entries(VEHICLE_FILES).forEach(([key, urls]) => {
      checkCacheAndLoad(key, urls);
    });
  }, []);

  return progress;
}
