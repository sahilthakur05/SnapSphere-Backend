const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
      default: "",
    },
    image: {
      type: String,
      default: null,
    },
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
