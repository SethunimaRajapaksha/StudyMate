const Note = require("../models/Note");
const cloudinary = require("../utils/cloudinary");

const uploadToCloudinary = (buffer, originalName) =>
  new Promise((resolve, reject) => {
    const safeName = originalName.replace(/[^a-zA-Z0-9.]/g, "_");
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "studymate/notes",
        resource_type: "raw",
        public_id: `${Date.now()}_${safeName}`,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

// POST /api/notes   (protected, multipart form-data)
exports.uploadNote = async (req, res) => {
  try {
    const { title, subject, description, tags } = req.body;

    if (!req.file) return res.status(400).json({ message: "PDF file is required" });
    if (!title || !subject) {
      return res.status(400).json({ message: "Title and subject are required" });
    }

    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    const tagList = tags
      ? tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    const note = await Note.create({
      title,
      subject,
      description,
      tags: tagList,
      fileUrl: result.secure_url,
      filePublicId: result.public_id,
      uploader: req.user._id,
    });

    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/notes?q=algorithms&tag=exam&subject=DSA   (protected)
exports.getNotes = async (req, res) => {
  try {
    const { q, tag, subject } = req.query;
    const filter = {};

    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safe, "i");
      filter.$or = [{ title: regex }, { subject: regex }, { tags: regex }];
    }
    if (tag) filter.tags = tag.toLowerCase();
    if (subject) filter.subject = new RegExp(`^${subject}$`, "i");

    const notes = await Note.find(filter)
      .sort({ createdAt: -1 })
      .populate("uploader", "name indexNumber");

    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/notes/:id   (protected)
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate("uploader", "name indexNumber");
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  } catch (err) {
    res.status(400).json({ message: "Invalid note id" });
  }
};

// POST /api/notes/:id/rate   body: { "value": 1-5 }
exports.rateNote = async (req, res) => {
  try {
    const value = Number(req.body.value);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return res.status(400).json({ message: "Rating must be a whole number from 1 to 5" });
    }

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.uploader.equals(req.user._id)) {
      return res.status(400).json({ message: "You cannot rate your own note" });
    }

    const existing = note.ratings.find((r) => r.user.equals(req.user._id));
    if (existing) existing.value = value; // rating eka wenas karanna puluwan
    else note.ratings.push({ user: req.user._id, value });

    const total = note.ratings.reduce((sum, r) => sum + r.value, 0);
    note.averageRating = Math.round((total / note.ratings.length) * 10) / 10;

    await note.save();

    res.json({
      averageRating: note.averageRating,
      ratingsCount: note.ratings.length,
      yourRating: value,
    });
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ message: "Invalid note id" });
    res.status(500).json({ message: err.message });
  }
};