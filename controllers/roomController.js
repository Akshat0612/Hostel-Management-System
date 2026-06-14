const mongoose = require("mongoose");
const Room = require("../models/room");
const Student = require("../models/student");

const createRoom = async (req, res) => {
  try {
    const { roomNumber, hostelBlock, capacity } = req.body;

    // Basic validation
    if (!roomNumber || !hostelBlock || !capacity) {
      return res.status(400).json({
        message: "roomNumber, hostelBlock and capacity are required"
      });
    }

    const room = new Room({
      roomNumber,
      hostelBlock,
      capacity,
      occupants: [] // controlled by backend
    });

    const savedRoom = await room.save();

    res.status(201).json(savedRoom);

  } catch (error) {
    res.status(500).json({
      message: "Error creating room",
      error: error.message
    });
  }
};

const assignRoom = async (req, res) => {
  try {
    const { studentId, roomId } = req.body;

    // Validation
    if (!studentId || !roomId) {
      return res.status(400).json({
        message: "studentId and roomId are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId) ||
        !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        message: "Invalid studentId or roomId"
      });
    }

    // Check student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check capacity
    if (room.occupants.length >= room.capacity) {
      return res.status(400).json({ message: "Room is full" });
    }

    // Prevent duplicate assignment
    const alreadyInRoom = room.occupants.some(
      (id) => id.toString() === student._id.toString()
    );

    if (alreadyInRoom) {
      return res.status(400).json({
        message: "Student already assigned to this room"
      });
    }

    // Remove student from previous room (if any)
    if (student.roomId && student.roomId.toString() !== room._id.toString()) {
      await Room.updateOne(
        { _id: student.roomId },
        { $pull: { occupants: student._id } }
      );
    }

    // Add to new room
    await Room.updateOne(
      { _id: room._id },
      { $addToSet: { occupants: student._id } }
    );

    // Update student
    student.roomId = room._id;
    student.allocation.status = "allocated";
    student.allocation.allocatedAt = new Date();

    // Activity log
    student.activityLog.push({
      type: "allocation",
      description: "Room allocated",
      date: new Date()
    });

    await student.save();

    return res.status(200).json({
      message: "Room assigned successfully",
      studentId: student._id,
      roomId: room._id
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error assigning room",
      error: error.message
    });
  }
};

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find(); // fetch all rooms
    return res.status(200).json(rooms);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching rooms",
      error: error.message
    });
  }
};

// GET rooms where occupants.length < capacity
const getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.find();

    const availableRooms = rooms.filter(
      (room) => room.occupants.length < room.capacity
    );

    return res.status(200).json(availableRooms);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching available rooms",
      error: error.message
    });
  }
};


// GET rooms where occupants.length === capacity
const getFullRooms = async (req, res) => {
  try {
    const rooms = await Room.find();

    const fullRooms = rooms.filter(
      (room) => room.occupants.length === room.capacity
    );

    return res.status(200).json(fullRooms);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching full rooms",
      error: error.message
    });
  }
};

const removeRoom = async (req, res) => {
  try {
    const { studentId } = req.body;

    // Validate input
    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid studentId" });
    }

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if student has a room
    if (!student.roomId) {
      return res.status(400).json({
        message: "Student is not assigned to any room"
      });
    }

    // Find room
    const room = await Room.findById(student.roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Remove student from room occupants
    await Room.updateOne(
      { _id: room._id },
      { $pull: { occupants: student._id } }
    );

    // Update student
    student.roomId = null;
    student.allocation.status = "not_assigned";
    student.allocation.allocatedAt = null;

    // Activity log
    student.activityLog.push({
      type: "deallocation",
      description: "Room removed",
      date: new Date()
    });

    await student.save();

    return res.status(200).json({
      message: "Room removed successfully",
      studentId: student._id
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error removing room",
      error: error.message
    });
  }
};

module.exports = {
  createRoom,
  assignRoom,
  getRooms,
  getAvailableRooms,
  getFullRooms,
  removeRoom
};