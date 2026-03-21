# SnapSphere Backend — Development TODO

> Complete each task before moving to the next. New tasks will be added as we go.

---

- [x] ~~Task 1 — Project Setup & Folder Structure~~ ✅
- [x] ~~Task 2 — Database Connection (MongoDB Atlas)~~ ✅
- [x] ~~Task 3 — Error Handling & Response Utils~~ ✅

---

- [ ] **Task 4 — User Model**

> **Why do we need a User Model?**
> A model defines the structure of your data in MongoDB. Think of it like a blueprint —
> it says "a user must have a username, email, password, etc." Mongoose uses this to
> validate data before saving it to the database.

### Step 1: Install bcryptjs

We need this to hash passwords before saving them (never store plain text passwords!).

```bash
npm install bcryptjs
```

### Step 2: Create `models/User.js`

This defines what a user looks like in your database.

```js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password in queries by default
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    bio: {
      type: String,
      default: "",
      maxlength: [150, "Bio cannot exceed 150 characters"],
    },
    profilePicture: {
      type: String,
      default: "",
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
```

**What's happening:**
- `userSchema` — defines all the fields a user can have with validation rules
- `select: false` on password — when you query users, password won't be included unless you explicitly ask for it
- `followers/following` — arrays of references to other User documents (for social features)
- `timestamps: true` — automatically adds `createdAt` and `updatedAt` fields
- `pre("save")` — a middleware that runs before every save. It hashes the password so we never store plain text
- `comparePassword` — a method to check if a login password matches the hashed one in the database

### Step 3: Test it

No route to test yet — we'll use this model in Task 5 (Auth Routes). For now, just make sure
your server still starts without errors after creating the model:

```bash
npm run dev
```

If the server starts with no errors — Task 4 is done!

---

> ✅ Once done, tell me and I'll add Task 5 (Auth Routes — Register, Login, Logout).
