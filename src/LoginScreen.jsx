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
          font-family: 'Arial', sans-serif;
          z-index: 9999;
          overflow: hidden;
        }

        .login-container::before {
          content: "";
          position: absolute;
          width: 200%;
          height: 200%;
          top: -50%;
          left: -50%;
          background-image: 
            linear-gradient(rgba(255, 122, 47, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 122, 47, 0.15) 1px, transparent 1px);
          background-size: 40px 40px;
          transform: perspective(600px) rotateX(60deg) translateY(0);
          animation: gridMove 3s linear infinite;
          z-index: 0;
        }

        @keyframes gridMove {
          0% { transform: perspective(600px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(600px) rotateX(60deg) translateY(40px); }
        }

        .login-card {
          position: relative;
          z-index: 10;
          background: #111;
          border: 1px solid rgba(255, 122, 47, 0.4);
          border-radius: 32px;
          padding: 40px;
          width: 95%;
          max-width: 450px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 40px rgba(255, 122, 47, 0.15);
          color: white;
          text-align: center;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }

        .login-card.animating {
          transform: scale(0.95);
          opacity: 0.5;
        }

        .game-title {
          font-size: 42px;
          font-weight: 900;
          margin-bottom: 5px;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 4px;
          text-shadow: 0 0 10px rgba(255, 122, 47, 0.8), 0 0 20px #FF7A2F, 0 0 30px #FF7A2F;
          font-style: italic;
        }

        .subtitle {
          color: #FF7A2F;
          font-size: 14px;
          margin-bottom: 30px;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: bold;
        }

        .tabs {
          display: flex;
          background: #222;
          border-radius: 12px;
          padding: 5px;
          margin-bottom: 25px;
        }

        .tab {
          flex: 1;
          padding: 12px;
          text-align: center;
          cursor: pointer;
          border-radius: 8px;
          font-weight: bold;
          font-size: 14px;
          transition: all 0.3s ease;
          color: #888;
          text-transform: uppercase;
        }

        .tab.active {
          background: rgba(255, 122, 47, 0.2);
          color: #FF7A2F;
          border: 1px solid rgba(255, 122, 47, 0.5);
        }

        .input-group {
          margin-bottom: 15px;
          text-align: left;
        }

        .input-group label {
          display: block;
          font-size: 12px;
          color: #aaa;
          margin-bottom: 8px;
          text-transform: uppercase;
          font-weight: bold;
        }

        .input-field {
          width: 100%;
          padding: 15px;
          background: #222;
          border: 2px solid #333;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          transition: all 0.3s ease;
          text-align: center;
        }

        .input-field:focus {
          outline: none;
          border-color: #FF7A2F;
          box-shadow: 0 0 15px rgba(255, 122, 47, 0.2);
        }

        .error-message {
          color: #ff4444;
          font-size: 13px;
          margin-bottom: 15px;
          min-height: 18px;
          font-weight: bold;
        }

        .btn-primary {
          width: 100%;
          padding: 16px;
          background: #FF7A2F;
          border: none;
          border-radius: 16px;
          color: white;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .btn-primary:hover {
          background: #ff8e4d;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(255, 122, 47, 0.4);
        }

        .btn-primary:active {
          transform: translateY(1px);
        }

        .divider {
          display: flex;
          align-items: center;
          margin: 25px 0;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
          font-weight: bold;
        }

        .divider::before, .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #333;
          margin: 0 15px;
        }

        .btn-guest {
          width: 100%;
          padding: 14px;
          background: #333;
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
        }

        .btn-guest:hover {
          background: #444;
        }
      `}</style>



      <div className={`login-card ${isAnimating ? 'animating' : ''}`}>
        <h1 className="game-title">Neon Drift</h1>
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
