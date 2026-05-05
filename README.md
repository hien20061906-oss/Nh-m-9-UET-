# 🏎️ Game Đua Xe 3D —  Nhóm 9
Trò chơi đua xe 3D chạy trên trình duyệt web, được xây dựng bằng **React Three Fiber**, **Cannon.js** và **Firebase**.

---

## 🎮 Tính năng
- 🚗 **5 loại phương tiện** — Xe thường, Xe cảnh sát, Rolls Royce, Xe tăng, Máy bay trực thăng
- 🌍 **Môi trường 3D** với bản đồ, đường đua và hệ thống thời tiết (nắng, mưa, sương mù...)
- ⚙️ **Vật lý xe thực tế** — hệ thống treo, ma sát bánh xe, trọng lực (Cannon.js RaycastVehicle)
- 🏁 **Hệ thống đua** — đếm ngược, tính giờ vòng đua, vạch đích
- 🏆 **Bảng xếp hạng** — lưu thành tích lên Firebase Firestore theo thời gian thực
- 🔊 **Âm thanh** — động cơ, còi xe, nhạc nền (Howler.js)
- 📱 **Điều khiển cảm ứng** — hỗ trợ joystick ảo trên thiết bị di động

---

## 🕹️ Điều khiển

| Phím | Hành động |
|------|-----------|
| `W` / `↑` | Tiến |
| `S` / `↓` | Lùi |
| `A` / `←` | Rẽ trái |
| `D` / `→` | Rẽ phải |
| `Space` | Phanh |
| `Shift` | Nitro (tăng tốc) |
| `R` | Đặt lại vị trí xe |
| `H` | Bóp còi |

> Trên di động: sử dụng joystick ảo xuất hiện ở góc màn hình.

---

## 🛠️ Công nghệ sử dụng

| Công nghệ | Mục đích |
|-----------|----------|
| [React 18](https://react.dev) | UI framework |
| [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) | Render 3D trên web |
| [Three.js](https://threejs.org) | Thư viện đồ họa 3D |
| [@react-three/cannon](https://github.com/pmndrs/use-cannon) | Vật lý (physics engine) |
| [@react-three/drei](https://github.com/pmndrs/drei) | Helpers cho R3F |
| [Firebase](https://firebase.google.com) | Lưu trữ & bảng xếp hạng |
| [Howler.js](https://howlerjs.com) | Âm thanh |
| [Vite](https://vitejs.dev) | Build tool |
| [Tailwind CSS](https://tailwindcss.com) | Styling |

---

## 🚀 Cài đặt & Chạy

### Các bước

# 1. Cài dependencies
npm install
# 2. Chạy môi trường dev
npm run dev
```

Mở trình duyệt tại `http://localhost:3000`


## ⚙️ Cấu hình Firebase

Tạo file `.env.local` ở thư mục gốc với nội dung:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 📁 Cấu trúc thư mục

```
├── public/
│   ├── models/
│   │   ├── car/
│   │   │   ├── default/        # Xe thường
│   │   │   ├── alternative/    # Xe cảnh sát
│   │   │   ├── rolls_royce/    # Rolls Royce
│   │   │   ├── ship/           # Xe tăng
│   │   │   └── helicopter/     # Máy bay
│   │   └── map/                # Bản đồ & collision mesh
│   └── sounds/                 # File âm thanh
├── src/
│   ├── main.jsx                # Entry point
│   └── App.jsx                 # Component chính
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

