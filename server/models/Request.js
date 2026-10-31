const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetUploaderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    topicDescription: { type: String, required: true, trim: true },
    targetCourseCode: { type: String, required: true, trim: true, uppercase: true },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Pending", "Fulfilled", "Closed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);