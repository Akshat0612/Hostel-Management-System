// Load dashboard data
async function loadDashboard() {
  try {

    // 1. Total Students
    const studentsRes = await fetch("/students");
    const students = await studentsRes.json();
    document.getElementById("totalStudents").innerText = students.length;

    // 2. Available Rooms
    const roomsRes = await fetch("/rooms/available");
    const rooms = await roomsRes.json();
    document.getElementById("availableRooms").innerText = rooms.length;

    // 3. Complaints
    const complaintsRes = await fetch("/complaints");
    const complaints = await complaintsRes.json();

    const pending = complaints.filter(c => c.status === "pending");
    document.getElementById("pendingComplaints").innerText = pending.length;

    // 4. Fees (IMPORTANT)
    const feesRes = await fetch("/fees");
    const fees = await feesRes.json();

    let total = 0;
    fees.forEach(f => {
      f.payments.forEach(p => {
        total += p.amount;
      });
    });

    document.getElementById("feesCollected").innerText = total;

  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

// Run on load
window.onload = loadDashboard;