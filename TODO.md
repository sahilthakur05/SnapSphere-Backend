# SnapSphere Backend — Development TODO

> Complete each task before moving to the next. New tasks will be added as we go.

---

- [x] ~~Task 1 — Project Setup & Folder Structure~~ ✅
- [x] ~~Task 2 — Database Connection (MongoDB Atlas)~~ ✅
- [x] ~~Task 3 — Error Handling & Response Utils~~ ✅
- [x] ~~Task 4 — User Model~~ ✅

---

- [x] ~~Task 5 — Auth Routes (Register, Login, Logout)~~ ✅

---

- [ ] **Task 6 — Auth Middleware (Protect Routes)**

> **Why Auth Middleware?**
> Right now anyone can hit any endpoint. We need a middleware that checks if the user
> has a valid JWT token before allowing access to protected routes. This middleware will
> sit in front of any route that requires authentication.

### Step 1: Create `middlewares/authMiddleware.js`

This middleware reads the JWT from the cookie, verifies it, and attaches the user to `req.user`.

```js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const createError = require("../utils/ApiError");

const protect = async (req, res, next) => {
  let token = req.cookies.token;

  if (!token) {
    return next(createError(401, "Not authorized, no token"));
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude password)
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return next(createError(401, "User not found"));
    }

    next();
  } catch (error) {
    return next(createError(401, "Not authorized, token failed"));
  }
};

module.exports = protect;
```

**What's happening:**
- `req.cookies.token` — reads the JWT from the HTTP-only cookie
- `jwt.verify()` — decodes the token and checks if it's valid/expired
- `User.findById(decoded.id)` — finds the user from the ID stored in the token
- `req.user` — attaches the user object so any route after this can use it
- If anything fails, the user gets a 401 (Unauthorized) error

### Step 2: Create a test protected route

Add a "get my profile" route to test the middleware. Create `controllers/userController.js`:

```js
const sendResponse = require("../utils/ApiResponse");

const getMe = async (req, res) => {
  sendResponse(res, 200, req.user, "Profile fetched successfully");
};

module.exports = { getMe };
```

### Step 3: Create `routes/userRoutes.js`

```js
const express = require("express");
const { getMe } = require("../controllers/userController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/me", protect, getMe);

module.exports = router;
```

### Step 4: Update `server.js`

Add the user routes below your auth routes:

```js
const userRoutes = require("./routes/userRoutes");

app.use("/api/users", userRoutes);
```

### Step 5: Test with Postman or Thunder Client

**Step A — Login first** (to get the cookie):
- Method: `POST`
- URL: `http://localhost:3000/api/auth/login`
- Body (JSON):
```json
{
  "email": "sahil@test.com",
  "password": "test123"
}
```

**Step B — Get profile** (cookie is sent automatically):
- Method: `GET`
- URL: `http://localhost:3000/api/users/me`

You should get back your user data. If you try `/me` without logging in first, you should get a 401 error.

**Step C — Logout then try again:**
- `POST /api/auth/logout`
- Then `GET /api/users/me` — should return 401

If all tests pass — Task 6 is done!

---

> ✅ Once done, tell me and I'll add Task 7 (User Profile — Update & Upload).
