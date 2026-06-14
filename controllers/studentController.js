const mongoose = require("mongoose");
const Student = require("../models/student");

// CREATE STUDENT
const createStudent = async (req, res) => {
  try {
    const data = req.body;

    const student = new Student({
      ...data,

      // Ensure defaults as required
      roomId: null,

      allocation: {
        status: "pending",
        appliedAt: new Date(),
        allocatedAt: null
      },

      activityLog: [
        {
          type: "registration",
          description: "Student registered",
          date: new Date()
        }
      ]
    });

    const savedStudent = await student.save();

    return res.status(201).json(savedStudent);

  } catch (error) {
    return res.status(500).json({
      message: "Error creating student",
      error: error.message
    });
  }
};

const getStudents = async (req, res) => {
  try {
    const filter = {};

    for (let key in req.query) {
      if (key !== "sort" && key !== "order") {
        filter[key] = req.query[key];
      }
    }

    let query = Student.find(filter);

    if (req.query.sort) {
      const order = req.query.order === "desc" ? -1 : 1;
      query = query.sort({ [req.query.sort]: order });
    }

    const students = await query;
    res.json(students);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addComplaint = async (req, res) => {
  try {
    const { studentId, title } = req.body;

    if (!studentId || !title) {
      return res.status(400).json({
        message: "studentId and title are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        message: "Invalid studentId"
      });
    }

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    // Create complaint object
    const complaint = {
      complaintId: new mongoose.Types.ObjectId(),
      title,
      status: "pending",
      date: new Date(),
      resolvedAt: null
    };

    // Add complaint using $push
    await Student.updateOne(
      { _id: studentId },
      { $push: { complaints: complaint } }
    );

    // Fetch updated student
    const updatedStudent = await Student.findById(studentId);

    return res.status(200).json(updatedStudent);

  } catch (error) {
    return res.status(500).json({
      message: "Error adding complaint",
      error: error.message
    });
  }
};

const resolveComplaint = async (req, res) => {
  try {
    const { studentId, complaintId } = req.body;

    // Validation
    if (!studentId || !complaintId) {
      return res.status(400).json({
        message: "studentId and complaintId are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId) ||
        !mongoose.Types.ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        message: "Invalid studentId or complaintId"
      });
    }

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    // Find complaint
    const complaint = student.complaints.find(
      (c) => c.complaintId.toString() === complaintId
    );

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found"
      });
    }

    // Update complaint
    complaint.status = "resolved";
    complaint.resolvedAt = new Date();

    // Save student
    await student.save();

    return res.status(200).json(student);

  } catch (error) {
    return res.status(500).json({
      message: "Error resolving complaint",
      error: error.message
    });
  }
};

const deleteComplaint = async (req, res) => {
  try {
    const { studentId, complaintId } = req.body;

    // Validation
    if (!studentId || !complaintId) {
      return res.status(400).json({
        message: "studentId and complaintId are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId) ||
        !mongoose.Types.ObjectId.isValid(complaintId)) {
      return res.status(400).json({
        message: "Invalid studentId or complaintId"
      });
    }

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    // Check if complaint exists
    const exists = student.complaints.some(
      (c) => c.complaintId.toString() === complaintId
    );

    if (!exists) {
      return res.status(404).json({
        message: "Complaint not found"
      });
    }

    // Remove complaint using $pull
    await Student.updateOne(
      { _id: studentId },
      { $pull: { complaints: { complaintId: complaintId } } }
    );

    // Fetch updated student
    const updatedStudent = await Student.findById(studentId);

    return res.status(200).json(updatedStudent);

  } catch (error) {
    return res.status(500).json({
      message: "Error deleting complaint",
      error: error.message
    });
  }
};

module.exports = {
  createStudent,
  getStudents,
  addComplaint,
  resolveComplaint,
  deleteComplaint
};