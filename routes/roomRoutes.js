const express = require("express");
const router = express.Router();

const { createRoom, assignRoom, getRooms, getAvailableRooms, getFullRooms, removeRoom } = require("../controllers/roomController");

// POST /rooms
router.post("/rooms/assign", assignRoom);
router.post("/rooms/remove", removeRoom);
router.post("/rooms", createRoom);

router.get("/rooms/available", getAvailableRooms);
router.get("/rooms/full", getFullRooms);
router.get("/rooms", getRooms);

module.exports = router;