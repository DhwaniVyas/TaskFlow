const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "admin", "member", "viewer"], default: "member" },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1200, default: "" },
    category: { type: String, trim: true, maxlength: 80, default: "General" },
    color: { type: String, trim: true, default: "#0E7490" },
    members: { type: [memberSchema], default: [] },
    status: { type: String, enum: ["planning", "active", "completed", "archived"], default: "active", index: true },
    startDate: { type: Date, default: null },
    targetDate: { type: Date, default: null },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1, title: 1 });

module.exports = mongoose.model("Project", projectSchema);
