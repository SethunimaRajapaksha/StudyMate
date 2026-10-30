const express = require("express");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { uploadNote, getNotes, getNoteById } = require("../controllers/noteController");

const router = express.Router();

router.post("/", protect, upload, uploadNote);
router.get("/", protect, getNotes);
router.get("/:id", protect, getNoteById);

module.exports = router;