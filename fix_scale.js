const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const subMatch = code.match(/const MiniSubmarine = \(\{ lastPos, lastRot, weather \}\) => \{[\s\S]*?^\};\s*$/m);
if (subMatch) {
  let miniSub = subMatch[0];
  
  miniSub = miniSub.replace(/const MiniSubmarine = \(\{ lastPos, lastRot, weather \}\) => \{/, 
    'const MiniSubmarine = ({ lastPos, lastRot, weather }) => {\n  const SCALE = 0.5; // <--- B?N CH?NH SCALE C?A TÀU MINI ? ÐÂY NHÉ! (0.5 là b?ng m?t n?a tàu thý?ng)');
    
  miniSub = miniSub.replace(/\{ type: 'Box', args: \[1\.5, 1\.2, 2\.5\], position: \[0, 0, 0\] \},/g, 
    "{ type: 'Box', args: [1.5 * SCALE, 1.2 * SCALE, 2.5 * SCALE], position: [0, 0, 0] },");
    
  miniSub = miniSub.replace(/<group ref=\{visualRef\} name="chassis-body-visual">/g, 
    '<group ref={visualRef} name="chassis-body-visual" scale={SCALE}>');

  code = code.replace(subMatch[0], miniSub);
  fs.writeFileSync('src/App.jsx', code);
  console.log('Successfully added SCALE to MiniSubmarine');
} else {
  console.log('Could not find MiniSubmarine');
}
