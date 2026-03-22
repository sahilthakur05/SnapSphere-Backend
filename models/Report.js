const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    reason: {
      type: String,
      required: [true, "Report reason is required"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
