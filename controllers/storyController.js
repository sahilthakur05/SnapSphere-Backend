const Story = require("../models/Story");
const createError = require("../utils/ApiError");
const sendResponse = require("../utils/ApiResponse");
const cloudinary = require("../config/cloudinary");

// GET /stories — active stories from followed users + own
const getStories = async (req, res, next) => {
  const userIds = [...req.user.following, req.user._id];

  const stories = await Story.find({
    user: { $in: userIds },
    expiresAt: { $gt: new Date() },
  })
    .populate("user", "username profilePicture")
    .sort({ createdAt: -1 })
    .lean();

  // Group by user
  const groupMap = {};
  for (const s of stories) {
    const uid = s.user._id.toString();
    if (!groupMap[uid]) {
      groupMap[uid] = {
        userId: s.user._id,
        username: s.user.username,
        avatar: s.user.profilePicture,
        stories: [],
      };
    }
    groupMap[uid].stories.push({
      id: s._id,
      image: s.image,
      caption: s.caption,
      createdAt: s.createdAt,
    });
  }

  sendResponse(res, 200, Object.values(groupMap), "Stories fetched successfully");
};

// POST /stories — add a story (FormData: image, caption?)
const createStory = async (req, res, next) => {
  if (!req.file) {
    return next(createError(400, "Please upload an image"));
  }

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "snapsphere/stories" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(req.file.buffer);
  });

  const story = await Story.create({
    user: req.user._id,
    image: result.secure_url,
    caption: req.body.caption || "",
  });

  const populated = await Story.findById(story._id)
    .populate("user", "username profilePicture")
    .lean();

  sendResponse(res, 201, {
    userId: populated.user._id,
    username: populated.user.username,
    avatar: populated.user.profilePicture,
    stories: [{
      id: populated._id,
      image: populated.image,
      caption: populated.caption,
      createdAt: populated.createdAt,
    }],
  }, "Story created successfully");
};

module.exports = { getStories, createStory };
