const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Tweak vehiclePrices
code = code.replace(/submarine: 5000,?\s*minisub: 3000/, 'submarine: 3600,\n    minisub: 2360,\n    boat: 1360');

// 2. Clone Submarine to Boat
const subMatch = code.match(/const Submarine = \(\{ lastPos, lastRot, weather \}\) => \{[\s\S]*?^\};\s*$/m);
if (subMatch) {
  let boatCode = subMatch[0];
  boatCode = boatCode.replace(/const Submarine =/, 'const Boat =');
  boatCode = boatCode.replace(/\/models\/car\/submarine\/chassis\.glb/, '/models/car/boat/chassis.glb');
  boatCode = boatCode.replace(/Submarine\._lastPosEvent/g, 'Boat._lastPosEvent');
  boatCode = boatCode.replace(/mass: 1\.2, \/\/ Tàu ng?m n?ng hõn chút/, 'mass: 1.0, // Thuy?n');
  
  // Tàu th?y không lên xu?ng ðý?c, khóa ? y = -8.5
  boatCode = boatCode.replace(/const VERT_SPEED = 8;/g, 'const VERT_SPEED = 0; // Thuy?n không l?n ng?p');
  
  // Xóa logic ngoi lên ng?p xu?ng
  const logicToReplace = 'if (controls.up) targetVel.y = VERT_SPEED;\n      if (controls.down) targetVel.y = -VERT_SPEED;\n\n      const currentPos = new THREE.Vector3();\n      physicsRef.current.getWorldPosition(currentPos);\n\n      // Gi?i h?n ð? cao m?t ný?c (y = -8) - Dùng soft limit thay v? hard set v? trí\n      if (currentPos.y > -8.5) {\n        if (targetVel.y > 0) targetVel.y = 0; // Không cho ngoi lên thêm\n        // Không t? ð?ng kéo xu?ng n?a, ngý?i chõi ph?i gi? Shift ð? l?n xu?ng\n      }\n\n      // Lerp nhanh hõn ð? xe ph?n h?i ngay khi b?m phím\n      const moveLerp = (controls.forward || controls.backward) ? 0.3 : 0.15;\n      const vertLerp = (controls.up || controls.down) ? 0.4 : 0.2;\n      localState.current.vel.x = THREE.MathUtils.lerp(localState.current.vel.x, targetVel.x, moveLerp);\n      localState.current.vel.z = THREE.MathUtils.lerp(localState.current.vel.z, targetVel.z, moveLerp);\n      localState.current.vel.y = THREE.MathUtils.lerp(localState.current.vel.y, targetVel.y, vertLerp);\n      \n      // Gi? v?n t?c theo chi?u th?ng ð?ng n?u vý?t quá m?t ný?c\n      if (currentPos.y > -8.5 && localState.current.vel.y > 0) {\n        localState.current.vel.y = 0;\n      }';
  
  const logicNew = 'const currentPos = new THREE.Vector3();\n      physicsRef.current.getWorldPosition(currentPos);\n\n      // Thuy?n b? khóa ? m?t ný?c (y = -8.5)\n      targetVel.y = (-8.5 - currentPos.y) * 5.0;\n\n      const moveLerp = (controls.forward || controls.backward) ? 0.3 : 0.15;\n      localState.current.vel.x = THREE.MathUtils.lerp(localState.current.vel.x, targetVel.x, moveLerp);\n      localState.current.vel.z = THREE.MathUtils.lerp(localState.current.vel.z, targetVel.z, moveLerp);\n      localState.current.vel.y = targetVel.y;';
  
  boatCode = boatCode.replace(logicToReplace, logicNew);

  // Thêm Boat ngay dý?i MiniSubmarine
  const miniSubMatch = code.match(/const MiniSubmarine = \(\{ lastPos, lastRot, weather \}\) => \{[\s\S]*?^\};\s*$/m);
  if (miniSubMatch) {
    code = code.replace(miniSubMatch[0], miniSubMatch[0] + '\n\n' + boatCode);
  }
}

// 3. Update VehicleContainer logic
code = code.replace(/\} else if \(activeVehicle === 'minisub'\) \{\n\s*VehicleContainer = <MiniSubmarine [^\/]*\/>;/, 
  "} else if (activeVehicle === 'minisub') {\n    VehicleContainer = <MiniSubmarine key=\"minisub\" lastPos={lastPos} lastRot={lastRot} weather={weather} />;\n  } else if (activeVehicle === 'boat') {\n    VehicleContainer = <Boat key=\"boat\" lastPos={lastPos} lastRot={lastRot} weather={weather} />;");

// 4. Update teleport logic for Boat and Submarine depths
code = code.replace(/if \(vehicleFolder === 'submarine'\) \{\n\s*lastPos\.current = \[-330, -18, 65\];\n\s*if \(lastRot\.current\) lastRot\.current = \[0, 0, 0\];\n\s*\} else if \(vehicleFolder === 'minisub'\) \{\n\s*lastPos\.current = \[-320, -18, 70\]; \/\/ T?a ð? tàu mini\n\s*if \(lastRot\.current\) lastRot\.current = \[0, 0, 0\];\n\s*\} \n\s*\/\/ 2\. T? tàu ng?m v? xe khác -> Teleport v? b?n an toàn\n\s*else if \(activeVehicle === 'submarine' || activeVehicle === 'minisub'\)/, 
if (vehicleFolder === 'submarine') {
          lastPos.current = [-330, -40, 65]; // Tàu to l?n sâu hõn (-40)
          if (lastRot.current) lastRot.current = [0, 0, 0];
        } else if (vehicleFolder === 'minisub') {
          lastPos.current = [-320, -18, 70]; // Tàu mini
          if (lastRot.current) lastRot.current = [0, 0, 0];
        } else if (vehicleFolder === 'boat') {
          lastPos.current = [-335, -8.5, 70]; // Thuy?n trên m?t ný?c
          if (lastRot.current) lastRot.current = [0, 0, 0];
        }
        // 2. T? tàu th?y/ng?m v? xe khác -> Teleport v? b?n an toàn
        else if (activeVehicle === 'submarine' || activeVehicle === 'minisub' || activeVehicle === 'boat'));

code = code.replace(/if \(folder === 'minisub'\) \{\n\s*savedPos\.current = \[-320, -18, 70\]; \/\/ T?a ð? c?a tàu mini\n\s*\} else \{\n\s*savedPos\.current = \[-330, -18, 65\]; \/\/ T?a ð? c?a tàu ng?m to\n\s*\}/,
if (folder === 'minisub') {
      savedPos.current = [-320, -18, 70]; // T?a ð? c?a tàu mini
    } else if (folder === 'boat') {
      savedPos.current = [-335, -8.5, 70]; // T?a ð? m?t ný?c
    } else {
      savedPos.current = [-330, -40, 65]; // T?a ð? c?a tàu ng?m to (h? th?p xu?ng n?a)
    });
    
// prevent boat from jumping up
code = code.replace(/if \(activeVehicle !== 'submarine' && activeVehicle !== 'minisub'\) \{/, "if (activeVehicle !== 'submarine' && activeVehicle !== 'minisub' && activeVehicle !== 'boat') {");

// 5. Add preload
code = code.replace(/useGLTF\.preload\('\/models\/car\/submarine\/chassis\.glb'\);\nuseGLTF\.preload\('\/models\/car\/minisub\/chassis\.glb'\);/, 
useGLTF.preload('/models/car/submarine/chassis.glb');
useGLTF.preload('/models/car/minisub/chassis.glb');
useGLTF.preload('/models/car/boat/chassis.glb'););

code = code.replace(/<span className="price-tag">?? 5,000<\/span>/, '<span className="price-tag">?? 3,600</span>');

fs.writeFileSync('src/App.jsx', code);
console.log('Done script 1');
