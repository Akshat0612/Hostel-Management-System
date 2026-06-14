const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: Number,
      required: true
    },
    hostelBlock: {
      type: String,
      required: true
    },
    capacity: {
      type: Number,
      required: true
    },
    occupants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
      }
    ]
  },
  { timestamps: true }
);

// Unique room numbers
roomSchema.index({ roomNumber: 1 }, { unique: true });

// Optional: if you filter by block/hostel
roomSchema.index({ hostelBlock: 1 });

module.exports = mongoose.model("Room", roomSchema);