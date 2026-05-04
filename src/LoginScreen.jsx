import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { playSound } from './SoundManager';

export default function LoginScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState('LOGIN'); // 'LOGIN', 'REGISTER'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper to convert username to dummy email
  const getEmail = (user) => `${user.trim().toLowerCase()}@neon.drift`;

  const handleGuestLogin = () => {
    playClickSound();
    onLoginSuccess(`Khách_${Math.floor(Math.random() * 10000)}`, true, '👤', 10000, ['default'], []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    playClickSound();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    setLoading(true);
    const email = getEmail(username);

    try {
      if (mode === 'REGISTER') {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Initialize user profile in Firestore
        const isAdmin = username.toLowerCase().includes('admin');
        const userData = {
          userName: username,
          avatar: '👤',
          gold: isAdmin ? 1000000 : 10000,
          unlockedVehicles: ['default'],
          unlockedAchievements: [],
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", user.uid), userData);

        alert('Đăng ký thành công!');
        onLoginSuccess(username, false, '👤', userData.gold, ['default'], []);
      } else {
        // 1. Login with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Fetch user profile from Firestore
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          onLoginSuccess(
            data.userName || username, 
            false, 
            data.avatar || '👤', 
            data.gold ?? 10000, 
            data.unlockedVehicles || ['default'],
            data.unlockedAchievements || []
          );
        } else {
          // If profile missing, create it (fallback for admin migration)
          const fallbackData = {
            userName: username,
            avatar: '👤',
            gold: username.toLowerCase().includes('admin') ? 1000000 : 10000,
            unlockedVehicles: ['default'],
            unlockedAchievements: []
          };
          await setDoc(doc(db, "users", user.uid), fallbackData);
          onLoginSuccess(username, false, '👤', fallbackData.gold, ['default'], []);
        }
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Sai tài khoản hoặc mật khẩu!');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Tài khoản này đã có người sử dụng!');
      } else if (err.code === 'auth/weak-password') {
        setError('Mật khẩu quá yếu (tối thiểu 6 ký tự)!');
      } else {
        setError('Lỗi kết nối server, vui lòng thử lại!');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    playClickSound();
    setIsAnimating(true);
    setTimeout(() => {
      setMode(newMode);
      setError('');
      setUsername('');
      setPassword('');
      setIsAnimating(false);
    }, 300);
  };

  const playClickSound = () => {
    playSound('click', 0.3);
  };

  return (
    <div className="login-container">
      <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;700&display=swap" rel="stylesheet" />
      <style>{`
        .login-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #050505;
          font-family: 'Chakra Petch', sans-serif;
          z-index: 9999;
          overflow: hidden;
        }

        .login-container::before {
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

        .login-card {
          position: relative;
          z-index: 10;
          background: rgba(10, 10, 20, 0.9);
          border: 2px solid #7000ff;
          border-radius: 24px;
          padding: 40px;
          width: 95%;
          max-width: 500px;
          box-shadow: 0 0 30px rgba(112, 0, 255, 0.4), inset 0 0 15px rgba(112, 0, 255, 0.2);
          color: white;
          text-align: center;
          backdrop-filter: blur(10px);
          transition: transform 0.3s ease, opacity 0.3s ease;
        }

        .login-card.animating {
          transform: scale(0.95);
          opacity: 0.5;
        }

        .game-title {
          font-size: 32px;
          font-weight: 700;
          line-height: 1.4;
          margin-bottom: 10px;
          text-transform: uppercase;
          background: linear-gradient(90deg, #00f2ff, #7000ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 10px rgba(0, 242, 255, 0.8));
          letter-spacing: 2px;
        }

        .subtitle {
          color: #00f2ff;
          font-size: 10px;
          margin-bottom: 30px;
          text-transform: uppercase;
          letter-spacing: 2px;
          text-shadow: 0 0 5px #00f2ff;
        }

        .tabs {
          display: flex;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 5px;
          margin-bottom: 25px;
        }

        .tab {
          flex: 1;
          padding: 14px 5px;
          text-align: center;
          cursor: pointer;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 700;
          transition: all 0.3s ease;
          color: #666;
          text-transform: uppercase;
        }

        .tab.active {
          background: rgba(112, 0, 255, 0.3);
          color: #fff;
          border: 1px solid #7000ff;
          box-shadow: 0 0 10px rgba(112, 0, 255, 0.5);
        }

        .input-group {
          margin-bottom: 15px;
          text-align: left;
        }

        .input-group label {
          display: block;
          font-size: 8px;
          color: #888;
          margin-bottom: 10px;
          text-transform: uppercase;
        }

        .input-field {
          width: 100%;
          padding: 12px;
          background: rgba(0,0,0,0.4);
          border: 1px solid #333;
          border-radius: 12px;
          color: #00f2ff;
          font-size: 16px;
          font-family: 'Chakra Petch', sans-serif;
          transition: all 0.3s ease;
          text-align: center;
        }

        .input-field:focus {
          outline: none;
          border-color: #00f2ff;
          box-shadow: 0 0 15px rgba(0, 242, 255, 0.2);
        }

        .error-message {
          color: #ff4444;
          font-size: 8px;
          margin-bottom: 15px;
          min-height: 18px;
        }

        .btn-primary {
          width: 100%;
          padding: 16px;
          background: linear-gradient(90deg, #7000ff, #00f2ff);
          border: none;
          border-radius: 16px;
          color: white;
          font-size: 16px;
          font-weight: 700;
          font-family: 'Chakra Petch', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          box-shadow: 0 5px 15px rgba(112, 0, 255, 0.4);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          filter: brightness(1.2);
          box-shadow: 0 8px 25px rgba(112, 0, 255, 0.6);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .divider {
          display: flex;
          align-items: center;
          margin: 25px 0;
          color: #444;
          font-size: 8px;
          text-transform: uppercase;
        }

        .divider::before, .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #222;
          margin: 0 15px;
        }

        .btn-guest {
          width: 100%;
          padding: 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid #333;
          border-radius: 12px;
          color: #888;
          font-size: 14px;
          font-family: 'Chakra Petch', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-guest:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
          border-color: #666;
        }
      `}</style>



      <div className={`login-card ${isAnimating ? 'animating' : ''}`}>
        <h1 className="game-title">Giảng Đường<br/>Trong Mơ</h1>
        <p className="subtitle">Thế Giới Tốc Độ Của Bạn</p>

        <div className="tabs">
          <div 
            className={`tab ${mode === 'LOGIN' ? 'active' : ''}`}
            onClick={() => switchMode('LOGIN')}
          >
            Đăng Nhập
          </div>
          <div 
            className={`tab ${mode === 'REGISTER' ? 'active' : ''}`}
            onClick={() => switchMode('REGISTER')}
          >
            Đăng Ký
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Tài khoản</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Nhập tên tài khoản..." 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div className="input-group">
            <label>Mật khẩu</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Nhập mật khẩu..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="error-message">{error}</div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'ĐANG XỬ LÝ...' : (mode === 'LOGIN' ? 'ĐĂNG NHẬP NGAY' : 'TẠO TÀI KHOẢN')}
          </button>
        </form>

        <div className="divider">Hoặc</div>

        <button className="btn-guest" onClick={handleGuestLogin}>
          🌐 Chơi Ngay Với Tư Cách Khách
        </button>
      </div>
    </div>
  );
}
