const mongoose = require("mongoose");

// Subdocument schema for each payment
const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ["cash", "upi", "card"],
      required: true
    }
  },
  { _id: false }
);

// Main Fee schema
const feeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    totalFees: {
      type: Number,
      required: true,
      min: 0
    },

    payments: {
      type: [paymentSchema],
      default: []
    },

    status: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid"
    }
  },
  { timestamps: true }
);

// Already good (keep)
feeSchema.index({ studentId: 1 }, { unique: true });

// Filter by payment status
feeSchema.index({ status: 1 });

// Optional: recent activity / reports
feeSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Fee", feeSchema);