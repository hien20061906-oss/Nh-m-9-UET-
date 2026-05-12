import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Tạo hệ thống bọt khí nổi lơ lửng xung quanh camera
const Bubbles = ({ visibleRef }) => {
  const mesh = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 100; i++) {
      temp.push({ 
        x: (Math.random() - 0.5) * 40, 
        y: (Math.random() - 0.5) * 40, 
        z: (Math.random() - 0.5) * 40, 
        speed: 0.5 + Math.random() * 1.5, 
        scale: 0.02 + Math.random() * 0.06, 
        offset: Math.random() * 100 
      });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!mesh.current || !visibleRef.current) {
      if (mesh.current) mesh.current.visible = false;
      return;
    }
    
    mesh.current.visible = true;
    const time = state.clock.elapsedTime;
    const camPos = state.camera.position;

    particles.forEach((p, i) => {
      p.y += p.speed * 0.03;
      
      const wobbleX = Math.sin(time * 2 + p.offset) * 0.05;
      const wobbleZ = Math.cos(time * 1.5 + p.offset) * 0.05;
      
      if (p.x - camPos.x > 20) p.x -= 40;
      else if (p.x - camPos.x < -20) p.x += 40;
      
      if (p.y - camPos.y > 20) p.y -= 40;
      else if (p.y - camPos.y < -20) p.y += 40;
      
      if (p.z - camPos.z > 20) p.z -= 40;
      else if (p.z - camPos.z < -20) p.z += 40;

      dummy.position.set(p.x + wobbleX, p.y, p.z + wobbleZ);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, 100]} visible={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#e0f7fa" transparent opacity={0.3} depthWrite={false} />
    </instancedMesh>
  );
};

// Pre-allocate để tránh tạo object mới mỗi frame khi dưới nước
const _underwaterColor = new THREE.Color('#003366');
const _underwaterFog = new THREE.FogExp2(_underwaterColor, 0.015);

const UnderwaterEffect = () => {
  const isUnderwater = useRef(false);

  useFrame((state) => {
    const y = state.camera.position.y;
    const under = y < -8.5;
    
    isUnderwater.current = under;

    if (under) {
      // Tái sử dụng object có sẵn — không tạo mới mỗi frame
      state.scene.background = _underwaterColor;
      state.scene.fog = _underwaterFog;
    } else {
      state.scene.background = null;
      // KHÔNG set scene.fog = null ở đây vì sẽ làm mất sương mù của hệ thống thời tiết
    }
  });

  return <Bubbles visibleRef={isUnderwater} />;
};

export default UnderwaterEffect;
