const mongoose = require("mongoose");
const { COURSE_CODE_REGEX } = require("../utils/constants");

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    courseCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: [COURSE_CODE_REGEX, "Course code must look like IN24-S2-IT1207"],
    },
    subject: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    tags: [{ type: String, lowercase: true, trim: true }],
    fileUrl: { type: String, required: true },
    filePublicId: { type: String, required: true },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ratings: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        value: { type: Number, min: 1, max: 5 },
      },
    ],
    averageRating: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);