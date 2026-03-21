const sendResponse = require("../utils/ApiResponse");
const getMe = async (req, res) => {
  sendResponse(res, 200, req.user, "Profile fetched successfully");
};
module.exports = { getMe };