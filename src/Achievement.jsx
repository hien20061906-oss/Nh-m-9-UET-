import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// ─── ACHIEVEMENT DEFINITIONS ─────────────────────────────────────────────────
export const ACHIEVEMENT_DEFS = {
  'ANH_TOI_DO': {
    title: '🚗 Anh Tôi đó',
    description: 'Nà ná na na anh Nguyễn Minh Kiên!',
    icon: '🚗',
  },
  'gd1': {
    title: '🏢 Tòa Nhà GD1',
    description: 'Khám phá tòa nhà GD1!',
    icon: '🏢',
  },
  'HUST': {
    title: '🎓 Đại Học Bách Khoa',
    description: 'Chào mừng đến HUST!',
    icon: '🎓',
  },
  'PDT+ctsv': {
    title: '📝 Phòng Đào Tạo',
    description: 'Đến khu vực PĐT & CTSV!',
    icon: '📝',
  },
  'residential_buildings': {
    title: '🏠 Khu Dân Cư',
    description: 'Ghé thăm khu dân cư!',
    icon: '🏠',
  },
  'TRUONG_AE_TAO_DO': {
    title: '⚔️ Trường UET rẻ rách',
    description: 'óC chó!',
    icon: '⚔️',
  },
  'penguin': {
    title: '🐧 Chim Cánh Cụt',
    description: 'Tìm thấy khu vực chim cánh cụt!',
    icon: '🐧',
  },
};

// Fallback cho trigger không có trong danh sách định nghĩa
const DEFAULT_ACHIEVEMENT = (key) => ({
  title: `🏆 ${key}`,
  description: `Đã khám phá khu vực ${key}!`,
  icon: '🏆',
});

// ─── GLOBAL EVENT BUS (dùng CustomEvent để giao tiếp giữa Canvas ↔ DOM) ────
function emitAchievement(achievementKey) {
  window.dispatchEvent(
    new CustomEvent('achievement-unlocked', { detail: { key: achievementKey } })
  );
}

// ─── ACHIEVEMENT SYSTEM (chạy bên trong Canvas) ─────────────────────────────
export function AchievementSystem({ lastPos, unlocked = [], onUnlock }) {
  const triggersRef = useRef([]); // [{ key, box3 }]
  const loadedRef = useRef(false);
  // Bộ nhớ tạm để chặn lặp lại ngay lập tức
  const sessionUnlocked = useRef(new Set(unlocked));

  // Đồng bộ bộ nhớ tạm khi danh sách unlocked từ App thay đổi (ví dụ khi load game)
  useEffect(() => {
    unlocked.forEach(key => sessionUnlocked.current.add(key));
  }, [unlocked]);

  // Load trigger.glb một lần duy nhất
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load('/models/map/trigger.glb', (gltf) => {
      const triggers = [];
      gltf.scene.traverse((child) => {
        if (child.name && child.name.startsWith('trg_')) {
          const key = child.name.replace('trg_', '');
          child.updateWorldMatrix(true, true);
          const box = new THREE.Box3().setFromObject(child);
          if (!box.isEmpty()) {
            triggers.push({ key, box });
          }
        }
      });
      triggersRef.current = triggers;
      loadedRef.current = true;
    }, undefined, (err) => {
      console.error('[Achievement] Failed to load trigger.glb:', err);
    });
  }, []);

  const frameCount = useRef(0);

  // Mỗi frame: lấy vị trí xe → check collision với từng trigger
  useFrame(() => {
    if (!loadedRef.current || triggersRef.current.length === 0) return;
    if (!lastPos || !lastPos.current) return;
    
    // Tối ưu: Chỉ kiểm tra va chạm 10 khung hình 1 lần (giảm 90% tải CPU)
    frameCount.current++;
    if (frameCount.current % 10 !== 0) return;
    
    const vehiclePos = new THREE.Vector3(lastPos.current[0], lastPos.current[1], lastPos.current[2]);

    for (const trigger of triggersRef.current) {
      // Kiểm tra cả state của App và bộ nhớ tạm của session
      if (sessionUnlocked.current.has(trigger.key)) continue; 

      if (trigger.box.containsPoint(vehiclePos)) {
        sessionUnlocked.current.add(trigger.key); // Chặn ngay lập tức
        onUnlock(trigger.key);
        emitAchievement(trigger.key);
        console.log(`[Achievement] 🏆 Unlocked: ${trigger.key}`);
      }
    }
  });

  return null;
}

// ─── ACHIEVEMENT TOAST UI (Thông báo góc màn hình) ──────────────────────────
export function AchievementUI() {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  useEffect(() => {
    const handler = (e) => {
      const { key } = e.detail;
      const def = ACHIEVEMENT_DEFS[key] || DEFAULT_ACHIEVEMENT(key);
      const id = ++toastIdRef.current;
      setToasts((prev) => [...prev, { id, ...def, key }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    window.addEventListener('achievement-unlocked', handler);
    return () => window.removeEventListener('achievement-unlocked', handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: '80px', right: '20px', zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes achSlideIn { 0% { transform: translateX(120%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes achShine { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes achPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
      `}</style>
      {toasts.map((toast) => (
        <div key={toast.id} style={{
          background: 'linear-gradient(135deg, rgba(20,20,30,0.95) 0%, rgba(40,30,60,0.95) 100%)',
          border: '1px solid rgba(255, 200, 50, 0.5)',
          borderRadius: '16px', padding: '16px 22px', display: 'flex', alignItems: 'center', gap: '14px',
          minWidth: '300px', maxWidth: '400px', boxShadow: '0 8px 32px rgba(255, 170, 0, 0.3)',
          backdropFilter: 'blur(12px)', animation: 'achSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          fontFamily: "sans-serif", overflow: 'hidden', position: 'relative',
        }}>
          <div style={{ fontSize: '36px', animation: 'achPulse 1s ease-in-out 2' }}>{toast.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>🏆 Thành Tựu Mở Khóa</div>
            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>{toast.title}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{toast.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ACHIEVEMENT BOARD (Bảng danh sách toàn bộ thành tích) ──────────────────
export function AchievementBoard({ isOpen, onClose, unlocked = [] }) {
  if (!isOpen) return null;
  const unlockedSet = new Set(unlocked);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        width: '90%', maxWidth: '700px', maxHeight: '85vh',
        background: '#151520', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{
          padding: '25px 40px', background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>🏆 THÀNH TỰU</h2>
            <div style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
              Đã hoàn thành: <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{unlocked.length} / {Object.keys(ACHIEVEMENT_DEFS).length}</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
            width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px'
          }}>✕</button>
        </div>

        {/* List */}
        <div style={{
          padding: '20px 40px', overflowY: 'auto', flex: 1,
          display: 'grid', gridTemplateColumns: '1fr', gap: '12px'
        }}>
          {Object.entries(ACHIEVEMENT_DEFS).map(([key, def]) => {
            const isUnlocked = unlockedSet.has(key);
            return (
              <div key={key} style={{
                padding: '16px 20px', borderRadius: '16px',
                background: isUnlocked ? 'rgba(255, 215, 0, 0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isUnlocked ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                display: 'flex', alignItems: 'center', gap: '18px',
                filter: isUnlocked ? 'none' : 'grayscale(1) opacity(0.5)',
                transition: 'all 0.3s'
              }}>
                <div style={{ fontSize: '40px' }}>{def.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: isUnlocked ? '#FFD700' : 'white', fontWeight: 'bold', fontSize: '16px' }}>{def.title}</div>
                  <div style={{ color: '#888', fontSize: '13px' }}>{def.description}</div>
                </div>
                {isUnlocked ? 
                  <div style={{ color: '#FFD700', fontSize: '12px', fontWeight: 'bold' }}>✓ HOÀN THÀNH</div> :
                  <div style={{ color: '#555', fontSize: '12px', fontWeight: 'bold' }}>CHƯA ĐẠT</div>
                }
              </div>
            );
          })}
        </div>
      </div>
      <style>{` @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } `}</style>
    </div>
  );
}
