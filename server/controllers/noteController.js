const Note = require("../models/Note");
const User = require("../models/User");
const Comment = require("../models/Comment");
const cloudinary = require("../utils/cloudinary");
const notify = require("../utils/notify");
const { COURSE_CODE_REGEX, normalizeCourseCode } = require("../utils/constants");

const COURSE_CODE_ERROR = "Course code must look like IN24-S2-IT1207";

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseTags = (tags) => {
  const list = Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",") : [];
  return list.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
};

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
    const { title, subject, description, tags, courseCode } = req.body;

    if (!req.file) return res.status(400).json({ message: "PDF file is required" });
    if (!title || !subject || !courseCode) {
      return res.status(400).json({ message: "Title, course code and subject are required" });
    }

    const code = normalizeCourseCode(courseCode);
    if (!COURSE_CODE_REGEX.test(code)) {
      return res.status(400).json({ message: COURSE_CODE_ERROR });
    }

    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    const note = await Note.create({
      title,
      courseCode: code,
      subject,
      description,
      tags: parseTags(tags),
      fileUrl: result.secure_url,
      filePublicId: result.public_id,
      uploader: req.user._id,
    });

    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/notes?q=&tag=&subject=&courseCode=&sort=popular&limit=6
exports.getNotes = async (req, res) => {
  try {
    const { q, tag, subject, courseCode, sort, limit } = req.query;
    const filter = {};

    if (q) {
      const regex = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { title: regex },
        { subject: regex },
        { courseCode: regex },
        { tags: regex },
      ];
    }
    if (tag) filter.tags = String(tag).toLowerCase();
    if (subject) filter.subject = new RegExp(`^${escapeRegex(subject)}$`, "i");
    if (courseCode) filter.courseCode = normalizeCourseCode(courseCode);

    const sortBy =
      sort === "popular"
        ? { averageRating: -1, downloads: -1, createdAt: -1 }
        : { createdAt: -1 };

    const max = Math.min(Number(limit) || 0, 50); // 0 = no limit

    const notes = await Note.find(filter)
      .sort(sortBy)
      .limit(max)
      .populate("uploader", "name indexNumber");

    const result = notes.map((n) => {
      const o = n.toObject();
      o.ratingsCount = o.ratings.length;
      delete o.ratings;
      return o;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/notes/subjects   (department / subject counts)
exports.getSubjects = async (req, res) => {
  try {
    const rows = await Note.aggregate([
      { $group: { _id: "$subject", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(rows.map((r) => ({ subject: r._id, count: r.count })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/notes/:id
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate("uploader", "name indexNumber");
    if (!note) return res.status(404).json({ message: "Note not found" });

    const o = note.toObject();
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    o.ratings.forEach((r) => {
      breakdown[r.value] += 1;
    });
    const mine = o.ratings.find((r) => String(r.user) === String(req.user._id));

    o.ratingsCount = o.ratings.length;
    o.ratingBreakdown = breakdown;
    o.myRating = mine ? mine.value : null;
    delete o.ratings;

    res.json(o);
  } catch (err) {
    res.status(400).json({ message: "Invalid note id" });
  }
};

// PUT /api/notes/:id   (uploader only)
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (!note.uploader.equals(req.user._id)) {
      return res.status(403).json({ message: "You can only edit your own notes" });
    }

    const { title, subject, courseCode, description, tags } = req.body;

    if (title !== undefined) {
      if (!String(title).trim()) return res.status(400).json({ message: "Title cannot be empty" });
      note.title = title;
    }
    if (subject !== undefined) {
      if (!String(subject).trim()) return res.status(400).json({ message: "Subject cannot be empty" });
      note.subject = subject;
    }
    if (courseCode !== undefined) {
      const code = normalizeCourseCode(courseCode);
      if (!COURSE_CODE_REGEX.test(code)) {
        return res.status(400).json({ message: COURSE_CODE_ERROR });
      }
      note.courseCode = code;
    }
    if (description !== undefined) note.description = description;
    if (tags !== undefined) note.tags = parseTags(tags);

    await note.save({ validateModifiedOnly: true });
    res.json(note);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ message: "Invalid note id" });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/notes/:id   (uploader only)
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (!note.uploader.equals(req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own notes" });
    }

    // Cloudinary eken file eka ain karanawa
    try {
      await cloudinary.uploader.destroy(note.filePublicId, { resource_type: "raw" });
    } catch (e) {
      console.error("Cloudinary delete failed:", e.message);
    }

    // Me note eken labuna reputation points ain karanawa
    const highRatings = note.ratings.filter((r) => r.value >= 4).length;
    if (highRatings > 0) {
      await User.findByIdAndUpdate(note.uploader, { $inc: { reputationPoints: -highRatings } });
    }

    await Comment.deleteMany({ note: note._id });
    await note.deleteOne();

    res.json({ message: "Note deleted" });
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ message: "Invalid note id" });
    res.status(500).json({ message: err.message });
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

    const isHigh = (v) => v >= 4;
    let pointChange = 0;

    const existing = note.ratings.find((r) => r.user.equals(req.user._id));
    if (existing) {
      pointChange = (isHigh(value) ? 1 : 0) - (isHigh(existing.value) ? 1 : 0);
      existing.value = value;
    } else {
      pointChange = isHigh(value) ? 1 : 0;
      note.ratings.push({ user: req.user._id, value });
    }

    const total = note.ratings.reduce((sum, r) => sum + r.value, 0);
    note.averageRating = Math.round((total / note.ratings.length) * 10) / 10;
    await note.save({ validateModifiedOnly: true });

    if (pointChange !== 0) {
      await User.findByIdAndUpdate(note.uploader, {
        $inc: { reputationPoints: pointChange },
      });
    }

    await notify({
      user: note.uploader,
      type: "rating",
      message: `${req.user.name} rated your note "${note.title}" ${value} star${value > 1 ? "s" : ""}`,
      link: `/notes/${note._id}`,
    });

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

// GET /api/notes/:id/download
exports.downloadNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (!note.uploader.equals(req.user._id)) {
      note.downloads += 1;
      await note.save({ validateModifiedOnly: true });
    }

    res.json({ fileUrl: note.fileUrl, downloads: note.downloads });
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ message: "Invalid note id" });
    res.status(500).json({ message: err.message });
  }
};