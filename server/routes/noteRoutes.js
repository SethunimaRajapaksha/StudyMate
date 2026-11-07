const express = require("express");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  uploadNote,
  getNotes,
  getSubjects,
  getTags,
  getNoteById,
  updateNote,
  deleteNote,
  rateNote,
  downloadNote,
} = require("../controllers/noteController");
const {
  addComment,
  getComments,
  deleteComment,
} = require("../controllers/commentController");

const router = express.Router();

router.post("/", protect, upload, uploadNote);
router.get("/", protect, getNotes);
router.get("/subjects", protect, getSubjects);
router.get("/tags", protect, getTags);

router.get("/:id/download", protect, downloadNote);
router.get("/:id", protect, getNoteById);
router.put("/:id", protect, updateNote);
router.delete("/:id", protect, deleteNote);

router.post("/:id/rate", protect, rateNote);

router.post("/:id/comments", protect, addComment);
router.get("/:id/comments", protect, getComments);
router.delete("/:id/comments/:commentId", protect, deleteComment);

module.exports = router;