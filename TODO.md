# SnapSphere Backend — Development TODO

> Complete each task before moving to the next. New tasks will be added as we go.

---

- [x] ~~Task 1 — Project Setup & Folder Structure~~ ✅
- [x] ~~Task 2 — Database Connection (MongoDB Atlas)~~ ✅
- [x] ~~Task 3 — Error Handling & Response Utils~~ ✅
- [x] ~~Task 4 — User Model~~ ✅

---

- [ ] **Task 5 — Auth Routes (Register, Login, Logout)**

> **Why Auth Routes?**
> These are the first real API endpoints. Users need to create an account (register),
> sign in (login), and sign out (logout). We use JWT (JSON Web Tokens) to keep users
> logged in — a token is sent back after login and stored in a cookie.

### Step 1: Install jsonwebtoken

```bash
npm install jsonwebtoken
```

### Step 2: Create `utils/generateToken.js`

A helper function that creates a JWT and sets it as an HTTP-only cookie.

```js
const jwt = require("jsonwebtoken");

const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  res.cookie("token", token, {
    httpOnly: true, // Can't be accessed by JavaScript (prevents XSS)
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // Prevents CSRF attacks
    maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
  });

  return token;
};

module.exports = generateToken;
```

**What's happening:**
- `jwt.sign()` — creates a token with the user's ID baked in
- `httpOnly: true` — the cookie can't be read by frontend JavaScript (security!)
- `secure` — only sends cookie over HTTPS in production
- `sameSite: "strict"` — cookie won't be sent with cross-site requests
- Token expires in 15 minutes (from your `.env`)

### Step 3: Create `controllers/authController.js`

This file contains the actual logic for register, login, and logout.

```js
const User = require("../models/User");
const createError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const generateToken = require("../utils/generateToken");

// Register
const register = async (req, res, next) => {
  const { username, email, password, fullName } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    return next(createError(400, "User with this email or username already exists"));
  }

  // Create user
  const user = await User.create({ username, email, password, fullName });

  // Generate token
  const token = generateToken(res, user._id);

  sendResponse(res, 201, {
    _id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    token,
  }, "User registered successfully");
};

// Login
const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(createError(400, "Please provide email and password"));
  }

  // Find user and include password (we set select: false in the model)
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(createError(401, "Invalid email or password"));
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(createError(401, "Invalid email or password"));
  }

  // Generate token
  const token = generateToken(res, user._id);

  sendResponse(res, 200, {
    _id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    token,
  }, "Login successful");
};

// Logout
const logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0), // Expire immediately
  });

  sendResponse(res, 200, null, "Logged out successfully");
};

module.exports = { register, login, logout };
```

**What's happening:**
- **register** — checks if user exists, creates user, returns token
- **login** — finds user by email, compares password, returns token
- **logout** — clears the cookie by setting it to expire immediately
- We use `select("+password")` in login because password is hidden by default
- Errors are passed to `next()` so our `errorHandler` catches them

### Step 4: Create `routes/authRoutes.js`

This maps URLs to controller functions.

```js
const express = require("express");
const { register, login, logout } = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

module.exports = router;
```

### Step 5: Update `server.js`

Add the auth routes. After your test route, add:

```js
const authRoutes = require("./routes/authRoutes");

app.use("/api/auth", authRoutes);
```

This means:
- `POST /api/auth/register` — register a new user
- `POST /api/auth/login` — login
- `POST /api/auth/logout` — logout

### Step 6: Test with Postman or Thunder Client

**Test Register:**
- Method: `POST`
- URL: `http://localhost:3000/api/auth/register`
- Body (JSON):
```json
{
  "username": "sahil",
  "email": "sahil@test.com",
  "password": "test123",
  "fullName": "Sahil Thakur"
}
```

You should get back a success response with user data and a token.

**Test Login:**
- Method: `POST`
- URL: `http://localhost:3000/api/auth/login`
- Body (JSON):
```json
{
  "email": "sahil@test.com",
  "password": "test123"
}
```

**Test Logout:**
- Method: `POST`
- URL: `http://localhost:3000/api/auth/logout`

If all three work — Task 5 is done!

---

> ✅ Once done, tell me and I'll add Task 6 (Auth Middleware — Protect Routes).
