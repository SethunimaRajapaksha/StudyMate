const Request = require("../models/Request");
const User = require("../models/User");
const notify = require("../utils/notify");
const { COURSE_CODE_REGEX, normalizeCourseCode } = require("../utils/constants");

// POST /api/requests
exports.createRequest = async (req, res) => {
  try {
    const { targetUploaderId, topicDescription, targetCourseCode, deadline } = req.body;

    if (!targetUploaderId || !topicDescription || !targetCourseCode || !deadline) {
      return res.status(400).json({
        message: "Target uploader, topic description, course code and deadline are required",
      });
    }

    const code = normalizeCourseCode(targetCourseCode);
    if (!COURSE_CODE_REGEX.test(code)) {
      return res.status(400).json({ message: "Course code must look like IN24-S2-IT1207" });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ message: "Invalid deadline date" });
    }
    if (deadlineDate < new Date()) {
      return res.status(400).json({ message: "Deadline must be in the future" });
    }

    if (String(targetUploaderId) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot send a request to yourself" });
    }

    const target = await User.findById(targetUploaderId);
    if (!target) return res.status(404).json({ message: "Target uploader not found" });

    const request = await Request.create({
      requesterId: req.user._id,
      targetUploaderId: target._id,
      topicDescription,
      targetCourseCode: code,
      deadline: deadlineDate,
    });

    await notify({
      user: target._id,
      type: "request",
      message: `${req.user.name} requested notes for ${code}`,
      link: "/dashboard?tab=sent",
    });

    res.status(201).json(request);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ message: "Invalid id" });
    res.status(500).json({ message: err.message });
  }
};

// GET /api/requests/incoming
exports.getIncomingRequests = async (req, res) => {
  try {
    const requests = await Request.find({ targetUploaderId: req.user._id })
      .sort({ deadline: 1 })
      .populate("requesterId", "name indexNumber");

    const now = Date.now();
    const URGENT_MS = 3 * 24 * 60 * 60 * 1000;

    const result = requests.map((r) => {
      const msLeft = r.deadline.getTime() - now;
      return {
        ...r.toObject(),
        isUrgent: r.status === "Pending" && msLeft <= URGENT_MS,
        isOverdue: r.status === "Pending" && msLeft < 0,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/requests/sent
exports.getSentRequests = async (req, res) => {
  try {
    const requests = await Request.find({ requesterId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("targetUploaderId", "name indexNumber");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/requests/:id/status   body: { "status": "Fulfilled" }
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Fulfilled", "Closed"].includes(status)) {
      return res.status(400).json({ message: "Status must be Pending, Fulfilled or Closed" });
    }

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (!request.targetUploaderId.equals(req.user._id)) {
      return res.status(403).json({ message: "Only the target uploader can update this request" });
    }

    const changed = request.status !== status;
    request.status = status;
    await request.save({ validateModifiedOnly: true });

    if (changed && status !== "Pending") {
      await notify({
        user: request.requesterId,
        type: "request",
        message: `Your request for ${request.targetCourseCode} was marked ${status.toLowerCase()}`,
        link: "/dashboard?tab=incoming",
      });
    }

    res.json(request);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ message: "Invalid request id" });
    res.status(500).json({ message: err.message });
  }
};