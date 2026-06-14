// ---------- HELPERS ----------
async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
}

// ---------- DASHBOARD ----------
function loadDashboard() {
  document.getElementById("mainContent").innerHTML = `
    <h1>Dashboard</h1>
    <div class="panel">
      <div style="display:flex; gap:20px; flex-wrap:wrap;">
        <div class="card"><p>Total Students</p><h2 id="d_students_total">--</h2></div>
        <div class="card"><p>Students Without Rooms</p><h2 id="d_students_without_rooms">--</h2></div>
        <div class="card"><p>Students With Pending Fees</p><h2 id="d_students_pending_fees">--</h2></div>
        <div class="card"><p>Rooms Available</p><h2 id="d_rooms_available">--</h2></div>
        <div class="card"><p>Total Capacity Available</p><h2 id="d_capacity_available">--</h2></div>
        <div class="card"><p>Pending Complaints</p><h2 id="d_complaints_pending">--</h2></div>
      </div>
    </div>
  `;
  loadDashboardData();
}

async function loadDashboardData() {
  try {
    const [students, rooms, complaints, fees] = await Promise.all([
      fetchJson("/students"),
      fetchJson("/rooms"),
      fetchJson("/complaints"),
      fetchJson("/fees")
    ]);

    const studentsWithoutRooms = students.filter((s) => !s.roomId).length;
    const studentsWithPendingFees = fees.filter((fee) => fee.status !== "paid").length;
    const availableRooms = rooms.filter((r) => (r.occupants?.length || 0) < r.capacity);
    const totalCapacityAvailable = availableRooms.reduce(
      (sum, room) => sum + (room.capacity - (room.occupants?.length || 0)),
      0
    );
    const pendingComplaints = complaints.filter(
      (c) => c.status === "pending"
    ).length;

    const totalEl = document.getElementById("d_students_total");
    const withoutRoomsEl = document.getElementById("d_students_without_rooms");
    const pendingFeesEl = document.getElementById("d_students_pending_fees");
    const roomsEl = document.getElementById("d_rooms_available");
    const capacityEl = document.getElementById("d_capacity_available");
    const complaintsEl = document.getElementById("d_complaints_pending");
    if (!totalEl || !withoutRoomsEl || !pendingFeesEl || !roomsEl || !capacityEl || !complaintsEl) return;

    totalEl.innerText = students.length;
    withoutRoomsEl.innerText = studentsWithoutRooms;
    pendingFeesEl.innerText = studentsWithPendingFees;
    roomsEl.innerText = availableRooms.length;
    capacityEl.innerText = totalCapacityAvailable;
    complaintsEl.innerText = pendingComplaints;
  } catch (error) {
    alert(error.message || "Unable to load dashboard");
  }
}

// ---------- STUDENTS ----------
function loadStudents() {
  document.getElementById("mainContent").innerHTML = `
    <h1>Students</h1>
    <div class="panel">
      <input id="studentIdInput" placeholder="Student ID"/>
      <input id="name" placeholder="Name"/>
      <input id="department" placeholder="Department"/>
      <input id="year" placeholder="Year"/>
      <input id="phone" placeholder="Phone"/>
      <button onclick="addStudent()">Add</button>
    </div>
    <div class="panel">
      <h3>Filters</h3>
      <div id="filtersContainer"></div>
      <button onclick="addFilterRow()">+ Add Filter</button>
      <div style="margin-top:10px;">
        <select id="sortField">
          <option value="">None</option>
          <option value="studentId">Student ID</option>
          <option value="year">Year</option>
        </select>
        <select id="sortOrder">
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>
        <button onclick="loadStudentsData()">Apply</button>
      </div>
    </div>
    <div class="panel">
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Dept</th><th>Year</th>
            <th>Phone</th><th>Room</th><th>Status</th>
          </tr>
        </thead>
        <tbody id="studentTable"></tbody>
      </table>
    </div>
  `;
  loadStudentsData();
}

function addFilterRow() {
  const container = document.getElementById("filtersContainer");
  const row = document.createElement("div");
  row.innerHTML = `
    <select class="filterField">
      <option value="">Field</option>
      <option value="studentId">Student ID</option>
      <option value="name">Name</option>
      <option value="department">Department</option>
      <option value="year">Year</option>
      <option value="allocation.status">Allocation</option>
    </select>
    <input class="filterValue" placeholder="Value"/>
    <button onclick="this.parentElement.remove()">X</button>
  `;
  container.appendChild(row);
}

async function addStudent() {
  const studentId = document.getElementById("studentIdInput").value.trim();
  const nameVal = document.getElementById("name").value.trim();
  const deptVal = document.getElementById("department").value.trim();
  const yearVal = document.getElementById("year").value.trim();
  const phoneVal = document.getElementById("phone").value.trim();

  if (!studentId || !nameVal || !deptVal || !yearVal || !phoneVal) {
    alert("Fill all fields");
    return;
  }

  try {
    await fetchJson("/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: Number(studentId),
        name: nameVal,
        department: deptVal,
        year: Number(yearVal),
        phone: phoneVal,
        skills: []
      })
    });
    alert("Student added");
    loadStudentsData();
  } catch (error) {
    alert(error.message || "Server error");
  }
}

async function loadStudentsData() {
  const params = new URLSearchParams();
  const fields = document.querySelectorAll(".filterField");
  const values = document.querySelectorAll(".filterValue");

  fields.forEach((field, i) => {
    const value = values[i]?.value?.trim();
    if (field.value && value) {
      params.append(field.value, value);
    }
  });

  const sort = document.getElementById("sortField").value;
  const order = document.getElementById("sortOrder").value;
  if (sort) {
    params.append("sort", sort);
    params.append("order", order);
  }

  try {
    const data = await fetchJson(`/students?${params.toString()}`);
    const table = document.getElementById("studentTable");
    if (!table) return;
    table.innerHTML = "";
    data.forEach((s) => {
      table.innerHTML += `
        <tr>
          <td>${s.studentId}</td>
          <td>${s.name}</td>
          <td>${s.department}</td>
          <td>${s.year}</td>
          <td>${s.phone}</td>
          <td>${s.roomId ? "Assigned" : "Not Assigned"}</td>
          <td>${s.allocation?.status || "-"}</td>
        </tr>`;
    });
  } catch (error) {
    alert(error.message || "Unable to load students");
  }
}

// ---------- STUDENT ACTIONS ----------
async function addComplaintPrompt(studentDbId) {
  const title = prompt("Complaint title:");
  if (!title) return;
  try {
    await fetchJson("/students/complaint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: studentDbId, title: title.trim() })
    });
    alert("Complaint added");
  } catch (error) {
    alert(error.message || "Unable to add complaint");
  }
}

async function deleteStudent() {
  alert("Delete API is not available in backend yet.");
}

async function editStudent() {
  alert("Edit API is not available in backend yet.");
}

// ---------- ROOMS ----------
function loadRooms() {
  document.getElementById("mainContent").innerHTML = `
    <h1>Rooms</h1>
    <div class="panel">
      <h3>Allocate Room</h3>
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <select id="allocateStudentSelect">
          <option value="">Select Pending Student</option>
        </select>
        <select id="allocateRoomSelect">
          <option value="">Select Available Room</option>
        </select>
        <button onclick="allocateRoomToStudent()">Allocate</button>
      </div>
      <small>Only pending students and available rooms are listed.</small>
    </div>
    <div class="panel">
      <label for="roomStatusFilter">Show:</label>
      <select id="roomStatusFilter" onchange="loadRoomsData()">
        <option value="all">All</option>
        <option value="available">Available</option>
        <option value="full">Full</option>
      </select>
      <button onclick="loadRoomsData()">Apply</button>
    </div>
    <div class="panel">
      <table>
        <thead>
          <tr><th>Room</th><th>Block</th><th>Capacity</th><th>Occupied</th><th>Status</th></tr>
        </thead>
        <tbody id="roomTable"></tbody>
      </table>
    </div>
  `;
  loadAllocationOptions();
  loadRoomsData();
}

async function loadAllocationOptions() {
  try {
    const [pendingStudents, availableRooms] = await Promise.all([
      fetchJson("/students?allocation.status=pending"),
      fetchJson("/rooms/available")
    ]);

    const studentSelect = document.getElementById("allocateStudentSelect");
    const roomSelect = document.getElementById("allocateRoomSelect");

    studentSelect.innerHTML = `<option value="">Select Pending Student</option>`;
    pendingStudents.forEach((student) => {
      studentSelect.innerHTML += `
        <option value="${student._id}">
          ${student.studentId} - ${student.name}
        </option>`;
    });

    roomSelect.innerHTML = `<option value="">Select Available Room</option>`;
    availableRooms.forEach((room) => {
      const occupied = room.occupants?.length || 0;
      roomSelect.innerHTML += `
        <option value="${room._id}">
          Room ${room.roomNumber} (${room.hostelBlock}) - ${occupied}/${room.capacity}
        </option>`;
    });
  } catch (error) {
    alert(error.message || "Unable to load allocation options");
  }
}

async function allocateRoomToStudent() {
  const studentId = document.getElementById("allocateStudentSelect").value;
  const roomId = document.getElementById("allocateRoomSelect").value;

  if (!studentId || !roomId) {
    alert("Select both student and room");
    return;
  }

  try {
    await fetchJson("/rooms/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, roomId })
    });
    alert("Room allocated successfully");
    await loadAllocationOptions();
    await loadRoomsData();
  } catch (error) {
    alert(error.message || "Unable to allocate room");
  }
}

async function loadRoomsData() {
  try {
    const selected = document.getElementById("roomStatusFilter")?.value || "all";
    let rooms = [];
    if (selected === "available") {
      rooms = await fetchJson("/rooms/available");
    } else if (selected === "full") {
      rooms = await fetchJson("/rooms/full");
    } else {
      rooms = await fetchJson("/rooms");
    }

    const table = document.getElementById("roomTable");
    if (!table) return;
    table.innerHTML = "";
    rooms.forEach((room) => {
      const occupied = room.occupants?.length || 0;
      const status = occupied >= room.capacity ? "Full" : "Available";
      table.innerHTML += `
        <tr>
          <td>${room.roomNumber}</td>
          <td>${room.hostelBlock}</td>
          <td>${room.capacity}</td>
          <td>${occupied}</td>
          <td>${status}</td>
        </tr>`;
    });
  } catch (error) {
    alert(error.message || "Unable to load rooms");
  }
}

// ---------- COMPLAINTS ----------
function loadComplaints() {
  document.getElementById("mainContent").innerHTML = `
    <h1>Complaints</h1>
    <div class="panel">
      <label for="complaintStatusFilter">Show:</label>
      <select id="complaintStatusFilter" onchange="loadComplaintsData()">
        <option value="all">All</option>
        <option value="pending">Pending</option>
        <option value="resolved">Resolved</option>
      </select>
      <button onclick="loadComplaintsData()">Apply</button>
    </div>
    <div class="panel">
      <table>
        <thead>
          <tr><th>Student ID</th><th>Student</th><th>Title</th><th>Status</th><th>Date</th><th>Action</th></tr>
        </thead>
        <tbody id="complaintTable"></tbody>
      </table>
    </div>
  `;
  loadComplaintsData();
}

async function loadComplaintsData() {
  try {
    const selected = document.getElementById("complaintStatusFilter")?.value || "all";
    const endpoint = selected === "all"
      ? "/complaints"
      : `/complaints?status=${encodeURIComponent(selected)}`;
    const [complaints, students] = await Promise.all([
      fetchJson(endpoint),
      fetchJson("/students")
    ]);
    const studentMap = {};
    students.forEach((s) => {
      studentMap[s._id] = s;
    });
    const table = document.getElementById("complaintTable");
    if (!table) return;
    table.innerHTML = "";
    complaints.forEach((c) => {
      const canResolve = c.status === "pending";
      const student = studentMap[c.studentId];
      table.innerHTML += `
        <tr>
          <td>${student?.studentId || "-"}</td>
          <td>${c.studentName || "-"}</td>
          <td>${c.title || "-"}</td>
          <td>${c.status || "-"}</td>
          <td>${c.date ? new Date(c.date).toLocaleDateString() : "-"}</td>
          <td>
            ${canResolve
              ? `<button onclick="resolveComplaint('${c.studentId}','${c.complaintId}')">Resolve</button>`
              : "-"}
          </td>
        </tr>`;
    });
  } catch (error) {
    alert(error.message || "Unable to load complaints");
  }
}

async function resolveComplaint(studentId, complaintId) {
  if (!studentId || !complaintId) {
    alert("Invalid complaint details");
    return;
  }

  try {
    await fetchJson("/students/complaint/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, complaintId })
    });
    alert("Complaint marked as resolved");
    loadComplaintsData();
  } catch (error) {
    alert(error.message || "Unable to resolve complaint");
  }
}

// ---------- FEES ----------
function loadFees() {
  document.getElementById("mainContent").innerHTML = `
    <h1>Fees</h1>
    <div class="panel">
      <label for="feeStatusFilter">Show:</label>
      <select id="feeStatusFilter" onchange="loadFeesData()">
        <option value="all">All</option>
        <option value="partial">Partial</option>
        <option value="unpaid">Unpaid</option>
        <option value="paid">Paid</option>
      </select>
      <button onclick="loadFeesData()">Apply</button>
    </div>
    <div class="panel">
      <table>
        <thead>
          <tr><th>Student</th><th>Total Fees</th><th>Paid</th><th>Status</th></tr>
        </thead>
        <tbody id="feeTable"></tbody>
      </table>
    </div>
  `;
  loadFeesData();
}

async function loadFeesData() {
  try {
    const selected = document.getElementById("feeStatusFilter")?.value || "all";
    const [fees, students] = await Promise.all([
      fetchJson("/fees"),
      fetchJson("/students")
    ]);
    const studentMap = {};
    students.forEach((student) => {
      studentMap[student._id] = student;
    });

    const table = document.getElementById("feeTable");
    if (!table) return;
    table.innerHTML = "";
    fees.forEach((fee) => {
      if (selected !== "all" && fee.status !== selected) return;
      const totalPaid = (fee.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const student = studentMap[fee.studentId];
      const studentLabel = student
        ? `${student.studentId} - ${student.name}`
        : "Unknown Student";
      table.innerHTML += `
        <tr>
          <td>${studentLabel}</td>
          <td>${fee.totalFees || 0}</td>
          <td>${totalPaid}</td>
          <td>${fee.status || "-"}</td>
        </tr>`;
    });
  } catch (error) {
    alert(error.message || "Unable to load fees");
  }
}

// ---------- STUDENT PANEL ----------
function loadStudentPanel() {
  document.getElementById("mainContent").innerHTML = `
    <h1>Student Panel</h1>
    <div class="panel">
      <input id="studentIdInput" placeholder="Student numeric ID"/>
      <input id="studentNameInput" placeholder="Student name"/>
      <button onclick="loadStudentData()">Load</button>
      <div id="studentData"></div>
    </div>
  `;
}

async function loadStudentData() {
  const studentNumericId = document.getElementById("studentIdInput").value.trim();
  const studentNameInput = document.getElementById("studentNameInput").value.trim();
  if (!studentNumericId || !studentNameInput) {
    alert("Enter both Student ID and Name");
    return;
  }
  try {
    const students = await fetchJson("/students");
    const student = students.find((x) =>
      String(x.studentId) === studentNumericId &&
      String(x.name || "").toLowerCase() === studentNameInput.toLowerCase()
    );
    const target = document.getElementById("studentData");
    if (!student) {
      target.innerHTML = "No student found for the entered ID + Name combination.";
      return;
    }

    const complaints = student.complaints || [];
    const activityLog = student.activityLog || [];
    const skills = student.skills?.length ? student.skills.join(", ") : "-";
    const internship = student.internship?.company
      ? `${student.internship.company} (${student.internship.duration || "duration not set"})`
      : "-";

    target.innerHTML = `
      <h3>Student Details</h3>
      <p><strong>Student ID:</strong> ${student.studentId}</p>
      <p><strong>Name:</strong> ${student.name || "-"}</p>
      <p><strong>Department:</strong> ${student.department || "-"}</p>
      <p><strong>Year:</strong> ${student.year || "-"}</p>
      <p><strong>Phone:</strong> ${student.phone || "-"}</p>
      <p><strong>Skills:</strong> ${skills}</p>
      <p><strong>Internship:</strong> ${internship}</p>
      <p><strong>Room Allocation:</strong> ${student.roomId ? "Assigned" : "Not Assigned"}</p>
      <p><strong>Allocation Status:</strong> ${student.allocation?.status || "not_assigned"}</p>
      <p><strong>Applied At:</strong> ${student.allocation?.appliedAt ? new Date(student.allocation.appliedAt).toLocaleString() : "-"}</p>
      <p><strong>Allocated At:</strong> ${student.allocation?.allocatedAt ? new Date(student.allocation.allocatedAt).toLocaleString() : "-"}</p>
      <p><strong>Created At:</strong> ${student.createdAt ? new Date(student.createdAt).toLocaleString() : "-"}</p>
      <p><strong>Updated At:</strong> ${student.updatedAt ? new Date(student.updatedAt).toLocaleString() : "-"}</p>

      <h3>Complaints</h3>
      ${complaints.length ? `
        <table>
          <thead>
            <tr><th>Title</th><th>Status</th><th>Date</th><th>Resolved At</th></tr>
          </thead>
          <tbody>
            ${complaints.map((c) => `
              <tr>
                <td>${c.title || "-"}</td>
                <td>${c.status || "-"}</td>
                <td>${c.date ? new Date(c.date).toLocaleString() : "-"}</td>
                <td>${c.resolvedAt ? new Date(c.resolvedAt).toLocaleString() : "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : `<p>No complaints found.</p>`}

      <h3>Activity Log (latest at bottom)</h3>
      ${activityLog.length ? `
        <table>
          <thead>
            <tr><th>Type</th><th>Description</th><th>Date</th></tr>
          </thead>
          <tbody>
            ${activityLog.map((log) => `
              <tr>
                <td>${log.type || "-"}</td>
                <td>${log.description || "-"}</td>
                <td>${log.date ? new Date(log.date).toLocaleString() : "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : `<p>No activity log found.</p>`}
    `;
  } catch (error) {
    alert(error.message || "Unable to load student");
  }
}

function loadMyComplaints() {
  document.getElementById("mainContent").innerHTML = `
    <h1>My Complaints</h1>
    <div class="panel">
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <select id="myComplaintSearchType">
          <option value="studentId">Search by Student ID</option>
          <option value="name">Search by Name</option>
        </select>
        <input id="myComplaintSearchValue" placeholder="Enter Student ID or Name"/>
        <button onclick="searchMyComplaintStudent()">Search</button>
      </div>
      <small>Only one student can be selected at a time.</small>
    </div>
    <div class="panel">
      <h3>Search Result (Single Select)</h3>
      <select id="myComplaintStudentSelect" onchange="onMyComplaintStudentChange()" style="min-width:300px;">
        <option value="">Select a student</option>
      </select>
    </div>
    <div class="panel">
      <h3>Add Complaint</h3>
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <input id="myComplaintTitle" placeholder="Complaint title"/>
        <button onclick="addMyComplaint()">Add Complaint</button>
      </div>
    </div>
    <div class="panel">
      <h3>Complaints</h3>
      <table>
        <thead>
          <tr><th>Title</th><th>Status</th><th>Date</th><th>Action</th></tr>
        </thead>
        <tbody id="myComplaintTable">
          <tr><td colspan="4">Select a student to view complaints</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

function loadMyFees() {
  document.getElementById("mainContent").innerHTML = `
    <h1>My Fees</h1>
    <div class="panel">
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <select id="myFeeSearchType">
          <option value="studentId">Search by Student ID</option>
          <option value="name">Search by Name</option>
        </select>
        <input id="myFeeSearchValue" placeholder="Enter Student ID or Name"/>
        <button onclick="searchMyFeeStudent()">Search</button>
      </div>
      <small>Select one student to manage fee details.</small>
    </div>

    <div class="panel">
      <h3>Search Result (Single Select)</h3>
      <select id="myFeeStudentSelect" onchange="loadMyFeeData()" style="min-width:320px;">
        <option value="">Select a student</option>
      </select>
    </div>

    <div class="panel">
      <h3>Fee Summary</h3>
      <div id="myFeeSummary">Select a student to view fee details.</div>
    </div>

    <div class="panel">
      <h3>Pay Fees</h3>
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <input id="myFeePayAmount" type="number" min="1" placeholder="Amount"/>
        <select id="myFeePayMethod">
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
        </select>
        <button onclick="payMyFees()">Pay Now</button>
      </div>
    </div>

    <div class="panel">
      <h3>Payment History</h3>
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:10px;">
        <label for="myFeeMethodFilter">Method:</label>
        <select id="myFeeMethodFilter" onchange="renderMyFeePayments()">
          <option value="all">All</option>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
        </select>

        <label for="myFeeSortField">Sort By:</label>
        <select id="myFeeSortField" onchange="renderMyFeePayments()">
          <option value="date">Date</option>
          <option value="amount">Amount</option>
        </select>

        <select id="myFeeSortOrder" onchange="renderMyFeePayments()">
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>
      <table>
        <thead>
          <tr><th>Date</th><th>Amount</th><th>Method</th></tr>
        </thead>
        <tbody id="myFeePaymentsTable">
          <tr><td colspan="3">No payment history to display</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

let myFeeCurrentPayments = [];

async function searchMyFeeStudent() {
  const searchType = document.getElementById("myFeeSearchType").value;
  const searchValue = document.getElementById("myFeeSearchValue").value.trim();
  const select = document.getElementById("myFeeStudentSelect");

  if (!searchValue) {
    alert("Enter a value to search");
    return;
  }

  try {
    const students = await fetchJson("/students");
    let matches = [];

    if (searchType === "studentId") {
      matches = students.filter((s) => String(s.studentId) === searchValue);
    } else {
      const q = searchValue.toLowerCase();
      matches = students.filter((s) => String(s.name || "").toLowerCase().includes(q));
    }

    select.innerHTML = `<option value="">Select a student</option>`;
    matches.forEach((s) => {
      select.innerHTML += `<option value="${s._id}">${s.studentId} - ${s.name}</option>`;
    });

    if (matches.length === 0) {
      alert("No student found");
      resetMyFeeView();
    } else if (matches.length === 1) {
      select.value = matches[0]._id;
      await loadMyFeeData();
    } else {
      resetMyFeeView();
    }
  } catch (error) {
    alert(error.message || "Unable to search students");
  }
}

function resetMyFeeView() {
  myFeeCurrentPayments = [];
  const summary = document.getElementById("myFeeSummary");
  const paymentsTable = document.getElementById("myFeePaymentsTable");
  if (summary) summary.innerHTML = "Select a student to view fee details.";
  if (paymentsTable) {
    paymentsTable.innerHTML = `<tr><td colspan="3">No payment history to display</td></tr>`;
  }
}

async function loadMyFeeData() {
  const studentDbId = document.getElementById("myFeeStudentSelect").value;
  if (!studentDbId) {
    resetMyFeeView();
    return;
  }

  try {
    const [students, fee] = await Promise.all([
      fetchJson("/students"),
      fetchJson(`/fees/${studentDbId}`)
    ]);
    const student = students.find((s) => s._id === studentDbId);

    const summary = document.getElementById("myFeeSummary");
    if (!summary) return;
    summary.innerHTML = `
      <p><strong>Student:</strong> ${student ? `${student.studentId} - ${student.name}` : "-"}</p>
      <p><strong>Total Fees:</strong> ${fee.totalFees || 0}</p>
      <p><strong>Total Paid:</strong> ${fee.totalPaid || 0}</p>
      <p><strong>Remaining:</strong> ${fee.remainingAmount || 0}</p>
      <p><strong>Status:</strong> ${fee.status || "-"}</p>
    `;

    myFeeCurrentPayments = fee.payments || [];
    renderMyFeePayments();
  } catch (error) {
    myFeeCurrentPayments = [];
    const summary = document.getElementById("myFeeSummary");
    const paymentsTable = document.getElementById("myFeePaymentsTable");
    if (summary) {
      summary.innerHTML = `<p>${error.message || "Fee record not found for this student."}</p>`;
    }
    if (paymentsTable) {
      paymentsTable.innerHTML = `<tr><td colspan="3">No payment history to display</td></tr>`;
    }
  }
}

function renderMyFeePayments() {
  const method = document.getElementById("myFeeMethodFilter")?.value || "all";
  const sortField = document.getElementById("myFeeSortField")?.value || "date";
  const sortOrder = document.getElementById("myFeeSortOrder")?.value || "desc";
  const table = document.getElementById("myFeePaymentsTable");
  if (!table) return;

  let rows = [...myFeeCurrentPayments];
  if (method !== "all") {
    rows = rows.filter((p) => p.method === method);
  }

  rows.sort((a, b) => {
    let left = 0;
    let right = 0;
    if (sortField === "amount") {
      left = a.amount || 0;
      right = b.amount || 0;
    } else {
      left = new Date(a.date || 0).getTime();
      right = new Date(b.date || 0).getTime();
    }
    return sortOrder === "asc" ? left - right : right - left;
  });

  table.innerHTML = "";
  if (!rows.length) {
    table.innerHTML = `<tr><td colspan="3">No payment history to display</td></tr>`;
    return;
  }

  rows.forEach((p) => {
    table.innerHTML += `
      <tr>
        <td>${p.date ? new Date(p.date).toLocaleDateString() : "-"}</td>
        <td>${p.amount || 0}</td>
        <td>${p.method || "-"}</td>
      </tr>`;
  });
}

async function payMyFees() {
  const studentId = document.getElementById("myFeeStudentSelect").value;
  const amount = Number(document.getElementById("myFeePayAmount").value);
  const method = document.getElementById("myFeePayMethod").value;

  if (!studentId) {
    alert("Select one student first");
    return;
  }
  if (!amount || amount <= 0) {
    alert("Enter a valid amount");
    return;
  }

  try {
    await fetchJson("/fees/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, amount, method })
    });
    document.getElementById("myFeePayAmount").value = "";
    alert("Payment recorded successfully");
    await loadMyFeeData();
  } catch (error) {
    alert(error.message || "Unable to process payment");
  }
}

async function searchMyComplaintStudent() {
  const searchType = document.getElementById("myComplaintSearchType").value;
  const searchValue = document.getElementById("myComplaintSearchValue").value.trim();
  const select = document.getElementById("myComplaintStudentSelect");

  if (!searchValue) {
    alert("Enter a value to search");
    return;
  }

  try {
    const students = await fetchJson("/students");
    let matches = [];

    if (searchType === "studentId") {
      matches = students.filter((s) => String(s.studentId) === searchValue);
    } else {
      const q = searchValue.toLowerCase();
      matches = students.filter((s) => String(s.name || "").toLowerCase().includes(q));
    }

    select.innerHTML = `<option value="">Select a student</option>`;
    matches.forEach((s) => {
      select.innerHTML += `<option value="${s._id}">${s.studentId} - ${s.name}</option>`;
    });

    if (matches.length === 0) {
      alert("No student found");
    } else if (matches.length === 1) {
      select.value = matches[0]._id;
      await onMyComplaintStudentChange();
    }
  } catch (error) {
    alert(error.message || "Unable to search students");
  }
}

async function onMyComplaintStudentChange() {
  const studentDbId = document.getElementById("myComplaintStudentSelect").value;
  const table = document.getElementById("myComplaintTable");
  if (!table) return;

  if (!studentDbId) {
    table.innerHTML = `<tr><td colspan="4">Select a student to view complaints</td></tr>`;
    return;
  }

  try {
    const students = await fetchJson("/students");
    const student = students.find((s) => s._id === studentDbId);

    if (!student) {
      table.innerHTML = `<tr><td colspan="4">Student not found</td></tr>`;
      return;
    }

    const complaints = student.complaints || [];
    if (!complaints.length) {
      table.innerHTML = `<tr><td colspan="4">No complaints found</td></tr>`;
      return;
    }

    table.innerHTML = "";
    complaints.forEach((c) => {
      table.innerHTML += `
        <tr>
          <td>${c.title || "-"}</td>
          <td>${c.status || "-"}</td>
          <td>${c.date ? new Date(c.date).toLocaleDateString() : "-"}</td>
          <td><button onclick="deleteMyComplaint('${studentDbId}','${c.complaintId}')">Delete</button></td>
        </tr>`;
    });
  } catch (error) {
    alert(error.message || "Unable to load complaints");
  }
}

async function addMyComplaint() {
  const studentId = document.getElementById("myComplaintStudentSelect").value;
  const title = document.getElementById("myComplaintTitle").value.trim();

  if (!studentId) {
    alert("Select one student first");
    return;
  }
  if (!title) {
    alert("Enter complaint title");
    return;
  }

  try {
    await fetchJson("/students/complaint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, title })
    });
    document.getElementById("myComplaintTitle").value = "";
    alert("Complaint added");
    await onMyComplaintStudentChange();
  } catch (error) {
    alert(error.message || "Unable to add complaint");
  }
}

async function deleteMyComplaint(studentId, complaintId) {
  if (!studentId || !complaintId) {
    alert("Invalid complaint");
    return;
  }
  if (!confirm("Delete this complaint?")) return;

  try {
    await fetchJson("/students/complaint/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, complaintId })
    });
    alert("Complaint deleted");
    await onMyComplaintStudentChange();
  } catch (error) {
    alert(error.message || "Unable to delete complaint");
  }
}

// ---------- DEFAULT ----------
window.onload = loadDashboard;