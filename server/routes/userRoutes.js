const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getMyStats } = require("../controllers/userController");

const router = express.Router();

router.get("/me/stats", protect, getMyStats);

module.exports = router;