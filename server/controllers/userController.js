const Note = require("../models/Note");
const User = require("../models/User");

// GET /api/users/me/stats
exports.getMyStats = async (req, res) => {
  try {
    const notes = await Note.find({ uploader: req.user._id }).sort({ createdAt: -1 });
    const user = await User.findById(req.user._id).select("-password");

    const totalDownloads = notes.reduce((sum, n) => sum + n.downloads, 0);
    const rated = notes.filter((n) => n.ratings.length > 0);
    const overallAverage = rated.length
      ? Math.round((rated.reduce((s, n) => s + n.averageRating, 0) / rated.length) * 10) / 10
      : 0;

    res.json({
      user,
      uploadsCount: notes.length,
      totalDownloads,
      overallAverageRating: overallAverage,
      notes: notes.map((n) => ({
        _id: n._id,
        title: n.title,
        subject: n.subject,
        courseCode: n.courseCode,
        averageRating: n.averageRating,
        ratingsCount: n.ratings.length,
        downloads: n.downloads,
        createdAt: n.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};