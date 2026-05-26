const Notification = require("../models/Notification");

async function getNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ sentAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotifications,
};
