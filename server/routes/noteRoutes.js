const express = require("express");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  uploadNote,
  getNotes,
  getNoteById,
  rateNote,
} = require("../controllers/noteController");
const {
  addComment,
  getComments,
  deleteComment,
} = require("../controllers/commentController");

const router = express.Router();

router.post("/", protect, upload, uploadNote);
router.get("/", protect, getNotes);
router.get("/:id", protect, getNoteById);

router.post("/:id/rate", protect, rateNote);

router.post("/:id/comments", protect, addComment);
router.get("/:id/comments", protect, getComments);
router.delete("/:id/comments/:commentId", protect, deleteComment);

module.exports = router;