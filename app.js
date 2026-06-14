const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());

app.use(express.static("frontend"));

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

// Call the function
connectDB();

// ROUTES (ADD THIS)
const studentRoutes = require("./routes/studentRoutes");
app.use("/students", studentRoutes);

const roomRoutes = require("./routes/roomRoutes");
app.use("/", roomRoutes);

const complaintRoutes = require("./routes/complaintRoutes");
app.use("/", complaintRoutes);

const feeRoutes = require("./routes/feeRoutes");
app.use("/", feeRoutes);

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});