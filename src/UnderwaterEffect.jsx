import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Tạo hệ thống bọt khí nổi lơ lửng xung quanh camera
const Bubbles = ({ visibleRef }) => {
  const mesh = useRef();
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Tạo 250 hạt bọt khí ngẫu nhiên
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 250; i++) {
      // Khởi tạo vị trí ban đầu (tương đối nhưng sẽ thành tuyệt đối)
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      const speed = 0.5 + Math.random() * 1.5; // Tốc độ nổi
      const scale = 0.02 + Math.random() * 0.06; // Kích thước bọt
      temp.push({ x, y, z, speed, scale, offset: Math.random() * 100 });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!mesh.current) return;
    
    // Chỉ hiển thị và tính toán bọt khí khi đang ở dưới nước (không gây lag)
    mesh.current.visible = visibleRef.current;
    if (!visibleRef.current) return;

    const time = state.clock.elapsedTime;
    
    const camPos = state.camera.position;
    
    // KHÔNG gắn mesh vào camera nữa, để bọt khí trôi trong không gian thế giới thực
    // Điều này tạo cảm giác tàu ngầm rẽ nước đi qua bọt khí, rất mượt!
    mesh.current.position.set(0, 0, 0);

    particles.forEach((p, i) => {
      // Bọt khí tự động nổi lên
      p.y += p.speed * 0.03;
      
      // Tạo hiệu ứng lắc lư dập dềnh của dòng nước
      const wobbleX = Math.sin(time * 2 + p.offset) * 0.05;
      const wobbleZ = Math.cos(time * 1.5 + p.offset) * 0.05;
      
      // Wrap bọt khí xung quanh camera (khi tàu di chuyển xa, bọt khí sẽ spawn lại ở phía trước)
      if (p.x - camPos.x > 20) p.x -= 40;
      if (p.x - camPos.x < -20) p.x += 40;
      
      if (p.y - camPos.y > 20) p.y -= 40;
      if (p.y - camPos.y < -20) p.y += 40;
      
      if (p.z - camPos.z > 20) p.z -= 40;
      if (p.z - camPos.z < -20) p.z += 40;

      dummy.position.set(p.x + wobbleX, p.y, p.z + wobbleZ);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, 250]} visible={false}>
      <sphereGeometry args={[1, 8, 8]} />
      {/* Bọt khí trong suốt, màu trắng pha xanh nhẹ */}
      <meshBasicMaterial color="#e0f7fa" transparent opacity={0.3} depthWrite={false} />
    </instancedMesh>
  );
};

const UnderwaterEffect = () => {
  const isUnderwater = useRef(false);

  useFrame((state) => {
    const y = state.camera.position.y;
    // Xác định xem camera đã chìm hẳn dưới mặt biển chưa
    const under = y < -8.5; 
    
    isUnderwater.current = under;

    if (under) {
      // Trả lại màu xanh thẫm cho độ sâu đại dương
      const underwaterColor = new THREE.Color('#003366'); 
      state.scene.background = underwaterColor;
      // Sương mù mỏng để vẫn nhìn thấy xung quanh
      state.scene.fog = new THREE.FogExp2(underwaterColor, 0.015);
    } else {
      state.scene.background = null; 
      state.scene.fog = null;
    }
  });

  return <Bubbles visibleRef={isUnderwater} />;
};

export default UnderwaterEffect;
