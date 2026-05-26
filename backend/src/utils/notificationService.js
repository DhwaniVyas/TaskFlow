const Twilio = require("twilio");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { env } = require("../config/env");

let twilioClient = null;
if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = new Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    console.log("Twilio SMS Client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Twilio client:", err);
  }
} else {
  console.warn("Twilio credentials not fully set. Running in Mock SMS mode.");
}

const smsTypes = [
  "project_creation",
  "project_invite",
  "invite_acceptance",
  "task_created",
  "task_assigned",
  "deadline_reminder",
];

/**
 * Trigger system notification: saves to database history and sends SMS via Twilio if applicable.
 * This runs safely and does not block API requests.
 */
async function triggerNotification({ userId, type, category, message, relatedEntity = "" }) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Check preferences (Project / Task master toggles)
    const isProjectPrefEnabled = user.notificationPreferences?.project !== false;
    const isTaskPrefEnabled = user.notificationPreferences?.task !== false;

    if (category === "Project" && !isProjectPrefEnabled) {
      console.log(`[Notification] Skipped project alert: User ${user.email} has disabled project notifications.`);
      return;
    }
    if (category === "Task" && !isTaskPrefEnabled) {
      console.log(`[Notification] Skipped task alert: User ${user.email} has disabled task notifications.`);
      return;
    }

    const hasPhone = user.phoneNumber && user.phoneNumber.trim().length > 0;
    const requiresSMS = smsTypes.includes(type);

    // Store in DB history with initial status
    const dbNotif = await Notification.create({
      user: userId,
      type,
      category,
      message,
      relatedEntity: String(relatedEntity),
      sentAt: new Date(),
      deliveryStatus: requiresSMS ? "pending" : "sent", // if no SMS needed, mark as sent immediately
    });

    if (requiresSMS) {
      if (!hasPhone) {
        console.log(`[Notification] SMS skipped (No phone number) for user ${user.email}.`);
        dbNotif.deliveryStatus = "failed";
        await dbNotif.save();
        return;
      }

      if (twilioClient && env.TWILIO_PHONE_NUMBER) {
        twilioClient.messages
          .create({
            body: message,
            from: env.TWILIO_PHONE_NUMBER,
            to: user.phoneNumber,
          })
          .then(async (msg) => {
            dbNotif.deliveryStatus = "sent";
            await dbNotif.save();
            console.log(`[Twilio SMS] Sent to ${user.phoneNumber} (SID: ${msg.sid}). Message: "${message}"`);
          })
          .catch(async (err) => {
            dbNotif.deliveryStatus = "failed";
            await dbNotif.save();
            console.error(`[Twilio SMS] Send failed to ${user.phoneNumber}:`, err.message);
          });
      } else {
        // Fallback Mock SMS mode
        console.log(`[MOCK SMS] To: ${user.phoneNumber} | Message: "${message}"`);
        dbNotif.deliveryStatus = "sent";
        await dbNotif.save();
      }
    }
  } catch (error) {
    console.error("[Notification] Error triggering notification:", error);
  }
}

/**
 * Scan database for tasks with upcoming deadlines (due in the next 24 hours) and send SMS reminders.
 */
async function checkUpcomingDeadlines() {
  try {
    const Task = require("../models/Task");
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find active non-completed tasks due in the next 24h
    const tasks = await Task.find({
      dueDate: { $gte: now, $lte: tomorrow },
      status: { $ne: "completed" },
    });

    for (const task of tasks) {
      // Avoid duplicate reminder alerts
      const existing = await Notification.findOne({
        type: "deadline_reminder",
        relatedEntity: String(task._id),
      });
      if (existing) continue;

      // Recipient is the assignee, or fall back to owner/creator
      const recipientId = task.assignedTo || task.user;
      if (!recipientId) continue;

      const formattedTime = new Date(task.dueDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const msgText = `Task '${task.title}' deadline tomorrow at ${formattedTime}.`;

      await triggerNotification({
        userId: recipientId,
        type: "deadline_reminder",
        category: "Task",
        message: msgText,
        relatedEntity: task._id.toString(),
      });
    }
  } catch (error) {
    console.error("[Notification] Error checking upcoming deadlines:", error);
  }
}

module.exports = {
  triggerNotification,
  checkUpcomingDeadlines,
};
