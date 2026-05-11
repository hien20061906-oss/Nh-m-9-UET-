import React, { useEffect, useRef, useState, useCallback } from 'react';

const W = window.innerWidth, H = window.innerHeight;
const BOAT_X = W / 2, WATER_Y = H * 0.28;
const HOOK_ORIGIN_X = BOAT_X + 55, HOOK_ORIGIN_Y = WATER_Y - 10;

/* ── Draw helpers ── */
function drawFish(ctx, x, y, sz, col, flip = false) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  const g = ctx.createRadialGradient(-sz*0.2, -sz*0.2, sz*0.1, 0, 0, sz);
  g.addColorStop(0, 'white'); g.addColorStop(0.3, col); g.addColorStop(1, shadeColor(col, -60));
  ctx.fillStyle = g;
  ctx.shadowColor = col; ctx.shadowBlur = 18;
  
  // Tail
  ctx.beginPath(); ctx.moveTo(sz*0.5,-0.1); ctx.lineTo(sz*1.3,-sz*0.55); ctx.lineTo(sz*1.3,sz*0.55); ctx.closePath(); ctx.fill();
  // Body
  ctx.beginPath(); ctx.ellipse(0, 0, sz, sz*0.5, 0, 0, Math.PI*2); ctx.fill();
  // Dorsal fin
  ctx.beginPath(); ctx.moveTo(-sz*0.1,-sz*0.5); ctx.quadraticCurveTo(sz*0.25,-sz*1.1,sz*0.5,-sz*0.5); ctx.closePath(); ctx.fill();
  // Pectoral fin
  ctx.fillStyle = shadeColor(col, -30);
  ctx.beginPath(); ctx.ellipse(sz*0.1, sz*0.3, sz*0.3, sz*0.15, 0.5, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  // Eye
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(-sz*0.55,-sz*0.12,sz*0.18,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(-sz*0.57,-sz*0.12,sz*0.09,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(-sz*0.61,-sz*0.16,sz*0.04,0,Math.PI*2); ctx.fill();
  // Mouth
  ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(-sz*0.85,sz*0.08,sz*0.12,0,Math.PI*0.8); ctx.stroke();
  ctx.restore();
}

function drawShark(ctx, x, y, sz, flip = false) {
  ctx.save(); ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  const l = sz * 1.5; const h = sz * 0.7;

  // 1. Dorsal Fin (Behind)
  ctx.fillStyle = '#6184a1';
  ctx.beginPath(); 
  ctx.moveTo(-l * 0.1, -h * 0.65);
  ctx.quadraticCurveTo(0, -h * 1.6, l * 0.2, -h * 1.8);
  ctx.quadraticCurveTo(l * 0.15, -h * 1.0, l * 0.3, -h * 0.5);
  ctx.fill();

  // 2. Body Silhouette
  ctx.beginPath();
  ctx.moveTo(-l * 0.95, 0); // Nose
  ctx.quadraticCurveTo(-l * 0.5, -h * 0.95, l * 0.2, -h * 0.85); // Back
  ctx.quadraticCurveTo(l * 0.7, -h * 0.6, l * 0.9, -h * 0.2); // Tail base top
  // Top Tail
  ctx.quadraticCurveTo(l * 1.25, -h * 1.1, l * 1.55, -h * 1.5); 
  ctx.quadraticCurveTo(l * 1.25, -h * 0.4, l * 1.15, 0); // Tail mid
  // Bottom Tail
  ctx.quadraticCurveTo(l * 1.25, h * 0.4, l * 1.45, h * 1.2); 
  ctx.quadraticCurveTo(l * 1.05, h * 0.5, l * 0.85, h * 0.2); // Tail base bottom
  // Belly
  ctx.quadraticCurveTo(0, h * 1.0, -l * 0.6, h * 0.7); 
  ctx.quadraticCurveTo(-l * 0.9, h * 0.5, -l * 0.95, 0);

  // Fill Body Gradient
  const bg = ctx.createLinearGradient(-l, -h, l, h);
  bg.addColorStop(0, '#7599b5'); bg.addColorStop(1, '#4f728f');
  ctx.fillStyle = bg;
  ctx.fill();

  // 3. White Belly Overlay (Clipped)
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#c5d7e6';
  ctx.beginPath();
  ctx.moveTo(-l * 1.1, h * 0.1);
  ctx.quadraticCurveTo(-l * 0.4, h * 0.25, l * 0.3, h * 0.35);
  ctx.lineTo(l * 2, h * 0.35);
  ctx.lineTo(l * 2, h * 2);
  ctx.lineTo(-l * 1.1, h * 2);
  ctx.fill();
  ctx.restore();

  // 4. Mouth Slit & Teeth
  ctx.strokeStyle = 'rgba(26,43,56,0.6)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-l * 0.9, h * 0.12);
  ctx.quadraticCurveTo(-l * 0.65, h * 0.25, -l * 0.45, h * 0.2);
  ctx.stroke();

  // Tiny Teeth
  ctx.fillStyle = '#fff';
  for(let i=0; i<4; i++) {
    const tx = -l*0.8 + i*l*0.08, ty = h*0.18 + i*h*0.02;
    ctx.beginPath();
    ctx.moveTo(tx, ty); ctx.lineTo(tx + l*0.03, ty + h*0.08); ctx.lineTo(tx + l*0.06, ty);
    ctx.closePath(); ctx.fill();
  }

  // 5. Pectoral Fin (Overlays body)
  ctx.fillStyle = '#6184a1';
  ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.moveTo(-l * 0.2, h * 0.35);
  ctx.quadraticCurveTo(-l * 0.4, h * 1.3, -l * 0.1, h * 1.7);
  ctx.quadraticCurveTo(0.1, h * 1.0, l * 0.1, h * 0.4);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 6. Eye & Gills
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(-l * 0.78, -h * 0.18, sz * 0.05, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = 'rgba(26,43,56,0.5)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  [-l * 0.42, -l * 0.34, -l * 0.26, -l * 0.18, -l * 0.1].forEach((gx, i) => {
    ctx.beginPath();
    ctx.moveTo(gx, -h * 0.05 + i*2);
    ctx.quadraticCurveTo(gx + 6, h * 0.1, gx - 4, h * 0.25 - i*2);
    ctx.stroke();
  });

  ctx.restore();
}

function drawRock(ctx, x, y, sz) {
  ctx.save(); ctx.translate(x, y);
  const g = ctx.createRadialGradient(-sz*0.2,-sz*0.3,sz*0.1,0,0,sz);
  g.addColorStop(0,'#8899aa'); g.addColorStop(1,'#445566');
  ctx.fillStyle=g; ctx.shadowColor='#223'; ctx.shadowBlur=12;
  ctx.beginPath();
  ctx.moveTo(-sz,sz*0.3); ctx.lineTo(-sz*0.7,-sz*0.5); ctx.lineTo(-sz*0.15,-sz*0.85);
  ctx.lineTo(sz*0.4,-sz*0.75); ctx.lineTo(sz,-sz*0.1); ctx.lineTo(sz*0.85,sz*0.5); ctx.closePath();
  ctx.fill(); ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.ellipse(-sz*0.2,-sz*0.35,sz*0.32,sz*0.18,-0.5,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawBoat(ctx) {
  ctx.save(); ctx.translate(BOAT_X, WATER_Y);
  // Hull
  const hg = ctx.createLinearGradient(-55,-5,55,20);
  hg.addColorStop(0,'#334466'); hg.addColorStop(1,'#1a2233');
  ctx.fillStyle=hg; ctx.strokeStyle='#5577aa'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(-55,0); ctx.lineTo(55,0); ctx.lineTo(42,22); ctx.quadraticCurveTo(0,28,-42,22); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Deck stripe
  ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(-50,4); ctx.lineTo(50,4); ctx.stroke();
  // Cabin
  const cg = ctx.createLinearGradient(-18,-30,18,0);
  cg.addColorStop(0,'#445577'); cg.addColorStop(1,'#223355');
  ctx.fillStyle=cg; ctx.strokeStyle='#6688bb'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.roundRect(-18,-28,36,28,5); ctx.fill(); ctx.stroke();
  // Windows
  [[-10,-22],[4,-22]].forEach(([wx,wy]) => {
    const wg = ctx.createRadialGradient(wx+4,wy+3,0,wx+4,wy+3,8);
    wg.addColorStop(0,'#ccffff'); wg.addColorStop(1,'#4499bb');
    ctx.fillStyle=wg; ctx.shadowColor='#88ddff'; ctx.shadowBlur=10;
    ctx.beginPath(); ctx.roundRect(wx,wy,12,10,2); ctx.fill();
  });
  ctx.shadowBlur=0;
  // Fishing rod
  ctx.strokeStyle='#aabb99'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.moveTo(28,0); ctx.lineTo(28,-40); ctx.lineTo(55,-40); ctx.stroke();
  ctx.beginPath(); ctx.arc(28,-40,3,0,Math.PI*2);
  ctx.fillStyle='#ccddaa'; ctx.fill();
  ctx.restore();
}

function drawCloud(ctx, x, y, scale) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(0, 0, 20, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(15, -15, 25, Math.PI * 1, Math.PI * 2);
  ctx.arc(45, -10, 20, Math.PI * 1, Math.PI * 2);
  ctx.arc(60, 0, 20, Math.PI * 1.5, Math.PI * 0.5);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawBg(ctx, t, bubbles, caustics, isNight) {
  if (isNight) {
    // 1. Sky (Night)
    const sky = ctx.createLinearGradient(0,0,0,WATER_Y);
    sky.addColorStop(0,'#050812'); sky.addColorStop(1,'#0a1228');
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,WATER_Y);
    // Stars
    ctx.fillStyle='rgba(255,255,255,0.85)';
    [[80,18],[160,8],[280,22],[420,6],[560,18],[680,9],[760,25],[850,12],[940,20],[1050,7],[1150,16],[1250,22]].forEach(([sx,sy]) => {
      const twinkle = 0.5+0.5*Math.sin(t*0.8+sx);
      ctx.globalAlpha=twinkle*0.9; ctx.beginPath(); ctx.arc(sx,sy,1.3,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1;
    // Moon
    ctx.fillStyle='#fffbe8'; ctx.shadowColor='#fffbe8'; ctx.shadowBlur=40;
    ctx.beginPath(); ctx.arc(W-100,45,28,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#060a14'; ctx.shadowBlur=0;
    ctx.beginPath(); ctx.arc(W-88,39,23,0,Math.PI*2); ctx.fill();
  } else {
    // 1. Sky (Daytime)
    const sky = ctx.createLinearGradient(0, 0, 0, WATER_Y);
    sky.addColorStop(0, '#56ccff');
    sky.addColorStop(1, '#c2efff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, WATER_Y);
    // Clouds
    drawCloud(ctx, W * 0.1, WATER_Y * 0.3, 1);
    drawCloud(ctx, W * 0.4, WATER_Y * 0.5, 0.7);
    drawCloud(ctx, W * 0.75, WATER_Y * 0.2, 1.2);
    // Sun
    ctx.fillStyle='rgba(255, 230, 100, 0.9)'; ctx.shadowColor='#ffaa00'; ctx.shadowBlur=30;
    ctx.beginPath(); ctx.arc(100, WATER_Y*0.4, 25, 0, Math.PI*2); ctx.fill();
  }
  ctx.shadowBlur=0;

  // 2. Water Surface Waves
  ctx.fillStyle = isNight ? '#0a1a3a' : '#2cb5e8';
  ctx.beginPath(); ctx.moveTo(0, WATER_Y);
  for (let i = 0; i <= W; i += 20) {
    ctx.lineTo(i, WATER_Y - Math.sin(i * 0.05 + t * 2) * 5);
  }
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();

  // Water Body Gradient
  const water = ctx.createLinearGradient(0, WATER_Y, 0, H);
  if (isNight) {
    water.addColorStop(0,'#0d1f3c'); water.addColorStop(0.3,'#091729'); water.addColorStop(1,'#030a12');
  } else {
    water.addColorStop(0, 'rgba(44,181,232,0.9)');
    water.addColorStop(0.5, 'rgba(23,121,176,0.95)');
    water.addColorStop(1, 'rgba(9,65,105,1)');
  }
  ctx.fillStyle = water; ctx.fillRect(0, WATER_Y + 5, W, H);

  // 3. Parallax Background Mountains (Underwater)
  ctx.fillStyle = isNight ? 'rgba(10, 30, 60, 0.6)' : 'rgba(25, 140, 190, 0.4)';
  ctx.beginPath(); ctx.moveTo(0, WATER_Y + 80);
  ctx.lineTo(W*0.15, WATER_Y+40); ctx.lineTo(W*0.3, WATER_Y+120);
  ctx.lineTo(W*0.5, WATER_Y+60); ctx.lineTo(W*0.7, WATER_Y+150);
  ctx.lineTo(W*0.9, WATER_Y+50); ctx.lineTo(W, WATER_Y+90);
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();

  ctx.fillStyle = isNight ? 'rgba(5, 15, 30, 0.7)' : 'rgba(15, 95, 140, 0.5)';
  ctx.beginPath(); ctx.moveTo(0, WATER_Y + 180);
  ctx.bezierCurveTo(W*0.3, WATER_Y+100, W*0.6, WATER_Y+250, W, WATER_Y+160);
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();

  // 4. Caustics Light Rays
  ctx.save(); ctx.globalAlpha = isNight ? 0.03 : 0.08;
  caustics.forEach(c => {
    ctx.fillStyle = isNight ? '#88ccff' : '#ccffff';
    ctx.beginPath(); ctx.moveTo(c.x, WATER_Y); ctx.lineTo(c.x - c.w, H); ctx.lineTo(c.x + c.w, H); ctx.closePath(); ctx.fill();
  });
  ctx.restore();

  // 5. Sand Bottom
  const sand = ctx.createLinearGradient(0, H - 120, 0, H);
  if (isNight) {
     sand.addColorStop(0, '#2a3b4c'); sand.addColorStop(1, '#1a2233');
  } else {
     sand.addColorStop(0, '#f9d25c'); sand.addColorStop(1, '#db9b21');
  }
  ctx.fillStyle = sand;
  ctx.beginPath(); ctx.moveTo(0, H - 60);
  ctx.bezierCurveTo(W * 0.25, H - 100, W * 0.75, H - 30, W, H - 80);
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();

  // Sand details
  ctx.fillStyle = isNight ? 'rgba(0,0,0,0.2)' : 'rgba(150,90,10,0.15)';
  for(let i=0; i<30; i++) {
    ctx.beginPath(); ctx.arc(i*30 + Math.sin(i)*20, H-40 + Math.cos(i)*30, 2+Math.random()*2, 0, Math.PI*2); ctx.fill();
  }

  // 6. Colorful Seaweed & Corals
  const tSlow = t * 0.8;
  // Green Seaweed (Thicker, layered)
  [W*0.05, W*0.12, W*0.35, W*0.7, W*0.85, W*0.95].forEach((sx, i) => {
    ctx.strokeStyle = isNight ? (i%2===0 ? '#1b5e28' : '#0e4216') : (i%2===0 ? '#3ebf52' : '#238c33'); 
    ctx.lineWidth = 20 + i%4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(sx, H);
    let px = sx, py = H;
    for(let k=1; k<=6; k++) {
      const ky = H - k*30, kx = sx + Math.sin(tSlow*1.2 + i + k*0.6)*25;
      ctx.quadraticCurveTo(px + Math.sin(tSlow*1.2 + i + (k-0.5)*0.6)*10, H - (k-0.5)*30, kx, ky);
      px = kx; py = ky;
    }
    ctx.stroke();
    // Inner light stroke for depth
    ctx.strokeStyle = isNight ? (i%2===0 ? '#278038' : '#1b5e28') : (i%2===0 ? '#5eed75' : '#3ebf52');
    ctx.lineWidth = 8;
    ctx.stroke();
  });

  // Pink/Purple Tube Corals
  [W*0.2, W*0.6, W*0.8].forEach((cx, i) => {
    ctx.fillStyle = isNight ? (i===1 ? '#9e335b' : '#682c8f') : (i===1 ? '#ff5e9c' : '#c35eff');
    ctx.beginPath(); ctx.ellipse(cx, H-30, 15, 40, Math.sin(tSlow*0.5+i)*0.1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx-20, H-15, 12, 30, -0.3+Math.sin(tSlow*0.5+i)*0.1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+20, H-20, 10, 25, 0.4+Math.sin(tSlow*0.5+i)*0.1, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx, H-65, 8, 3, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx-25, H-40, 6, 2, -0.3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+23, H-40, 5, 2, 0.4, 0, Math.PI*2); ctx.fill();
  });

  // Starfish
  ctx.save(); ctx.translate(W*0.45, H-25); ctx.rotate(0.3);
  ctx.fillStyle = isNight ? '#9e2a2a' : '#ff4d4d';
  ctx.beginPath();
  for(let i=0; i<5; i++) {
    ctx.lineTo(Math.cos(i*Math.PI*2/5)*15, Math.sin(i*Math.PI*2/5)*15);
    ctx.lineTo(Math.cos((i+0.5)*Math.PI*2/5)*6, Math.sin((i+0.5)*Math.PI*2/5)*6);
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = isNight ? '#d67c7c' : '#ff9999';
  ctx.beginPath(); ctx.arc(-3, -3, 2, 0, Math.PI*2); ctx.arc(3, -3, 2, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // 7. Bubbles
  ctx.strokeStyle = isNight ? 'rgba(120,200,255,0.45)' : 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
  bubbles.forEach(b => {
    ctx.globalAlpha = b.a; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(b.x - b.r*0.3, b.y - b.r*0.3, b.r*0.2, 0, Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function shadeColor(col, pct) {
  const num = parseInt(col.replace('#',''),16);
  const r = Math.min(255,Math.max(0,((num>>16)&0xff)+pct));
  const g = Math.min(255,Math.max(0,((num>>8)&0xff)+pct));
  const b = Math.min(255,Math.max(0,(num&0xff)+pct));
  return `rgb(${r},${g},${b})`;
}

/* ── Component ── */
export default function FishingMinigame({ onExit, onWin, onCatch }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [msg, setMsg] = useState(null);
  const [isNight, setIsNight] = useState(false); 
  
  const gRef = useRef(null);
  const lastRemRef = useRef(60); 
  const onWinRef = useRef(onWin);
  const onExitRef = useRef(onExit);
  const onCatchRef = useRef(onCatch);

  useEffect(() => {
    onWinRef.current = onWin;
    onExitRef.current = onExit;
    onCatchRef.current = onCatch;
  }, [onWin, onExit, onCatch]);

  useEffect(() => {
    const FISH_COLS = ['#ffcc33','#ff7744','#44ddff','#88ff55','#ff55cc','#55aaff'];
    gRef.current = {
      hook: { angle: Math.PI/2, len: 60, state: 'SWINGING', target: null },
      items: [
        ...Array.from({length:8},(_,i) => ({ id:i, x:80+Math.random()*(W-160), y:WATER_Y+60+Math.random()*(H-WATER_Y-180), sz:16+Math.random()*14, w:1, val:36, type:'fish', col:FISH_COLS[i%6], flip:Math.random()>0.5, speed: 0.8 + Math.random()*1.5 })),
        ...Array.from({length:3},(_,i) => ({ id:20+i, x:100+Math.random()*(W-200), y:WATER_Y+120+Math.random()*(H-WATER_Y-240), sz:60+Math.random()*30, w:5, val:136, type:'shark', flip:Math.random()>0.5, speed: 1.5 + Math.random()*1.2 })),
        ...Array.from({length:6},(_,i) => ({ id:40+i, x:60+Math.random()*(W-120), y:H-80-Math.random()*40, sz:18+Math.random()*18, w:8, val:10, type:'rock' })),
      ],
      score: 0,
      lastTime: performance.now(),
      gameTime: 0,
      bubbles: Array.from({length:30},() => ({ x:Math.random()*W, y:WATER_Y+Math.random()*(H-WATER_Y), r:2+Math.random()*5, spd:0.3+Math.random()*0.7, a:0.2+Math.random()*0.5 })),
      caustics: Array.from({length:8},() => ({ x:Math.random()*W, w:20+Math.random()*60 })),
      ended: false,
      isNight: false, 
    };
  }, []);

  useEffect(() => {
    if (gRef.current) gRef.current.isNight = isNight;
  }, [isNight]);

  const fire = useCallback(() => {
    if (!gRef.current) return;
    if (gRef.current.hook.state === 'SWINGING') gRef.current.hook.state = 'EXTENDING';
  }, []);

  useEffect(() => {
    const onKey = e => { 
      if (e.code==='Space'){e.preventDefault();fire();} 
      if(e.code==='Escape') onExitRef.current(); 
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fire]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const loop = () => {
      try {
        const g = gRef.current;
        if (!g || g.ended) return;
        
        const now = performance.now();
        const dt = (now - g.lastTime) / 1000;
        g.lastTime = now;
        
        if (dt > 1) {
          raf = requestAnimationFrame(loop);
          return;
        }
        
        g.gameTime += dt;
        const t = g.gameTime;
        const rem = Math.max(0, 60 - Math.floor(t));
        
        if (rem !== lastRemRef.current) {
          lastRemRef.current = rem;
          setTimeLeft(rem);
        }
        
        if (rem <= 0) { g.ended=true; setGameOver(true); onWinRef.current(g.score); return; }
        
        g.bubbles.forEach(b => { b.y-=b.spd; b.x+=Math.sin(t+b.r)*0.3; if(b.y<WATER_Y){ b.y=H; b.x=Math.random()*W; } });
        
        g.items.forEach(it => {
          if (it.type === 'fish' || it.type === 'shark') {
            it.x += (it.flip ? 1 : -1) * it.speed;
            it.y += Math.sin(t * 3 + it.id) * 0.4; 
            if (it.x < 50) it.flip = true;
            if (it.x > W - 50) it.flip = false;
          }
        });

        const h = g.hook;
        if (h.state==='SWINGING') { h.angle=Math.PI/2+Math.sin(t*1.5)*Math.PI/2.5; h.len=60; }
        else if (h.state==='EXTENDING') {
          h.len+=9; 
          const hx=HOOK_ORIGIN_X+Math.cos(h.angle)*h.len, hy=HOOK_ORIGIN_Y+Math.sin(h.angle)*h.len;
          if (hx<5||hx>W-5||hy>H-5) { h.state='RETRACTING'; }
          for (const it of g.items) {
            const dx=hx-it.x, dy=hy-it.y;
            if (dx*dx+dy*dy < (it.sz+10)*(it.sz+10)) { h.state='RETRACTING'; h.target=it; g.items=g.items.filter(i=>i.id!==it.id); break; }
          }
        } else {
          h.len -= h.target ? Math.max(1.5,10/h.target.w) : 10;
          if (h.len<=60) { 
            h.len=60; h.state='SWINGING'; 
            if(h.target){ 
              g.score+=h.target.val; setScore(g.score); 
              if (onCatchRef.current) onCatchRef.current(h.target.val);
              setMsg(h.target.type==='shark'?`🦈 CÁ MẬP +${h.target.val}🪙`:h.target.type==='rock'?`🪨 ĐÁ +${h.target.val}🪙`:`🐟 CÁ +${h.target.val}🪙`); 
              setTimeout(()=>setMsg(null),1400); 
              h.target=null; 
            } 
          }
        }
        
        const hx=HOOK_ORIGIN_X+Math.cos(h.angle)*h.len, hy=HOOK_ORIGIN_Y+Math.sin(h.angle)*h.len;
        drawBg(ctx, t, g.bubbles, g.caustics, g.isNight);
        drawBoat(ctx);
        
        g.items.forEach(it => {
          if(it.type==='fish') drawFish(ctx,it.x,it.y,it.sz,it.col,it.flip);
          else if(it.type==='shark') drawShark(ctx,it.x,it.y,it.sz, it.flip);
          else drawRock(ctx,it.x,it.y,it.sz);
        });
        
        ctx.strokeStyle='rgba(200,230,255,0.75)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(HOOK_ORIGIN_X,HOOK_ORIGIN_Y); ctx.lineTo(hx,hy); ctx.stroke();
        
        ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.shadowColor = '#88aaff'; ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx, hy + 8);
        ctx.arc(hx - 6, hy + 8, 6, 0, Math.PI);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(hx - 12, hy + 8); ctx.lineTo(hx - 8, hy + 12); ctx.stroke(); 
        ctx.shadowBlur = 0;
        
        if (h.target) {
          const it = h.target;
          if(it.type==='fish') drawFish(ctx,hx,hy+it.sz*0.8,it.sz*0.65,it.col,it.flip);
          else if(it.type==='shark') drawShark(ctx,hx,hy+it.sz*0.7,it.sz*0.55, it.flip);
          else drawRock(ctx,hx,hy+it.sz*0.7,it.sz*0.6);
        }
        raf = requestAnimationFrame(loop);
      } catch (e) {
        console.error("Minigame loop error:", e);
        raf = requestAnimationFrame(loop);
      }
    };
    loop();
    return () => { if(gRef.current) gRef.current.ended=true; cancelAnimationFrame(raf); };
  }, []);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:10000, fontFamily:'"Outfit","Segoe UI",sans-serif' }}>
      <canvas ref={canvasRef} width={W} height={H} style={{ display:'block', cursor:'crosshair' }} onClick={fire} />

      {/* HUD */}
      <div style={{ position:'absolute', top:0, left:0, right:0, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 28px', background: isNight ? 'linear-gradient(180deg,rgba(0,0,0,0.8) 0%,transparent 100%)' : 'linear-gradient(180deg,rgba(0,80,150,0.5) 0%,transparent 100%)', pointerEvents:'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:32 }}>🎣</span>
          <span style={{ color:'#fff', fontWeight:900, fontSize:24, letterSpacing:1, textShadow:'0 0 20px rgba(100,200,255,0.8)' }}>CÂU CÁ ĐẢO VÀNG</span>
        </div>
        
        <div style={{ pointerEvents: 'auto' }}>
            <button 
                onClick={() => setIsNight(!isNight)}
                style={{ 
                    padding: '8px 16px', borderRadius: '20px', border: 'none', 
                    cursor: 'pointer', fontWeight: 'bold', fontSize: '16px',
                    background: isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)',
                    color: '#fff', backdropFilter: 'blur(5px)', transition: '0.3s'
                }}
            >
                {isNight ? '🌞 Đổi sang Ngày' : '🌙 Đổi sang Đêm'}
            </button>
        </div>

        <div style={{ color:'#ffd700', fontWeight:800, fontSize:26, textShadow:'0 0 15px rgba(255,215,0,0.8)' }}>💰 {score.toLocaleString()} xu</div>
        
        <div style={{ background:timeLeft<=10?'rgba(255,50,50,0.3)':'rgba(255,255,255,0.1)', border:`2px solid ${timeLeft<=10?'#ff5555':'rgba(100,180,255,0.4)'}`, borderRadius:14, padding:'8px 20px', color:timeLeft<=10?'#ff8888':'#fff', fontWeight:800, fontSize:22, backdropFilter:'blur(8px)', transition:'all 0.4s' }}>
          ⏱ {timeLeft}s
        </div>
      </div>

      {/* Bottom hint */}
      <div style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', color:'rgba(255,255,255,0.7)', fontSize:14, pointerEvents:'none', textShadow: '0 0 5px rgba(0,0,0,0.5)' }}>
        <b style={{color:'#fff'}}>Space</b> / <b style={{color:'#fff'}}>Click</b> thả câu &nbsp;·&nbsp; <b style={{color:'#fff'}}>Esc</b> thoát
      </div>

      {/* Catch message */}
      {msg && <div style={{ position:'absolute', top:'40%', left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.7)', color:'#ffd700', fontWeight:900, fontSize:28, padding:'14px 40px', borderRadius:40, border:'3px solid #ffd700', backdropFilter:'blur(10px)', animation:'fadeUp 1.4s forwards', pointerEvents:'none', textShadow: '0 0 10px #ffd700' }}>{msg}</div>}

      {/* Game Over */}
      {gameOver && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,5,20,0.85)', backdropFilter:'blur(12px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontSize:72, marginBottom:10 }}>🎣</div>
          <h1 style={{ color:'#fff', fontSize:56, fontWeight:900, margin:'0 0 8px', textShadow:'0 0 40px #ffd700' }}>HẾT GIỜ!</h1>
          <p style={{ color:'#aaa', fontSize:20, margin:'0 0 6px' }}>Bạn đã kiếm được</p>
          <p style={{ color:'#ffd700', fontSize:44, fontWeight:900, margin:'0 0 36px', textShadow:'0 0 20px #ffd700' }}>{score.toLocaleString()} 💰</p>
          <button onClick={onExit} style={{ padding:'16px 48px', fontSize:22, fontWeight:800, background:'linear-gradient(135deg,#ffd700,#ff9900)', color:'#000', border:'none', borderRadius:50, cursor:'pointer', boxShadow:'0 6px 30px rgba(255,200,0,0.6)', transition:'transform 0.2s' }} onMouseOver={e=>e.currentTarget.style.transform='scale(1.06)'} onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}>
            🚢 QUAY LẠI BIỂN
          </button>
        </div>
      )}
      <style>{`@keyframes fadeUp{0%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-50px)}}`}</style>
    </div>
  );
}
