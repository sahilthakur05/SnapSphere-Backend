# SnapSphere Backend — Development TODO

> Complete each task before moving to the next. New tasks will be added as we go.

---

- [x] ~~Task 1 — Project Setup & Folder Structure~~ ✅
- [x] ~~Task 2 — Database Connection (MongoDB Atlas)~~ ✅

---

- [ ] **Task 3 — Error Handling & Response Utils**

> **Why do we need this?**
> Right now if something goes wrong in your API, Express sends ugly HTML error pages.
> We want consistent JSON responses like `{ success: false, message: "Something went wrong" }`.
> This makes it easy for the frontend to handle errors and success responses uniformly.

### Step 1: Create `utils/ApiError.js`

A function that creates an error object with a status code — so our error handler
knows exactly what HTTP status and message to send back.

```js
const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.success = false;
  return error;
};

module.exports = createError;
```

**What's happening:**
- Creates a normal JavaScript Error and attaches `statusCode` to it
- `statusCode` — HTTP status like 404, 400, 500
- `success: false` — so the frontend always knows this is an error

### Step 2: Create `utils/ApiResponse.js`

A helper function to send consistent success responses.

```js
const sendResponse = (res, statusCode, data, message = "Success") => {
  res.status(statusCode).json({ success: true, message, data });
};

module.exports = sendResponse;
```

**What's happening:**
- Takes the Express `res` object and sends a formatted JSON response
- `data` holds the actual response data (user info, posts, etc.)
- `message` defaults to "Success" but you can customize it

### Step 3: Create `middlewares/errorHandler.js`

This middleware catches all errors and sends a clean JSON response.
Express knows it's an error handler because it has 4 parameters `(err, req, res, next)`.

```js
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(err);

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
```

**What's happening:**
- If the error has a `statusCode` (from our `createError`), use it — otherwise default to 500
- Logs the error for debugging
- Sends a clean JSON response to the frontend

### Step 4: Update `server.js`

Add the error handler middleware **after all routes**:

```js
const errorHandler = require("./middlewares/errorHandler");
```

Add this line at the very end, after all routes but **before** `app.listen()`:

```js
app.use(errorHandler);
```

### Step 5: Test it

Add a temporary test route in `server.js` (after the existing test route):

```js
const createError = require("./utils/ApiError");

app.get("/test-error", (req, res, next) => {
  next(createError(400, "This is a test error"));
});
```

Then visit `http://localhost:3000/test-error` — you should see:

```json
{ "success": false, "message": "This is a test error" }
```

If you see that JSON response — Task 3 is done! Remove the test route after testing.

---

> ✅ Once done, tell me and I'll add Task 4 (User Model & Auth Routes).
