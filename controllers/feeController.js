const mongoose = require("mongoose");
const Fee = require("../models/fee");
const Student = require("../models/student");

// POST /fees/pay
const payFees = async (req, res) => {
  try {
    const { studentId, amount, method } = req.body;

    // Validation
    if (!studentId || !amount || !method) {
      return res.status(400).json({
        message: "studentId, amount and method are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        message: "Invalid studentId"
      });
    }

    // Find fee record
    const fee = await Fee.findOne({ studentId });

    if (!fee) {
      return res.status(404).json({
        message: "Fee record not found"
      });
    }

    // Add payment
    fee.payments.push({
      amount,
      date: new Date(),
      method
    });

    // Calculate total paid
    const totalPaid = fee.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    // Update status
    if (totalPaid === 0) {
      fee.status = "unpaid";
    } else if (totalPaid < fee.totalFees) {
      fee.status = "partial";
    } else {
      fee.status = "paid";
    }

    // Save
    await fee.save();

    return res.status(200).json(fee);

  } catch (error) {
    return res.status(500).json({
      message: "Error processing payment",
      error: error.message
    });
  }
};

const createFee = async (req, res) => {
  try {
    const { studentId, totalFees } = req.body;

    // Validation
    if (!studentId || totalFees === undefined) {
      return res.status(400).json({
        message: "studentId and totalFees are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        message: "Invalid studentId"
      });
    }

    if (typeof totalFees !== "number" || totalFees < 0) {
      return res.status(400).json({
        message: "totalFees must be a non-negative number"
      });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    // Check if fee record already exists
    const existingFee = await Fee.findOne({ studentId });
    if (existingFee) {
      return res.status(400).json({
        message: "Fee record already exists for this student"
      });
    }

    // Create fee document
    const fee = new Fee({
      studentId,
      totalFees,
      payments: [],
      status: "unpaid"
    });

    await fee.save();

    return res.status(201).json(fee);

  } catch (error) {
    return res.status(500).json({
      message: "Error creating fee record",
      error: error.message
    });
  }
};

const getFeeByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validation
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        message: "Invalid studentId"
      });
    }

    // Find fee record
    const fee = await Fee.findOne({ studentId });

    if (!fee) {
      return res.status(404).json({
        message: "Fee record not found"
      });
    }

    // Calculate totalPaid
    const totalPaid = fee.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    // Calculate remainingAmount
    const remainingAmount = fee.totalFees - totalPaid;

    return res.status(200).json({
      totalFees: fee.totalFees,
      payments: fee.payments,
      status: fee.status,
      totalPaid,
      remainingAmount
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error fetching fee details",
      error: error.message
    });
  }
};

const getAllFees = async (req, res) => {
  try {
    const fees = await Fee.find();
    res.json(fees);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching fees",
      error: error.message
    });
  }
};

module.exports = {
  createFee,
  payFees,
  getFeeByStudent,
  getAllFees
};