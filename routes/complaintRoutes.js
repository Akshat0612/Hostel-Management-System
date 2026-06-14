const express = require("express");
const router = express.Router();

const { getAllComplaints } = require("../controllers/complaintController");

// GET /complaints
router.get("/complaints", getAllComplaints);

module.exports = router;