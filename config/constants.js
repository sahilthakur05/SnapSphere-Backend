module.exports = {
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || "5242880"), // 5MB default
  PROFILE_IMAGE_SIZE: parseInt(process.env.PROFILE_IMAGE_SIZE || "400"), // 400x400 default
  EXPLORE_POSTS_LIMIT: parseInt(process.env.EXPLORE_POSTS_LIMIT || "50"),
};
