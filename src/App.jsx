import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, Debug, useBox, usePlane, useRaycastVehicle, useCylinder, useCompoundBody, useSphere, useTrimesh, useConvexPolyhedron } from '@react-three/cannon';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { threeToCannon, ShapeType } from 'three-to-cannon';
import Environment, { WeatherPanel, WEATHER_PRESETS } from './Enviroment';

// ─── CONTROLS ────────────────────────────────────────────────────────────────
function usePlayerControls() {
  const keys = useRef({ 
    forward: false, backward: false, left: false, right: false, 
    brake: false, reset: false, boost: false, change: false,
    up: false, down: false, yawLeft: false, yawRight: false, honk: false 
  });
  useEffect(() => {
    const down = (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp')    keys.current.forward  = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown')  keys.current.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft')  { keys.current.left = true; keys.current.yawLeft = true; }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') { keys.current.right = true; keys.current.yawRight = true; }
      if (e.code === 'KeyQ')                            keys.current.yawLeft  = true;
      if (e.code === 'KeyE')                            keys.current.yawRight = true;
      if (e.code === 'Space') { keys.current.brake = true; keys.current.up = true; }
      if (e.code === 'KeyR')   keys.current.reset = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { keys.current.boost = true; keys.current.down = true; }
      if (e.code === 'KeyC')   keys.current.change = true;
      if (e.code === 'KeyH')   keys.current.honk = true;
    };
    const up = (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp')    keys.current.forward  = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown')  keys.current.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft')  { keys.current.left = false; keys.current.yawLeft = false; }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') { keys.current.right = false; keys.current.yawRight = false; }
      if (e.code === 'KeyQ')                            keys.current.yawLeft  = false;
      if (e.code === 'KeyE')                            keys.current.yawRight = false;
      if (e.code === 'Space') { keys.current.brake = false; keys.current.up = false; }
      if (e.code === 'KeyR')   keys.current.reset = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { keys.current.boost = false; keys.current.down = false; }
      if (e.code === 'KeyC')   keys.current.change = false;
      if (e.code === 'KeyH')   keys.current.honk = false;
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

const Wheel = React.forwardRef(({ radius = 0.25, width = 0.24, leftSide, folder = 'default', visible = true }, ref) => {
  useCylinder(() => ({
    mass: 5,
    type: 'Kinematic',
    material: 'wheel',
    collisionFilterGroup: 0,
    collisionFilterMask: 0,
    args: [radius, radius, width, 16],
  }), []);

  return (
    <mesh ref={ref}>
      <React.Suspense fallback={null}>
        <WheelModel leftSide={leftSide} folder={folder} visible={visible} />
      </React.Suspense>
    </mesh>
  );
});

const Car = ({ folder, lastPos, lastRot }) => {
  const controls = usePlayerControls();
  const lastChange = useRef(false);
  const { camera } = useThree();

  // --- Physics chassis (Trở về useBox chuẩn của bạn) ---
  const chassisWidth = 0.8;
  // Làm khung vật lý mỏng lại để KHÔNG BAO GIỜ cạ gầm vào mặt đường
  const chassisHeight = 0.2;
  const chassisDepth = 2.03;

  const vehicleConfigs = {
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
      front: -0.55,
      back: 0.55,
      width: 0.55,
      wheelY: 0,
      chassisY: -0.25,
      suspensionStiffness: 150,
      dampingRelaxation: 6.0,
      dampingCompression: 6.0,
      mass: 800,
    }
  };

  const config = vehicleConfigs[folder] || vehicleConfigs.default;
  const { front: fO, back: bO, width: oW, wheelY, chassisY } = config;

  // Âm thanh còi xe
  const honkSound = useMemo(() => {
    const audio = new window.Audio('/sounds/honk.mp3');
    audio.volume = 0.5;
    return audio;
  }, []);
  const isHonking = useRef(false);

  // Sử dụng useCompoundBody để tạo 2 lớp vật lý cho xe
  const [chassisRef, chassisApi] = useCompoundBody(() => ({
    mass: 300, 
    position: lastPos.current,
    rotation: lastRot.current,
    velocity: [0, 0, 0], 
    angularVelocity: [0, 0, 0], 
    allowSleep: true,
    linearDamping: 0.2, 
    angularDamping: 0.9, 
    angularFactor: [0, 1, 0],
    shapes: [
      // Lớp 1 (Gầm xe): Hình hộp mỏng (0.2) nằm sát gầm, giữ chức năng tương tác với mặt đường (Trimesh) mà không bị cạ gầm.
      { type: 'Box', position: [0, 0, 0], rotation: [0, 0, 0], args: [chassisWidth, 0.2, chassisDepth] },
      // Lớp 2 (Mũi xe & Đuôi xe): Dùng HÌNH CẦU (Sphere) thay vì Hộp. Trong Cannon.js, Hình Cầu va chạm với Trimesh (tường) là chắc chắn nhất, tuyệt đối không bị xuyên tường dù chạy tốc độ cao!
      { type: 'Sphere', position: [0, 0.3,  0.6], args: [0.4] }, // Mũi xe
      { type: 'Sphere', position: [0, 0.3, -0.6], args: [0.4] }  // Đuôi xe
    ]
  }), []);

  useEffect(() => {
    const unsubPos = chassisApi.position.subscribe(v => { lastPos.current = v; });
    const unsubRot = chassisApi.rotation.subscribe(v => { lastRot.current = v; });
    return () => { unsubPos(); unsubRot(); };
  }, [chassisApi, lastPos, lastRot]);

  // --- Hệ thống treo CÂN BẰNG ---
  const wheelRadius = 0.25;
  const wheelHeight = 0.25;

  // Moved to the top to prevent TDZ issues

  const wheelInfos = useMemo(() => {
    // Nếu là Rolls Royce, sử dụng bộ tọa độ riêng biệt để dễ chỉnh sửa
    if (folder === 'rolls_royce') {
      const suspensionStiffness = 150;
      const dampingRelaxation = 6;
      const dampingCompression = 6;
      return [
        { radius: wheelRadius, directionLocal: [0, -1, 0], axleLocal: [-1, 0, 0], suspensionRestLength: 0.35, maxSuspensionForce: 100000, maxSuspensionTravel: 0.25, frictionSlip: 6.0, rollInfluence: 0.0, suspensionStiffness, dampingRelaxation, dampingCompression, chassisConnectionPointLocal: [-0.45, 0, -1.145], isFrontWheel: true },
        { radius: wheelRadius, directionLocal: [0, -1, 0], axleLocal: [-1, 0, 0], suspensionRestLength: 0.35, maxSuspensionForce: 100000, maxSuspensionTravel: 0.25, frictionSlip: 6.0, rollInfluence: 0.0, suspensionStiffness, dampingRelaxation, dampingCompression, chassisConnectionPointLocal: [ 0.45, 0, -1.145], isFrontWheel: true },
        { radius: wheelRadius, directionLocal: [0, -1, -0.15], axleLocal: [-1, 0, 0], suspensionRestLength: 0.35, maxSuspensionForce: 100000, maxSuspensionTravel: 0.25, frictionSlip: 6.0, rollInfluence: 0.0, suspensionStiffness, dampingRelaxation, dampingCompression, chassisConnectionPointLocal: [-0.45, 0,  0.821], isFrontWheel: false },
        { radius: wheelRadius, directionLocal: [0, -1, -0.15], axleLocal: [-1, 0, 0], suspensionRestLength: 0.35, maxSuspensionForce: 100000, maxSuspensionTravel: 0.25, frictionSlip: 6.0, rollInfluence: 0.0, suspensionStiffness, dampingRelaxation, dampingCompression, chassisConnectionPointLocal: [ 0.45, 0,  0.821], isFrontWheel: false },
      ];
    }

    // Các xe khác vẫn dùng công thức chung dựa trên vehicleConfigs
    return [
      { radius: wheelRadius, directionLocal: [0, -1, 0], axleLocal: [-1, 0, 0], suspensionRestLength: 0.35, maxSuspensionForce: 100000, maxSuspensionTravel: 0.25, frictionSlip: 6.0, rollInfluence: 0.0, suspensionStiffness: 150, dampingRelaxation: 6, dampingCompression: 6, chassisConnectionPointLocal: [-0.45, 0, -1.145], isFrontWheel: true },
      { radius: wheelRadius, directionLocal: [0, -1, 0], axleLocal: [-1, 0, 0], suspensionRestLength: 0.35, maxSuspensionForce: 100000, maxSuspensionTravel: 0.25, frictionSlip: 6.0, rollInfluence: 0.0, suspensionStiffness: 150, dampingRelaxation: 6, dampingCompression: 6, chassisConnectionPointLocal: [ 0.45, 0, -1.145], isFrontWheel: true },
      { radius: wheelRadius, directionLocal: [0, -1, 0], axleLocal: [-1, 0, 0], suspensionRestLength: 0.35, maxSuspensionForce: 100000, maxSuspensionTravel: 0.25, frictionSlip: 6.0, rollInfluence: 0.0, suspensionStiffness: 150, dampingRelaxation: 6, dampingCompression: 6, chassisConnectionPointLocal: [-0.45, 0,  0.821], isFrontWheel: false },
      { radius: wheelRadius, directionLocal: [0, -1, 0], axleLocal: [-1, 0, 0], suspensionRestLength: 0.35, maxSuspensionForce: 100000, maxSuspensionTravel: 0.25, frictionSlip: 6.0, rollInfluence: 0.0, suspensionStiffness: 150, dampingRelaxation: 6, dampingCompression: 6, chassisConnectionPointLocal: [ 0.45, 0,  0.821], isFrontWheel: false },
    ];
  }, [folder]);

  const wheel0 = useRef(null);
  const wheel1 = useRef(null);
  const wheel2 = useRef(null);
  const wheel3 = useRef(null);
  const firstFrame = useRef(true);

  const [vehicle, vehicleApi] = useRaycastVehicle(() => ({
    chassisBody: chassisRef,
    wheelInfos,
    wheels: [wheel0, wheel1, wheel2, wheel3],
    indexForwardAxis: 2,
    indexRightAxis: 0,
    indexUpAxis: 1,
  }), [folder]);


  // --- Models ---
  const modelFolder = folder;
  const chassisFile = modelFolder === 'alternative' ? 'chassis2.glb' : 'chassis.glb';
  const { scene: chassisScene } = useGLTF(`/models/car/${modelFolder}/${chassisFile}`);

  const velocity = useRef([0, 0, 0]);
  useEffect(() => {
    const unsub = chassisApi.velocity.subscribe(v => { velocity.current = v; });
    return unsub;
  }, [chassisApi]);

  // Steering state
  const currentSteering = useRef(0);

  const smoothRot = useRef(0);
  const isBraking = useRef(false); // Trạng thái phanh để tối ưu hóa damping

  // --- Camera state ---
  const camPos    = useRef(new THREE.Vector3(0, 5, 10));
  const camTarget = useRef(new THREE.Vector3());

  // --- Mouse camera control ---
  const camAngle = useRef({ x: 0, y: 0.35, dist: 7 });
  useEffect(() => {
    let middleDown = false;
    const onWheel = (e) => {
      camAngle.current.dist = Math.max(3, Math.min(25, camAngle.current.dist + e.deltaY * 0.01));
    };
    const onDown  = (e) => { if (e.button === 1) middleDown = true;  };
    const onUp    = (e) => { if (e.button === 1) middleDown = false; };
    const onMove  = (e) => {
      if (!middleDown) return;
      camAngle.current.x -= e.movementX * 0.005;
      camAngle.current.y  = Math.max(0.05, Math.min(Math.PI / 2.2, camAngle.current.y + e.movementY * 0.005));
    };
    window.addEventListener('wheel',       onWheel);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup',   onUp);
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('wheel',       onWheel);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup',   onUp);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  // ─── MAIN LOOP ───────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    const { forward, backward, left, right, brake, reset, boost, change, honk } = controls.current;
    
    // Xử lý còi xe (chỉ dành cho ô tô, không dành cho Tàu Thủy)
    if (honk && folder !== 'ship' && !isHonking.current) {
      honkSound.currentTime = 0;
      honkSound.play().catch(e => console.log('Audio play failed:', e));
      isHonking.current = true;
    } else if (!honk) {
      isHonking.current = false;
    }

    const dt = Math.min(delta, 0.05); // clamp delta để tránh spike lag

    // Reset xe
    if (reset && chassisRef.current) {
      chassisApi.position.set(chassisRef.current.position.x, chassisRef.current.position.y + 0.5, chassisRef.current.position.z);
      chassisApi.velocity.set(0, 0, 0);
      chassisApi.angularVelocity.set(0, 0, 0);
      chassisApi.rotation.set(0, chassisRef.current.rotation.y, 0);
    }

    const baseForce = boost ? 900 : 500;
    // Tỉ lệ lực động cơ theo khối lượng để xe nặng (Rolls Royce) vẫn chạy nhanh
    const engineForce = baseForce * ((config.mass || 150) / 150); 
    const speed = Math.sqrt(velocity.current[0]**2 + velocity.current[2]**2);
    
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
    if (forward) {
      vehicleApi.applyEngineForce(engineForce, 2);
      vehicleApi.applyEngineForce(engineForce, 3);
    } else if (backward) {
      vehicleApi.applyEngineForce(-engineForce, 2);
      vehicleApi.applyEngineForce(-engineForce, 3);
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
    if (!forward && !backward && !left && !right && speed < 0.25) {
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
  });

  return (
    <group ref={vehicle}>
      <mesh ref={chassisRef} castShadow>
        <meshStandardMaterial visible={false} />
        <group position={[0, chassisY, 0]} rotation={[0, Math.PI / 2, 0]}>
          <primitive object={chassisScene} />
        </group>
      </mesh>

      <Wheel ref={wheel0} radius={wheelRadius} width={wheelHeight} leftSide={true}  folder={folder === 'ship' ? 'default' : folder} visible={folder !== 'ship'} />
      <Wheel ref={wheel1} radius={wheelRadius} width={wheelHeight} leftSide={false} folder={folder === 'ship' ? 'default' : folder} visible={folder !== 'ship'} />
      <Wheel ref={wheel2} radius={wheelRadius} width={wheelHeight} leftSide={true}  folder={folder === 'ship' ? 'default' : folder} visible={folder !== 'ship'} />
      <Wheel ref={wheel3} radius={wheelRadius} width={wheelHeight} leftSide={false} folder={folder === 'ship' ? 'default' : folder} visible={folder !== 'ship'} />
    </group>
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

// Component phụ để tải và điều khiển cánh quạt từ file riêng
const PropellerModel = ({ url, axis = 'y', position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, offset = [0, 0, 0], lastPos }) => {
  const { nodes } = useGLTF(url);
  const rotRef = useRef();
  
  // Trích xuất và căn tâm trực tiếp các mesh từ file GLTF để đảm bảo hiển thị 100%
  const meshes = React.useMemo(() => {
    const list = [];
    Object.values(nodes).forEach(node => {
      if (node.isMesh) {
        // Clone và căn tâm hình học cho geometry để xoay đúng trục
        const geom = node.geometry.clone();
        geom.center(); 
        // Cho phép nhích tâm xoay thủ công nếu cần
        geom.translate(offset[0], offset[1], offset[2]);
        list.push({ geometry: geom, material: node.material });
      }
    });
    return list;
  }, [nodes, offset]);

  const keys = usePlayerControls();
  const speedRef = useRef(0);

  useFrame((_, delta) => {
    // Máy bay được coi là đang bay nếu đang ấn phím Lên/Xuống HOẶC đang lơ lửng ở trên không (độ cao Y > 1.0)
    const isFlying = keys.current.up || keys.current.down || (lastPos && lastPos.current && lastPos.current[1] > 1.0);
    
    // Nội suy tốc độ để tạo hiệu ứng khởi động và dừng lại mượt mà
    const targetSpeed = isFlying ? 50 : 0;
    const lerpFactor = isFlying ? 0.05 : 0.005;
    speedRef.current = THREE.MathUtils.lerp(speedRef.current, targetSpeed, lerpFactor);

    if (rotRef.current && speedRef.current > 0.1) {
      rotRef.current.rotation[axis] += delta * speedRef.current;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <group ref={rotRef}>
        {/* Vẽ trực tiếp từng mesh bằng tag <mesh> tiêu chuẩn của R3F */}
        {meshes.map((m, i) => (
          <mesh key={i} geometry={m.geometry} material={m.material} scale={scale} />
        ))}
      </group>
    </group>
  );
};

const Propeller = (props) => (
  <React.Suspense fallback={
    <mesh position={props.position} rotation={props.rotation}>
      <boxGeometry args={[1, 0.05, 1]} />
      <meshStandardMaterial color="red" wireframe />
    </mesh>
  }>
    <PropellerModel {...props} />
  </React.Suspense>
);

// ─── HELICOPTER ────────────────────────────────────────────────────────
const Helicopter = ({ lastPos, lastRot }) => {
  const controls = usePlayerControls();
  const { camera } = useThree();
  const firstFrame = useRef(true);
  const smoothRot = useRef(0);
  const camAngle = useRef({ x: 0, y: 0.35, dist: 8 });

  useEffect(() => {
    let middleDown = false;
    const onWheel = (e) => {
      camAngle.current.dist = Math.max(3, Math.min(30, camAngle.current.dist + e.deltaY * 0.01));
    };
    const onDown  = (e) => { if (e.button === 1) middleDown = true;  };
    const onUp    = (e) => { if (e.button === 1) middleDown = false; };
    const onMove  = (e) => {
      if (!middleDown) return;
      camAngle.current.x -= e.movementX * 0.005;
      camAngle.current.y  = Math.max(0.05, Math.min(Math.PI / 2.2, camAngle.current.y + e.movementY * 0.005));
    };
    window.addEventListener('wheel',       onWheel);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup',   onUp);
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('wheel',       onWheel);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup',   onUp);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  const [ref, api] = useCompoundBody(() => ({
    mass: 500,
    position: lastPos.current,
    rotation: lastRot.current,
    linearDamping: 0.8, 
    angularDamping: 0.95,
    angularFactor: [0, 1, 0], // Khóa trục X và Z để máy bay luôn thăng bằng, không bị nghiêng
    shapes: [
      // Nâng Box lên 0.5 để mặt đáy (Y=0) khớp chính xác với bánh xe của model
      { type: 'Box', position: [0, 0.5, 0], args: [1, 1, 3] },
      // Nâng quả cầu lên 0.6 và thu nhỏ một chút để chúng làm cản trước/sau mà không chạm đất
      { type: 'Sphere', position: [0, 0.6, -1.3], args: [0.5] },
      { type: 'Sphere', position: [0, 0.6, 1.3], args: [0.5] }
    ]
  }), []);

  const hovering = useRef(false);
  const velocity = useRef([0, 0, 0]);

  // Theo dõi tọa độ và vận tốc
  useEffect(() => {
    const unsubPos = api.position.subscribe(v => { lastPos.current = v; });
    const unsubRot = api.rotation.subscribe(v => { lastRot.current = v; });
    const unsubVel = api.velocity.subscribe(v => { velocity.current = v; });
    return () => { unsubPos(); unsubRot(); unsubVel(); };
  }, [api, lastPos, lastRot]);

  const { scene } = useGLTF('/models/car/helicopter/chassis.glb');
  
  useFrame((state, delta) => {
    const { forward, backward, left, right, up, down, yawLeft, yawRight } = controls.current;
    const dt = Math.min(delta, 0.05);

    // Xử lý giữ nguyên độ cao (Hover)
    if (!up && !down) {
      if (!hovering.current) {
        // Vừa nhả phím: Khóa cứng trục Y (tắt hẳn trọng lực) và dừng ngay lập tức
        api.linearFactor.set(1, 0, 1);
        api.velocity.set(velocity.current[0], 0, velocity.current[2]);
        hovering.current = true;
      }
    } else {
      if (hovering.current) {
        // Vừa bấm phím: Mở khóa trục Y để bay lên/xuống bình thường
        api.linearFactor.set(1, 1, 1);
        hovering.current = false;
      }
      
      const climbForce = 15000; // Lực nâng đủ lớn để thắng trọng lực và bay vút lên
      if (up) api.applyLocalForce([0, climbForce, 0], [0, 0, 0]);
      if (down) api.applyLocalForce([0, -5000, 0], [0, 0, 0]); // Trọng lực tự kéo xuống một phần, cộng thêm lực này để rơi nhanh hơn
    }

    // Lực di chuyển tới lùi
    const moveForce = 5000;
    const torque = 1000;
    
    if (forward) api.applyLocalForce([0, 0, -moveForce], [0, 0, 0]);
    if (backward) api.applyLocalForce([0, 0, moveForce], [0, 0, 0]);

    // Tự động phanh mượt mà khi nhả phím
    if (!up && !down && !forward && !backward) {
      api.linearDamping.set(0.95); // Phanh nhanh
    } else {
      api.linearDamping.set(0.8);  // Di chuyển bình thường
    }
    
    // Q/E để xoay (Yaw)
    if (yawLeft) api.applyTorque([0, torque, 0]);
    if (yawRight) api.applyTorque([0, -torque, 0]);

    // Camera
    if (!ref.current) return;
    const currentPosition = new THREE.Vector3();
    ref.current.getWorldPosition(currentPosition);
    const rawRot = ref.current.rotation.y;

    const dist = camAngle.current.dist;
    const ax = camAngle.current.x;
    const ay = camAngle.current.y;
    
    const horizontalDist = Math.cos(ay) * dist;
    const offsetX = Math.sin(ax) * horizontalDist;
    const offsetY = Math.sin(ay) * dist;
    const offsetZ = Math.cos(ax) * horizontalDist;
    
    const idealOffset = new THREE.Vector3(offsetX, offsetY, offsetZ);
    idealOffset.applyEuler(new THREE.Euler(0, rawRot, 0));
    state.camera.position.copy(currentPosition).add(idealOffset);
    
    const lookAtPos = currentPosition.clone().add(new THREE.Vector3(0, 0, -2).applyEuler(new THREE.Euler(0, rawRot, 0)));
    state.camera.lookAt(lookAtPos);
  });

  return (
    <group ref={ref}>
      <React.Suspense fallback={<mesh><boxGeometry args={[1, 1, 3]} /><meshStandardMaterial color="gray" /></mesh>}>
        <primitive object={scene} />
      </React.Suspense>
      <Propeller lastPos={lastPos} url="/models/car/helicopter/rotor_main.glb" axis="y" position={[-0.009, 0.75, 0.01]} scale={0.01} />
      <Propeller lastPos={lastPos} url="/models/car/helicopter/rotor_tail.glb" axis="y" position={[-0.13, 0.83, 1.59]} scale={0.002} rotation={[0, 0, Math.PI / 2]} offset={[0, 0, 0]} />
    </group>
  );
};

// Ship component đã được xoá — ship giờ dùng Car với folder='ship' và bánh xe ẩn

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
  }), []);
  
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
        <TrimeshCollider key={`tri-${i}`} vertices={m.vertices} indices={m.indices} position={position} rotation={rotation} />
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
  }), [vertices, indices]);
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

// ─── APP ─────────────────────────────────────────────────────────────────────
function Game({ vehicleFolder, setVehicleFolder, debug }) {
  const controls = usePlayerControls();
  const lastChange = useRef(false);
  
  const lastPos = useRef([0, 0.5, 0]);
  const lastRot = useRef([0, 0, 0]);

  const contents = (
    <>
      {vehicleFolder === 'helicopter' ? (
        <Helicopter lastPos={lastPos} lastRot={lastRot} />
      ) : vehicleFolder === 'ship' ? (
        <Car folder="ship" lastPos={lastPos} lastRot={lastRot} />
      ) : (
        <Car 
          folder={vehicleFolder} 
          lastPos={lastPos} 
          lastRot={lastRot}
        />
      )}
      <Ground />
      <MapWithPhysics mapFile="map.glb" collisionFile="map_collision.glb" position={[0, 0, 0]} scale={1} />
    </>
  );

  return (
    <Physics gravity={[0, -9.81, 0]} defaultContactMaterial={{ friction: 0.3, restitution: 0.1 }}>
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
  const [showMenu, setShowMenu] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [debug, setDebug] = useState(false);
  const [weather, setWeather] = useState(WEATHER_PRESETS.sunny);
  
  // Hệ thống vàng và xe đã mở khóa
  const [gold, setGold] = useState(10000); // Tặng 10,000 vàng khởi đầu để người chơi thoải mái mua sắm
  const [unlockedVehicles, setUnlockedVehicles] = useState(['default']);
  
  // Hệ thống hồ sơ người chơi
  const [userName, setUserName] = useState('Người Chơi 1');
  const [userAvatar, setUserAvatar] = useState('👤');
  const [showProfile, setShowProfile] = useState(true); // Hiện ngay khi vào game

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

  const avatars = ['👤', '🏎️', '🚓', '🚁', '🚢', '🚀', '🐱', '🐶', '🔥', '⚡'];

  const vehiclePrices = {
    alternative: 500,
    helicopter: 1500,
    ship: 1000,
    rolls_royce: 2500
  };

  const buyVehicle = (type) => {
    const price = vehiclePrices[type];
    if (gold >= price) {
      setGold(prev => prev - price);
      setUnlockedVehicles(prev => [...prev, type]);
      const vehicleNames = { alternative: 'Xe Cảnh Sát', helicopter: 'Máy Bay', ship: 'Xe Tăng', rolls_royce: 'Rolls Royce' };
      alert(`Chúc mừng! Bạn đã mở khóa ${vehicleNames[type]}!`);
    } else {
      alert('Bạn không đủ vàng!');
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: `linear-gradient(to bottom, ${weather.skyTop}, ${weather.skyBottom})`, margin: 0, padding: 0, overflow: 'hidden', position: 'relative', fontFamily: 'Arial, sans-serif' }}>
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
        .vehicle-option:hover { background: #2a2a2a; transform: translateY(-5px); }
        .vehicle-option.selected { border-color: #FF7A2F; background: #332211; }
        
        .vehicle-icon { font-size: 40px; margin-bottom: 10px; }
        .vehicle-option h3 { color: white; font-size: 14px; margin: 0; }
        .price-tag { color: #FFD700; font-weight: bold; margin-top: 10px; font-size: 14px; }

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
        <button className="menu-button" onClick={() => setShowMenu(true)}>Ga-ra</button>
        <button className="shop-button" onClick={() => setShowShop(true)}>Shop 🛒</button>
        <button className="menu-button" onClick={() => setDebug(!debug)} style={{ background: debug ? '#ff4444' : 'rgba(255,255,255,0.15)', border: debug ? '1px solid #ff0000' : '1px solid rgba(255,255,255,0.2)' }}>
          Hitbox: {debug ? 'ON' : 'OFF'}
        </button>
        <div style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '11px',
          fontStyle: 'italic',
          marginLeft: '10px',
          background: 'rgba(0,0,0,0.3)',
          padding: '5px 10px',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          ⚠️ ĐỢI GAME LOAD MODULE KHOẢNG 20S R MỚI ĐỔI XE
        </div>
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
            style={{display: 'none'}} 
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
          
          <button className="save-btn" onClick={() => setShowProfile(false)}>BẮT ĐẦU TRÒ CHƠI</button>
        </div>
      </div>

      {/* Ga-ra Overlay */}
      <div className={`overlay ${showMenu ? 'active' : ''}`}>
        <div className="menu-card">
          <h2>Xe Đã Sở Hữu</h2>
          <div className="vehicle-options">
            <div 
              className={`vehicle-option ${vehicleFolder === 'default' ? 'selected' : ''}`}
              onClick={() => { setVehicleFolder('default'); setShowMenu(false); }}
            >
              <span className="vehicle-icon">🏎️</span>
              <h3>Xe Mặc Định</h3>
            </div>
            
            {unlockedVehicles.includes('alternative') && (
              <div 
                className={`vehicle-option ${vehicleFolder === 'alternative' ? 'selected' : ''}`}
                onClick={() => { setVehicleFolder('alternative'); setShowMenu(false); }}
              >
                <span className="vehicle-icon">🚓</span>
                <h3>Xe Cảnh Sát</h3>
              </div>
            )}

            {unlockedVehicles.includes('helicopter') && (
              <div 
                className={`vehicle-option ${vehicleFolder === 'helicopter' ? 'selected' : ''}`}
                onClick={() => { setVehicleFolder('helicopter'); setShowMenu(false); }}
              >
                <span className="vehicle-icon">🚁</span>
                <h3>Máy Bay</h3>
              </div>
            )}

            {unlockedVehicles.includes('ship') && (
              <div 
                className={`vehicle-option ${vehicleFolder === 'ship' ? 'selected' : ''}`}
                onClick={() => { setVehicleFolder('ship'); setShowMenu(false); }}
              >
                <span className="vehicle-icon">🚜</span>
                <h3>Xe Tăng</h3>
              </div>
            )}
            
            {unlockedVehicles.includes('rolls_royce') && (
              <div 
                className={`vehicle-option ${vehicleFolder === 'rolls_royce' ? 'selected' : ''}`}
                onClick={() => { setVehicleFolder('rolls_royce'); setShowMenu(false); }}
              >
                <span className="vehicle-icon">💎</span>
                <h3>Rolls Royce</h3>
              </div>
            )}
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
                <span style={{color: '#4caf50', marginTop: '15px', fontWeight: 'bold'}}>SỞ HỮU</span>
              )}
            </div>

            <div className="vehicle-option">
              <span className="vehicle-icon">🚁</span>
              <h3>Máy Bay</h3>
              <span className="price-tag">💰 1500</span>
              {!unlockedVehicles.includes('helicopter') ? (
                <button className="buy-btn" onClick={() => buyVehicle('helicopter')}>MUA</button>
              ) : (
                <span style={{color: '#4caf50', marginTop: '15px', fontWeight: 'bold'}}>SỞ HỮU</span>
              )}
            </div>

            <div className="vehicle-option">
              <span className="vehicle-icon">🚜</span>
              <h3>Xe Tăng</h3>
              <span className="price-tag">💰 1000</span>
              {!unlockedVehicles.includes('ship') ? (
                <button className="buy-btn" onClick={() => buyVehicle('ship')}>MUA</button>
              ) : (
                <span style={{color: '#4caf50', marginTop: '15px', fontWeight: 'bold'}}>SỞ HỮU</span>
              )}
            </div>

            <div className="vehicle-option">
              <span className="vehicle-icon">💎</span>
              <h3>Rolls Royce</h3>
              <span className="price-tag">💰 2500</span>
              {!unlockedVehicles.includes('rolls_royce') ? (
                <button className="buy-btn" onClick={() => buyVehicle('rolls_royce')}>MUA</button>
              ) : (
                <span style={{color: '#4caf50', marginTop: '15px', fontWeight: 'bold'}}>SỞ HỮU</span>
              )}
            </div>
          </div>
          <button className="close-btn" onClick={() => setShowShop(false)}>ĐÓNG</button>
        </div>
      </div>

      {/* Removed heli-controls */}

      <Canvas camera={{ position: [0, 5, 10], fov: 60 }} style={{ background: 'transparent' }}>
        <Environment weather={weather} />
        <ambientLight intensity={weather.ambientIntensity} color={weather.ambientColor} />
        <directionalLight position={[10, 20, 10]} intensity={weather.sunIntensity} color={weather.sunColor} />
        <directionalLight position={[-10, 10, -10]} intensity={weather.sunIntensity * 0.3} color={weather.sunColor} />
        <Game vehicleFolder={vehicleFolder} setVehicleFolder={setVehicleFolder} debug={debug} />
      </Canvas>
      <WeatherPanel weather={weather} setWeather={setWeather} />
      <MobileControls vehicleFolder={vehicleFolder} />
    </div>
  );
}
