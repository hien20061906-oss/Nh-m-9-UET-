import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Html, useGLTF } from '@react-three/drei';

// ─── EVENT BUS ───────────────────────────────────────────────────────────────
export function emitSpeedViolation(speed) {
  window.dispatchEvent(
    new CustomEvent('speed-violation', { detail: { speed } })
  );
}

// ─── UAV CHASE LOGIC ─────────────────────────────────────────────────────────
export const ChasingUAV = ({ initialPosition = [0, 10, -50], debug = false, modelScale = 20 }) => {
  const { scene } = useGLTF('/models/uav/uav.glb');
  const uavModel = useMemo(() => scene.clone(), [scene]);
  const uavGroupRef = useRef();
  const detectionConeRef = useRef();
  const carCache = useRef(null);
  
  const isChasingRef = useRef(false);
  const isTargetDetectedRef = useRef(false);
  const escapeTimer = useRef(0);
  const caughtTimer = useRef(0);
  const lastUiUpdate = useRef(0);
  const ESCAPE_TIME_LIMIT = 8;
  const CAUGHT_TIME_LIMIT = 5;

  const coneGeo = useMemo(() => {
    // Giảm polygon và bỏ mặt đáy giảm gánh nặng fill-rate GPU
    const geo = new THREE.ConeGeometry(20, 40, 8, 1, true);
    geo.translate(0, -20, 0); 
    geo.rotateX(Math.PI / 5); 
    return geo;
  }, []);

  const coneMat = useMemo(() => new THREE.MeshBasicMaterial({ 
    color: 0xff8800, 
    transparent: true, 
    opacity: 0.3,
    depthWrite: false,
    side: THREE.FrontSide // FrontSide thay vì DoubleSide giảm 50% overdraw
  }), []);

  useEffect(() => {
    const handleViolation = () => {
      if (!isChasingRef.current) {
        isChasingRef.current = true;
        escapeTimer.current = 0;
        caughtTimer.current = 0;
        if (uavGroupRef.current) {
          uavGroupRef.current.position.set(...initialPosition);
          uavGroupRef.current.visible = true;
        }
      } else {
        escapeTimer.current = 0;
        caughtTimer.current = 0;
      }
    };
    window.addEventListener('speed-violation', handleViolation);
    return () => window.removeEventListener('speed-violation', handleViolation);
  }, [initialPosition]);

  const [vCarPos] = useState(() => new THREE.Vector3());
  const [vTargetOffset] = useState(() => new THREE.Vector3());
  const [eulerY] = useState(() => new THREE.Euler(0, 0, 0, 'YXZ'));
  const [vTargetPos] = useState(() => new THREE.Vector3());
  const [vForward] = useState(() => new THREE.Vector3());
  const [vConeCenter] = useState(() => new THREE.Vector3());

  useFrame((state, delta) => {
    if (!isChasingRef.current || !uavGroupRef.current) return;

    if (!carCache.current || !carCache.current.parent) {
      carCache.current = state.scene.getObjectByName('chassis-body-visual');
      if (!carCache.current) return;
    }

    const now = Date.now();
    
    if (!isTargetDetectedRef.current) {
      caughtTimer.current = 0;
      escapeTimer.current += delta;
      
      if (escapeTimer.current > ESCAPE_TIME_LIMIT) {
        isChasingRef.current = false;
        isTargetDetectedRef.current = false;
        coneMat.color.setHex(0xff8800);
        uavGroupRef.current.visible = false;
        window.dispatchEvent(new CustomEvent('uav-chase-update', { detail: { isChasing: false } }));
        return;
      }
    } else {
      escapeTimer.current = 0;
      caughtTimer.current += delta;
      
      if (caughtTimer.current > CAUGHT_TIME_LIMIT) {
        isChasingRef.current = false;
        isTargetDetectedRef.current = false;
        coneMat.color.setHex(0xff8800);
        uavGroupRef.current.visible = false;
        window.dispatchEvent(new CustomEvent('uav-chase-update', { detail: { isChasing: false } }));
        
        window.dispatchEvent(new CustomEvent('deduct-gold', { detail: { amount: 360 } }));
        window.dispatchEvent(new CustomEvent('teleport-start', { detail: { name: 'Điểm Xuất Phát', position: [0, 2, 0], rotation: 0 } }));
        window.dispatchEvent(new CustomEvent('race-force-reset'));
        return;
      }
    }

    // Throttle UI update
    if (now - lastUiUpdate.current > 100) {
      lastUiUpdate.current = now;
      window.dispatchEvent(new CustomEvent('uav-chase-update', { 
        detail: { 
          isChasing: true, 
          progress: isTargetDetectedRef.current 
            ? (caughtTimer.current / CAUGHT_TIME_LIMIT)
            : Math.max(0, 1 - (escapeTimer.current / ESCAPE_TIME_LIMIT)),
          isDetected: isTargetDetectedRef.current
        } 
      }));
    }

    carCache.current.getWorldPosition(vCarPos);

    eulerY.set(0, carCache.current.rotation.y, 0);
    vTargetOffset.set(0, 8, 10).applyEuler(eulerY);
    vTargetPos.copy(vCarPos).add(vTargetOffset);
    
    const currentPos = uavGroupRef.current.position;
    if (currentPos.distanceTo(vTargetPos) > 40) {
      currentPos.copy(vTargetPos).add(vTargetOffset.set(0, 5, -10));
    }

    currentPos.lerp(vTargetPos, delta * 3.0); 

    currentPos.y += Math.sin(now * 0.002) * delta * 2.0;
    currentPos.x += Math.cos(now * 0.0015) * delta * 1.5;

    const targetRot = carCache.current.rotation.y;
    const currentRot = uavGroupRef.current.rotation.y;
    let rotDiff = targetRot - currentRot;
    rotDiff = ((rotDiff + Math.PI) % (2 * Math.PI)) - Math.PI;
    uavGroupRef.current.rotation.y += rotDiff * delta * 2.5;

    const distY = currentPos.y - vCarPos.y;
    
    const offsetZ = distY * Math.tan(Math.PI / 5);
    eulerY.set(0, uavGroupRef.current.rotation.y, 0);
    vForward.set(0, 0, -1).applyEuler(eulerY);
    vConeCenter.copy(currentPos).add(vForward.multiplyScalar(offsetZ));
    vConeCenter.y = vCarPos.y;

    const distXZ = Math.sqrt(Math.pow(vCarPos.x - vConeCenter.x, 2) + Math.pow(vCarPos.z - vConeCenter.z, 2));
    const coneRadiusAtCarHeight = 25 * (distY / 32) + 2; 
    
    if (distXZ < coneRadiusAtCarHeight && distY > 0 && distY < 40) {
      if (!isTargetDetectedRef.current) {
        isTargetDetectedRef.current = true;
        coneMat.color.setHex(0xff0000);
      }
    } else {
      if (isTargetDetectedRef.current) {
        isTargetDetectedRef.current = false;
        coneMat.color.setHex(0xff8800);
      }
    }
  });

  return (
    <group ref={uavGroupRef} position={initialPosition} visible={false}>
      <group rotation={[0, -Math.PI / 2, 0]}> 
        <primitive object={uavModel} scale={modelScale} />
      </group>
      <mesh geometry={coneGeo} material={coneMat} ref={detectionConeRef} />
    </group>
  );
};

// ─── GIAI ĐOẠN 1: TRẠM BẮN TỐC ĐỘ ─────────────────────────────────────────────
export const SpeedTrap = ({ position = [0, 1, -50], rotation = [0, 0, 0], scale = [15, 10, 5], speedLimit = 100, debug = false }) => {
  const meshRef = useRef();
  const boxRef = useRef(new THREE.Box3());
  const carCache = useRef(null);
  const currentSpeed = useRef(0);
  const lastViolatedTime = useRef(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const carPos = useMemo(() => new THREE.Vector3(), []);

  // 1. Lắng nghe vận tốc xe
  useEffect(() => {
    const handleSpeed = (e) => {
      currentSpeed.current = e.detail; // km/h
    };
    window.addEventListener('vehicle-speed', handleSpeed);
    return () => window.removeEventListener('vehicle-speed', handleSpeed);
  }, []);

  // 2. Cập nhật Bounding Box 1 lần lúc render
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.updateWorldMatrix(true, true);
      boxRef.current.setFromObject(meshRef.current);
      // Mở rộng trục Y để không bị trượt do trọng tâm xe nằm cao
      boxRef.current.min.y -= 10;
      boxRef.current.max.y += 10;
      // Mở rộng trục Z để chống lọt (tunneling) khi xe chạy quá nhanh qua dải mỏng
      boxRef.current.min.z -= 5;
      boxRef.current.max.z += 5;
    }
  }, [position, rotation, scale]);

  // 3. Kiểm tra va chạm mỗi frame
  useFrame((state) => {
    // Optimization: Tìm object xe hơi một lần rồi cache lại
    if (!carCache.current || !carCache.current.parent) {
      carCache.current = state.scene.getObjectByName('chassis-body-visual');
    } 
    if (!carCache.current) return; // Nếu vẫn không thấy thì thoát

    const now = Date.now();
    // Chống spam (chỉ kiểm tra/phạt 1 lần mỗi 5 giây cho mỗi lần đi qua)
    if (now - lastViolatedTime.current < 5000) return;

    carCache.current.getWorldPosition(carPos);

    if (boxRef.current.containsPoint(carPos)) {
      if (currentSpeed.current > speedLimit) {
        lastViolatedTime.current = now;
        console.log(`[POLICE] VI PHẠM TỐC ĐỘ! Tốc độ: ${currentSpeed.current} km/h (Giới hạn: ${speedLimit})`);
        
        // Nháy đèn đỏ chớp nhoáng
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 800);
        
        // Phát sự kiện vi phạm
        emitSpeedViolation(currentSpeed.current);
      }
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Vùng cảm biến vô hình (Hitbox) */}
      <mesh ref={meshRef} visible={debug}>
        <boxGeometry args={scale} />
        <meshBasicMaterial color="red" wireframe depthTest={false} opacity={0.3} transparent fog={false} />
      </mesh>

      {/* Dải Laser quét trên mặt đường */}
      <mesh position={[0, scale[1]/2 - 0.5, 0]}>
        <boxGeometry args={[scale[0], scale[1], 0.2]} />
        <meshStandardMaterial 
          color="#ff0044" 
          transparent opacity={0.2} 
          emissive="#ff0044" emissiveIntensity={isFlashing ? 5 : 1}
          side={THREE.DoubleSide}
          fog={false}
        />
      </mesh>

      {/* Bảng báo tốc độ lơ lửng */}
      <group position={[-scale[0]/2 - 1, 1, 0]}>
        <Html transform distanceFactor={15}>
          <div style={{
            background: 'white', border: '3px solid red', borderRadius: '50%',
            width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontWeight: 'bold', fontSize: '18px', color: 'black', fontFamily: 'sans-serif',
            boxShadow: '0 0 10px rgba(255, 0, 0, 0.5)'
          }}>
            {speedLimit}
          </div>
        </Html>
      </group>
    </group>
  );
};

// ─── CẢNH BÁO VI PHẠM (UI) ───────────────────────────────────────────────────
export const PoliceUI = () => {
  const [violation, setViolation] = useState(null);

  useEffect(() => {
    const handleViolation = (e) => {
      setViolation(e.detail.speed);
      
      // Chớp đỏ màn hình
      const flash = document.createElement('div');
      flash.style.position = 'fixed';
      flash.style.inset = '0';
      flash.style.backgroundColor = 'rgba(255, 0, 0, 0.4)';
      flash.style.zIndex = '99999';
      flash.style.pointerEvents = 'none';
      flash.style.transition = 'opacity 0.5s';
      document.body.appendChild(flash);
      
      setTimeout(() => { flash.style.opacity = '0'; }, 100);
      setTimeout(() => { document.body.removeChild(flash); }, 600);

      // Ẩn thông báo sau 3s
      setTimeout(() => setViolation(null), 3000);
    };

    window.addEventListener('speed-violation', handleViolation);
    return () => window.removeEventListener('speed-violation', handleViolation);
  }, []);

  if (!violation) return null;

  return (
    <div style={{
      position: 'fixed', top: '150px', left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(255, 0, 0, 0.85)', padding: '15px 30px', borderRadius: '12px',
      color: 'white', fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: '24px',
      boxShadow: '0 0 30px rgba(255,0,0,0.8)', border: '2px solid white', zIndex: 10000,
      textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px',
      animation: 'pulse 0.5s infinite alternate'
    }}>
      <style>{`@keyframes pulse { from { transform: translateX(-50%) scale(1); } to { transform: translateX(-50%) scale(1.05); } }`}</style>
      <div style={{ fontSize: '16px', marginBottom: '5px' }}>VI PHẠM TỐC ĐỘ!</div>
      <div>{violation} KM/H</div>
    </div>
  );
};

// ─── GIAO DIỆN THANH TRẠNG THÁI TẨU THOÁT UAV ────────────────────────────────
export const PoliceChaseUI = () => {
  const [chaseState, setChaseState] = useState({ isChasing: false, progress: 1, isDetected: false });

  useEffect(() => {
    const handleUpdate = (e) => {
      setChaseState(e.detail);
    };
    window.addEventListener('uav-chase-update', handleUpdate);
    return () => window.removeEventListener('uav-chase-update', handleUpdate);
  }, []);

  if (!chaseState.isChasing) return null;

  return (
    <>
      {/* Hiệu ứng nháy đỏ viền màn hình khi bị UAV đuổi */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none', zIndex: 9998,
        background: 'radial-gradient(circle, transparent 50%, rgba(255, 0, 0, 0.5) 100%)',
        animation: 'policeFlashFast 0.5s infinite alternate',
      }} />

      <style>{`
        @keyframes policeFlashFast {
          0% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>

      <div style={{
        position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)',
        width: '400px', background: 'rgba(0,0,0,0.8)', padding: '15px', borderRadius: '8px',
        border: `2px solid ${chaseState.isDetected ? '#ff0000' : '#ff8800'}`, zIndex: 10000,
        color: 'white', fontFamily: 'sans-serif', textAlign: 'center',
        boxShadow: chaseState.isDetected ? '0 0 20px rgba(255,0,0,0.6)' : '0 0 10px rgba(255,136,0,0.3)',
        transition: 'border 0.3s, box-shadow 0.3s'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px', letterSpacing: '1px', color: chaseState.isDetected ? '#ff4444' : '#ffaa00' }}>
          {chaseState.isDetected ? 'CẢNH BÁO! BẠN SẮP BỊ BẮT!' : 'ĐANG TẨU THOÁT...'}
        </div>
        
        <div style={{ width: '100%', height: '24px', background: '#333', borderRadius: '12px', overflow: 'hidden', border: '1px solid #555', position: 'relative' }}>
          <div style={{
            width: '100%', height: '100%',
            background: chaseState.isDetected ? 'red' : 'linear-gradient(90deg, #ff8800, #ffaa00)',
            transform: `scaleX(${chaseState.progress})`,
            transformOrigin: 'left',
            transition: 'transform 0.1s linear, background 0.2s ease'
          }} />
        </div>
        
        <div style={{ fontSize: '12px', marginTop: '8px', color: '#aaa' }}>
          {chaseState.isDetected ? 'THOÁT KHỎI ĐÈN ĐỎ ĐỂ TRÁNH BỊ PHẠT 360 COIN' : 'GIỮ XE NGOÀI VÙNG ĐÈN ĐỂ CẮT ĐUÔI'}
        </div>
      </div>
    </>
  );
};
