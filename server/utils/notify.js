const Notification = require("../models/Notification");

// Notification fail unath main wade nawathenne nae
module.exports = async ({ user, type, message, link }) => {
  try {
    await Notification.create({ user, type, message, link });
  } catch (err) {
    console.error("Notification error:", err.message);
  }
};