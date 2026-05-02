import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-9BZdeZTcBt5QIV8eEuyOfZBoKv9ucd8",
  authDomain: "group9ofuet.firebaseapp.com",
  projectId: "group9ofuet",
  storageBucket: "group9ofuet.firebasestorage.app",
  messagingSenderId: "846536624162",
  appId: "1:846536624162:web:61cb13e6ff25a347cfa27b",
  measurementId: "G-646EGTV28R"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Xuất các dịch vụ để dùng trong game
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
