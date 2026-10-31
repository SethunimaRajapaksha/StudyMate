const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  createRequest,
  getIncomingRequests,
  getSentRequests,
  updateRequestStatus,
} = require("../controllers/requestController");

const router = express.Router();

router.post("/", protect, createRequest);
router.get("/incoming", protect, getIncomingRequests);
router.get("/sent", protect, getSentRequests);
router.patch("/:id/status", protect, updateRequestStatus);

module.exports = router;