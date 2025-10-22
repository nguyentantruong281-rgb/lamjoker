// firebase.js
// === CẤU HÌNH FIREBASE ===
// 👉 Thay bằng thông tin từ Firebase Console (Project Settings > SDK setup)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Khởi tạo Firebase (compat)
if (!window.firebase || !firebase.initializeApp) {
  alert("Firebase SDK chưa được load. Kiểm tra lại <script> trong index.html");
} else {
  // nếu chưa init
  if (!firebase.apps || firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
  window.auth = firebase.auth(); // gán global để main.js có thể dùng nếu cần
}

/* ========== AUTH FUNCTIONS ========== */

// Đăng ký người dùng (email/password)
async function registerUser() {
  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;

  if (!email || !password || !name) {
    alert("Vui lòng nhập đủ tên, email và mật khẩu.");
    return;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    // set display name
    try { await userCredential.user.updateProfile({ displayName: name }); } catch(e){}
    alert("Đăng ký thành công!");
    // đóng modal nếu hàm đó tồn tại
    if (typeof closeModal === 'function') closeModal();
  } catch (error) {
    alert("Lỗi đăng ký: " + error.message);
  }
}

// Đăng nhập user
async function loginUser() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    alert("Vui lòng nhập email và mật khẩu.");
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, password);
    alert("Đăng nhập thành công!");
    if (typeof closeModal === 'function') closeModal();
  } catch (error) {
    alert("Lỗi đăng nhập: " + error.message);
  }
}

// Đăng xuất
async function logoutUser() {
  try {
    await auth.signOut();
    alert("Đã đăng xuất!");
  } catch (err) {
    alert("Lỗi khi đăng xuất: " + err.message);
  }
}

// Hàm dùng nếu main.js muốn đăng ký callback (optional)
function firebaseOnAuthStateChanged(cb) {
  if (typeof cb !== 'function') return;
  auth.onAuthStateChanged(cb);
}

// Nếu muốn, cập nhật ngay UI nút .btn-auth khi auth thay đổi:
auth.onAuthStateChanged(user => {
  const btn = document.querySelector(".btn-auth");
  if (!btn) return;
  if (user) {
    btn.textContent = `👋 ${user.displayName || user.email}`;
    btn.onclick = logoutUser;
  } else {
    btn.textContent = "Đăng nhập";
    btn.onclick = () => {
      if (typeof openModal === 'function') openModal('login');
    };
  }
});

// Expose helper to window (nếu cần)
window.registerUser = registerUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.firebaseOnAuthStateChanged = firebaseOnAuthStateChanged;
