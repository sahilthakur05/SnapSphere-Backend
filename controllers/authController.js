const User = require("../models/User");
const createError = require("../utils/ApiError");
const generateToken = require("../utils/generateToken");
const sendResponse = require("../utils/ApiResponse");
const register = async (req, res, next) => {
  const { username, email, password, fullName } = req.body;

  //check id user is already exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    return next(
      createError(400, "User with this email or username already exists"),
    );
  }
  // create user
  const user = await User.create({ username, email, password, fullName });

  // genrate token

  const token = generateToken(res, user._id);

  sendResponse(
    res,
    201,
    {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      token,
    },
    "User registered successfully",
  );
};

// login

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
  //check password
  const isMatch = await user.comparePassword(password)
  if(!isMatch){
      return next(createError(401, "Invalid email or password"));
  }
  //Generate token
  const token = generateToken(res,user._id)

  sendResponse(res,200,{
      _id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    token,
  },"Login successfull")
};

const logout= async(req,res)=>{
res.cookie("token","",{
  httpOnly: true,
    expires: new Date(0), // Expire immediately
})
sendResponse(res,200,null,"Logged out successfully")
}

module.exports = { register, login ,logout};
