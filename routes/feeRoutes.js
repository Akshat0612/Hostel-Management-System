const express = require("express");
const router = express.Router();

const { createFee, payFees, getFeeByStudent, getAllFees } = require("../controllers/feeController");

// POST /fees/create
router.post("/fees/create", createFee);

// POST /fees/pay
router.post("/fees/pay", payFees);

router.get("/fees/:studentId", getFeeByStudent);

router.get("/fees", getAllFees);

module.exports = router;