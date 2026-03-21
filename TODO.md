# SnapSphere Backend — Development TODO

> Complete each task before moving to the next. New tasks will be added as we go.

---

- [x] **Task 1 — Project Setup & Folder Structure** ✅ COMPLETED

---

- [ ] **Task 2 — Database Connection (MongoDB)**

> **Why MongoDB?**
> MongoDB is a NoSQL database — it stores data as JSON-like documents (not tables like SQL).
> Perfect for social media apps because user profiles, posts, comments etc. all have
> different shapes of data. It's flexible and fast for read-heavy apps like Instagram.

> **Why Mongoose?**
> Mongoose is a library that makes working with MongoDB easier. Instead of writing
> raw database queries, you define a "schema" (a blueprint of your data) and Mongoose
> handles validation, type-checking, and query building for you.

### Step 1: Make sure MongoDB is installed

Check if MongoDB is running on your machine:

```bash
mongosh --eval "db.runCommand({ ping: 1 })"
```

If you see `{ ok: 1 }` — MongoDB is running. If not, install it:

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Step 2: Create `config/db.js`

This file connects your app to MongoDB. We keep it separate from `server.js`
to keep things organized (each file does one job).

```js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    process.exit(1); // Stop the app if DB fails — no point running without data
  }
};

module.exports = connectDB;
```

**What's happening here:**
- `mongoose.connect()` — connects to the MongoDB URL from your `.env` file
- `process.exit(1)` — if connection fails, stop the server (can't work without DB)
- We export the function so `server.js` can use it

### Step 3: Update `server.js`

Add these 2 lines to your `server.js`:

**After** `dotenv.config()` add:

```js
const connectDB = require("./config/db");
```

**Before** `app.listen(...)` add:

```js
// Connect to database
connectDB();
```

Your `server.js` should now look like this:

```js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

dotenv.config();

const connectDB = require("./config/db");

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Test route
app.get("/", (req, res) => {
  res.json({ success: true, message: "SnapSphere API is running" });
});

// Connect to database
connectDB();

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 4: Test it

Restart your server (`npm run dev`). You should see:

```
MongoDB Connected: localhost
Server running on port 3000
```

If you see both messages — Task 2 is done!

---

> ✅ Once done, tell me and I'll add Task 3 (Error Handling & Response Utils).
