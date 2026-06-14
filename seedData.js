const mongoose = require("mongoose");
require("dotenv").config();

const Student = require("./models/student");
const Room = require("./models/room");
const Fee = require("./models/fee");

const firstNames = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Krishna", "Ishaan", "Rohan", "Karan",
  "Priya", "Ananya", "Sneha", "Pooja", "Kavya", "Neha", "Riya", "Isha", "Aditi", "Meera"
];

const lastNames = ["Sharma", "Verma", "Gupta", "Singh", "Patel", "Reddy", "Nair", "Iyer", "Kumar", "Yadav"];
const departments = ["CSE", "ECE", "IT", "ME", "CE"];
const complaintTitles = ["Fan not working", "WiFi issue", "Water leakage", "Light not working", "AC problem"];
const paymentMethods = ["cash", "upi", "card"];

const STUDENT_COUNT = 80;
const ROOM_COUNT = 30;

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomPhone() {
  return `9${Math.floor(100000000 + Math.random() * 900000000)}`;
}

function randomDateWithinDays(daysBack) {
  const now = Date.now();
  const delta = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - delta);
}

async function seedData() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in .env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  console.log("Clearing existing data...");
  await Promise.all([Student.deleteMany({}), Room.deleteMany({}), Fee.deleteMany({})]);

  console.log("Creating students...");
  const studentDocs = Array.from({ length: STUDENT_COUNT }, (_, i) => {
    const appliedAt = randomDateWithinDays(120);
    return {
      studentId: 1000 + i + 1,
      name: `${randomFrom(firstNames)} ${randomFrom(lastNames)}`,
      department: randomFrom(departments),
      year: Math.floor(Math.random() * 4) + 1,
      phone: randomPhone(),
      skills: ["JavaScript", "MongoDB"],
      roomId: null,
      allocation: {
        status: "pending",
        appliedAt,
        allocatedAt: null
      },
      complaints: [],
      activityLog: [
        {
          type: "registration",
          description: "Student registered",
          date: appliedAt
        }
      ]
    };
  });
  const students = await Student.insertMany(studentDocs);

  console.log("Creating rooms...");
  const roomDocs = Array.from({ length: ROOM_COUNT }, (_, i) => ({
    roomNumber: 100 + i + 1,
    hostelBlock: randomFrom(["A", "B", "C"]),
    capacity: randomFrom([2, 3, 4]),
    occupants: []
  }));
  const rooms = await Room.insertMany(roomDocs);

  console.log("Allocating rooms...");
  let allocatedCount = 0;
  const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
  for (const student of shuffledStudents) {
    // Keep some students pending for allocation flow in UI.
    if (Math.random() < 0.35) continue;

    const availableRooms = rooms.filter((room) => room.occupants.length < room.capacity);
    if (!availableRooms.length) break;

    const room = randomFrom(availableRooms);
    room.occupants.push(student._id);
    student.roomId = room._id;
    student.allocation.status = "allocated";
    student.allocation.allocatedAt = randomDateWithinDays(90);
    student.activityLog.push({
      type: "allocation",
      description: "Room allocated",
      date: student.allocation.allocatedAt
    });
    allocatedCount += 1;
  }
  await Promise.all([...rooms.map((r) => r.save()), ...students.map((s) => s.save())]);

  console.log("Adding complaints...");
  let pendingComplaints = 0;
  for (const student of students) {
    // ~45% students with 1-2 complaints
    if (Math.random() > 0.45) continue;

    const complaintCount = Math.random() < 0.7 ? 1 : 2;
    for (let i = 0; i < complaintCount; i++) {
      const date = randomDateWithinDays(60);
      const isResolved = Math.random() < 0.55;
      const status = isResolved ? "resolved" : "pending";
      if (!isResolved) pendingComplaints += 1;
      student.complaints.push({
        title: randomFrom(complaintTitles),
        status,
        date,
        resolvedAt: isResolved ? new Date(date.getTime() + 2 * 24 * 60 * 60 * 1000) : null
      });
    }
    await student.save();
  }

  console.log("Creating fee records...");
  let unpaidCount = 0;
  let partialCount = 0;
  let paidCount = 0;
  for (const student of students) {
    const totalFees = randomFrom([45000, 50000, 55000]);
    const pick = Math.random();
    let payments = [];
    let status = "unpaid";

    if (pick < 0.3) {
      unpaidCount += 1;
    } else if (pick < 0.75) {
      const p1 = Math.floor(totalFees * randomFrom([0.25, 0.4, 0.5]));
      const p2 = Math.random() < 0.5 ? Math.floor(totalFees * 0.15) : 0;
      payments = [
        { amount: p1, method: randomFrom(paymentMethods), date: randomDateWithinDays(50) }
      ];
      if (p2 > 0 && p1 + p2 < totalFees) {
        payments.push({ amount: p2, method: randomFrom(paymentMethods), date: randomDateWithinDays(20) });
      }
      status = "partial";
      partialCount += 1;
    } else {
      payments = [
        { amount: totalFees, method: randomFrom(paymentMethods), date: randomDateWithinDays(30) }
      ];
      status = "paid";
      paidCount += 1;
    }

    await Fee.create({
      studentId: student._id,
      totalFees,
      payments,
      status
    });
  }

  const availableRoomsCount = rooms.filter((room) => room.occupants.length < room.capacity).length;
  const totalAvailableCapacity = rooms.reduce(
    (sum, room) => sum + Math.max(room.capacity - room.occupants.length, 0),
    0
  );

  console.log("Seed complete");
  console.log(`Students: ${students.length}`);
  console.log(`Allocated students: ${allocatedCount}`);
  console.log(`Pending allocation students: ${students.length - allocatedCount}`);
  console.log(`Rooms: ${rooms.length} (available: ${availableRoomsCount})`);
  console.log(`Total available capacity: ${totalAvailableCapacity}`);
  console.log(`Pending complaints: ${pendingComplaints}`);
  console.log(`Fee status counts -> unpaid: ${unpaidCount}, partial: ${partialCount}, paid: ${paidCount}`);
}

seedData()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });