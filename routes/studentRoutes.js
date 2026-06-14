const express = require("express");
const router = express.Router();

const { createStudent, getStudents, addComplaint, resolveComplaint, deleteComplaint } = require("../controllers/studentController");

// POST /students
router.post("/complaint/resolve", resolveComplaint);
router.post("/complaint/delete", deleteComplaint);
router.post("/complaint", addComplaint);
router.post("/", createStudent);

// GET /students
router.get("/", getStudents);

module.exports = router;