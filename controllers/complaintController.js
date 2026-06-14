const Student = require("../models/student");

// GET /complaints (with optional status filter)
const getAllComplaints = async (req, res) => {
  try {
    const { status } = req.query; // ?status=pending or resolved

    const students = await Student.find();

    const allComplaints = [];

    students.forEach((student) => {
      student.complaints.forEach((complaint) => {

        // If status filter exists, skip non-matching
        if (status && complaint.status !== status) {
          return;
        }

        allComplaints.push({
          studentName: student.name,
          studentId: student._id,
          complaintId: complaint.complaintId,
          title: complaint.title,
          status: complaint.status,
          date: complaint.date,
          resolvedAt: complaint.resolvedAt
        });
      });
    });

    return res.status(200).json(allComplaints);

  } catch (error) {
    return res.status(500).json({
      message: "Error fetching complaints",
      error: error.message
    });
  }
};

module.exports = {
  getAllComplaints
};