const jwt = require("jsonwebtoken");
const User = require("../models/User");
const createError = require("../utils/ApiError");

const protect = async (req, res, next) => {
  let token = req.cookies.token;
  // Also check Authorization header for cross-domain deployments
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(createError(401, "Not authorized, no token"));
  }
  try {
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

module.exports=protect