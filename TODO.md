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

- [x] ~~Task 6 — Auth Middleware (Protect Routes)~~ ✅

---

- [ ] **Task 7 — User Profile (Update Profile & Upload Profile Picture)**

> **Why User Profile?**
> Users need to update their profile info (full name, bio, username) and upload a profile
> picture. We'll use **Cloudinary** to store images in the cloud and **Multer** to handle
> file uploads in Express.

### Step 1: Install dependencies

```bash
npm install multer cloudinary
```

- **multer** — middleware for handling file uploads (`multipart/form-data`)
- **cloudinary** — cloud service to store and serve images

### Step 2: Set up Cloudinary

Add these to your `.env` file (get values from your Cloudinary dashboard):

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Create `config/cloudinary.js`:

```js
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
```

### Step 3: Create `middlewares/upload.js`

This configures Multer to store uploaded files temporarily in memory (as a buffer).

```js
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

module.exports = upload;
```

**What's happening:**
- `memoryStorage()` — keeps the file in memory (as a Buffer) instead of saving to disk
- `fileSize: 5MB` — rejects files larger than 5MB
- `fileFilter` — only allows image files (png, jpg, etc.)

### Step 4: Update `controllers/userController.js`

Add `updateProfile` and `updateProfilePicture` functions:

```js
const User = require("../models/User");
const createError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const cloudinary = require("../config/cloudinary");

const getMe = async (req, res) => {
  sendResponse(res, 200, req.user, "Profile fetched successfully");
};

// Update profile (fullName, bio, username)
const updateProfile = async (req, res, next) => {
  const { fullName, bio, username } = req.body;

  // If username is being changed, check if it's already taken
  if (username && username !== req.user.username) {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return next(createError(400, "Username is already taken"));
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { fullName, bio, username },
    { new: true, runValidators: true }
  );

  sendResponse(res, 200, updatedUser, "Profile updated successfully");
};

// Upload / update profile picture
const updateProfilePicture = async (req, res, next) => {
  if (!req.file) {
    return next(createError(400, "Please upload an image"));
  }

  // Upload to Cloudinary from buffer
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "snapsphere/profiles", transformation: [{ width: 400, height: 400, crop: "fill" }] },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(req.file.buffer);
  });

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { profilePicture: result.secure_url },
    { new: true }
  );

  sendResponse(res, 200, updatedUser, "Profile picture updated successfully");
};

module.exports = { getMe, updateProfile, updateProfilePicture };
```

**What's happening:**
- **updateProfile** — updates text fields; checks for duplicate username before updating
- **updateProfilePicture** — receives image via Multer, uploads to Cloudinary using a stream (since file is in memory), saves the Cloudinary URL to the user's `profilePicture` field
- `crop: "fill"` with 400x400 — Cloudinary auto-crops and resizes the image to a square

### Step 5: Update `routes/userRoutes.js`

```js
const express = require("express");
const { getMe, updateProfile, updateProfilePicture } = require("../controllers/userController");
const protect = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/profile-picture", protect, upload.single("profilePicture"), updateProfilePicture);

module.exports = router;
```

**What's happening:**
- `PUT /profile` — update text fields (protected)
- `PUT /profile-picture` — upload image (protected, uses Multer middleware)
- `upload.single("profilePicture")` — expects a single file with field name `profilePicture`

### Step 6: Test with Postman or Thunder Client

**Test Update Profile:**
- Method: `PUT`
- URL: `http://localhost:3000/api/users/profile`
- Login first to get cookie
- Body (JSON):
```json
{
  "fullName": "Sahil T",
  "bio": "Backend developer",
  "username": "sahil"
}
```

**Test Upload Profile Picture:**
- Method: `PUT`
- URL: `http://localhost:3000/api/users/profile-picture`
- Body: `form-data` (not JSON!)
  - Key: `profilePicture` (type: File)
  - Value: select an image file

You should get back the updated user with a Cloudinary URL in `profilePicture`.

If both work — Task 7 is done!

---

> ✅ Once done, tell me and I'll add Task 8 (Post Model & CRUD).
