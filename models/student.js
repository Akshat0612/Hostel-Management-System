const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  complaintId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  title: String,
  status: {
    type: String,
    enum: ["pending", "in-progress", "resolved"],
    default: "pending"
  },
  date: { type: Date, default: Date.now },
  resolvedAt: { type: Date, default: null }
});

const activitySchema = new mongoose.Schema({
  type: String,
  description: String,
  date: { type: Date, default: Date.now }
});

const studentSchema = new mongoose.Schema({
  studentId: { type: Number, required: true },
  name: String,
  department: String,
  year: Number,
  phone: String,

  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    default: null
  },

  allocation: {
    status: {
      type: String,
      enum: ["pending", "allocated", "not_assigned"],
      default: "pending"
    },
    appliedAt: { type: Date, default: Date.now },
    allocatedAt: { type: Date, default: null }
  },

  skills: [String],

  internship: {
    company: String,
    duration: String
  },

  complaints: [complaintSchema],

  activityLog: [activitySchema]

}, { timestamps: true });

// Compound filter (most common)
studentSchema.index({ department: 1, year: 1 });

// If you filter only by year sometimes
studentSchema.index({ year: 1 });

// Skills search ($all / contains)
studentSchema.index({ skills: 1 });

// Allocation status filter
studentSchema.index({ "allocation.status": 1 });

// Sort support
studentSchema.index({ name: 1 });

// Unique business ID (if you use it)
studentSchema.index({ studentId: 1 }, { unique: true });

// Optional: partial index to quickly find unassigned students
studentSchema.index(
  { roomId: 1 },
  { partialFilterExpression: { roomId: null } }
);

module.exports = mongoose.model("Student", studentSchema);