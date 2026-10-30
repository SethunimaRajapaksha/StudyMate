const Comment = require("../models/Comment");
const Note = require("../models/Note");

// POST /api/notes/:id/comments
exports.addComment = async (req, res) => {
  try {
    const text = (req.body.text || "").trim();
    if (!text) return res.status(400).json({ message: "Comment text is required" });
    if (text.length > 500) {
      return res.status(400).json({ message: "Comment must be 500 characters or less" });
    }

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const comment = await Comment.create({
      note: note._id,
      user: req.user._id,
      text,
    });
    await comment.populate("user", "name indexNumber");

    res.status(201).json(comment);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ message: "Invalid note id" });
    res.status(500).json({ message: err.message });
  }
};

// GET /api/notes/:id/comments
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ note: req.params.id })
      .sort({ createdAt: -1 })
      .populate("user", "name indexNumber");
    res.json(comments);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ message: "Invalid note id" });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/notes/:id/comments/:commentId  (own comment only)
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.commentId,
      note: req.params.id,
    });
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (!comment.user.equals(req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own comments" });
    }

    await comment.deleteOne();
    res.json({ message: "Comment deleted" });
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ message: "Invalid id" });
    res.status(500).json({ message: err.message });
  }
};