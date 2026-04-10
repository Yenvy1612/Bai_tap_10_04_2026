// ================= IMPORT =================
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");

// ================= INIT =================
const app = express();
app.use(express.json());
app.use(cookieParser());

// ================= CONFIG =================
const CONFIG = {
  SESSION_SECRET: "mini-shop-secret",
  THEME_EXPIRE: 10 * 60 * 1000, // 10 phút
};

// ================= SESSION =================
app.use(
  session({
    secret: CONFIG.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// ================= RESPONSE FORMAT =================
const success = (res, data = {}, message = "OK") => {
  return res.json({
    success: true,
    message,
    data,
  });
};

const error = (res, message = "Error", code = 400) => {
  return res.status(code).json({
    success: false,
    message,
  });
};

// ================= MIDDLEWARE =================
const isLoggedIn = (req, res, next) => {
  if (!req.session.user) {
    return error(res, "Chưa đăng nhập", 401);
  }
  next();
};

// ================= UTIL =================
const isValidTheme = (theme) => ["light", "dark"].includes(theme);

// ================= ROUTES =================

// ===== 1. HOME =====
app.get("/", (req, res) => {
  const user = req.session.user;
  const theme = req.cookies.theme || "light";

  return success(res, {
    title: "Mini Profile App",
    message: user
      ? `Xin chào, ${user.username}`
      : "Bạn chưa đăng nhập",
    theme,
  });
});

// ===== 2. SET THEME =====
app.get("/set-theme/:theme", (req, res) => {
  const { theme } = req.params;

  if (!isValidTheme(theme)) {
    return error(res, "Theme chỉ được là light hoặc dark");
  }

  res.cookie("theme", theme, {
    maxAge: CONFIG.THEME_EXPIRE,
    httpOnly: true,
  });

  return success(res, { theme }, "Đã lưu theme");
});

// ===== 3. LOGIN =====
app.post("/login", (req, res) => {
  const { username } = req.body;

  if (!username || username.trim() === "") {
    return error(res, "Username không hợp lệ");
  }

  req.session.user = {
    username,
    loginTime: new Date(),
    profileViews: 0,
  };

  return success(res, req.session.user, "Đăng nhập thành công");
});

// ===== 4. PROFILE =====
app.get("/profile", isLoggedIn, (req, res) => {
  req.session.user.profileViews++;

  return success(res, req.session.user);
});

// ===== 5. LOGOUT =====
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    return success(res, {}, "Đã logout");
  });
});

// ================= START =================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});