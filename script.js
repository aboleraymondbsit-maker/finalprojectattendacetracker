const USERS_KEY = "bsit_time_users_v1";
const RECORDS_KEY = "bsit_time_records_v1";

let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
let records = JSON.parse(localStorage.getItem(RECORDS_KEY)) || [];
let currentUser = JSON.parse(sessionStorage.getItem("bsitCurrentUser")) || null;

const $ = id => document.getElementById(id);

function saveUsers() {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveRecords() {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

function showMessage(id, message, color = "red") {
  $(id).textContent = message;
  $(id).style.color = color;
}

function showLogin() {
  $("loginForm").classList.remove("hidden");
  $("registerForm").classList.add("hidden");
  $("loginTab").classList.add("active");
  $("registerTab").classList.remove("active");
  showMessage("authMessage", "");
}

function showRegister() {
  $("registerForm").classList.remove("hidden");
  $("loginForm").classList.add("hidden");
  $("registerTab").classList.add("active");
  $("loginTab").classList.remove("active");
  showMessage("authMessage", "");
}

// REGISTER
$("registerForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const name = $("regName").value.trim();
  const email = $("regEmail").value.trim().toLowerCase();
  const password = $("regPassword").value;
  const year = $("regYear").value;

  if (users.some(user => user.email === email)) {
    return showMessage("authMessage", "Email is already registered.");
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
    course: "BSIT",
    year
  };

  users.push(newUser);
  saveUsers();

  $("registerForm").reset();
  showMessage("authMessage", "Account created! You can now login.", "green");
  showLogin();
});

// LOGIN
$("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const email = $("loginEmail").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  const user = users.find(u =>
    u.email === email && u.password === password
  );

  if (!user) {
    return showMessage("authMessage", "Incorrect email or password.");
  }

  currentUser = user;
  sessionStorage.setItem("bsitCurrentUser", JSON.stringify(user));
  $("loginForm").reset();
  showDashboard();
});

// LOGOUT
function logout() {
  currentUser = null;
  sessionStorage.removeItem("bsitCurrentUser");
  $("dashboard").classList.add("hidden");
  $("authSection").classList.remove("hidden");
  showLogin();
}

// DASHBOARD
function showDashboard() {
  if (!currentUser) return;

  $("authSection").classList.add("hidden");
  $("dashboard").classList.remove("hidden");

  $("studentName").textContent = currentUser.name;
  $("profileName").textContent = currentUser.name;
  $("profileYear").textContent = currentUser.year;

  $("attendanceDate").value = getLocalDate();
  renderDashboard();
}

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMyRecords() {
  return records.filter(r => r.userId === currentUser.id);
}

function formatTime(value) {
  if (!value) return "--";

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function calculateHours(record) {
  if (!record.timeInAt || !record.timeOutAt) return 0;

  const milliseconds =
    new Date(record.timeOutAt) - new Date(record.timeInAt);

  return Math.max(0, milliseconds / 3600000);
}

// TIME IN
$("attendanceForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const date = $("attendanceDate").value;
  const subject = $("subject").value.trim();

  if (!date || !subject) {
    return showMessage("attendanceMessage", "Please complete all fields.");
  }

  const existingOpen = getMyRecords().some(r =>
    r.date === date &&
    r.subject.toLowerCase() === subject.toLowerCase() &&
    !r.timeOutAt
  );

  if (existingOpen) {
    return showMessage(
      "attendanceMessage",
      "May active Time In ka na para sa subject na ito."
    );
  }

  const now = new Date();

  const newRecord = {
    id: Date.now().toString(),
    userId: currentUser.id,
    date,
    subject,
    timeInAt: now.toISOString(),
    timeOutAt: null
  };

  records.push(newRecord);
  saveRecords();

  $("subject").value = "";

  showMessage("attendanceMessage", "Time In recorded successfully!", "green");
  renderDashboard();
});


// TIME IN
$("attendanceForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const date = $("attendanceDate").value;
  const subject = $("subject").value.trim();

  if (!date || !subject) {
    alert("Please enter date and subject.");
    return;
  }

  const existingOpen = records.some(r =>
    r.userId === currentUser.id &&
    r.date === date &&
    r.subject.toLowerCase() === subject.toLowerCase() &&
    !r.timeOutAt
  );

  if (existingOpen) {
    alert("May active Time In ka na para sa subject na ito.");
    return;
  }

  const now = new Date();

  const newRecord = {
    id: Date.now().toString(),
    userId: currentUser.id,
    date: date,
    subject: subject,
    timeInAt: now.toISOString(),
    timeOutAt: null
  };

  records.push(newRecord);

  // Save to localStorage
  localStorage.setItem(
    "bsit_time_records_v1",
    JSON.stringify(records)
  );

  // Verify saved data
  const savedRecords = JSON.parse(
    localStorage.getItem("bsit_time_records_v1")
  ) || [];

  console.log("Saved attendance:", savedRecords);

  $("subject").value = "";

  showMessage(
    "attendanceMessage",
    "Time In successful! Subject saved.",
    "green"
  );

  renderDashboard();
});


// DELETE
function deleteRecord(id) {
  if (!confirm("Delete this attendance record?")) return;

  records = records.filter(r =>
    !(r.id === id && r.userId === currentUser.id)
  );

  saveRecords();
  renderDashboard();
}

// DASHBOARD AND HISTORY
function renderDashboard() {
  const myRecords = getMyRecords();

  const completed = myRecords.filter(r => r.timeOutAt);
  const active = myRecords.filter(r => !r.timeOutAt);

  const totalHours = completed.reduce(
    (sum, r) => sum + calculateHours(r), 0
  );

  $("totalRecords").textContent = myRecords.length;
  $("presentCount").textContent = myRecords.length;
  $("activeCount").textContent = active.length;
  $("totalHours").textContent = totalHours.toFixed(2);

  renderTable();
}

function renderTable() {
  const search = $("searchInput").value.toLowerCase();
  const month = $("monthFilter").value;

  const filtered = getMyRecords()
    .filter(r => r.subject.toLowerCase().includes(search))
    .filter(r => !month || r.date.startsWith(month))
    .sort((a, b) => b.timeInAt.localeCompare(a.timeInAt));

  const tbody = $("attendanceTable");
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center">
          No attendance records found.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(record => {
    const hours = calculateHours(record);
    const status = record.timeOutAt
      ? `<span class="status-done">Completed</span>`
      : `<span class="status-open">In Class</span>`;

    const action = record.timeOutAt
      ? status
      : `<button class="action-btn timeout-btn"
          onclick="timeOutRecord('${record.id}')">Time Out</button>`;

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHTML(record.date)}</td>
      <td>${escapeHTML(record.subject)}</td>
      <td>${formatTime(record.timeInAt)}</td>
      <td>${formatTime(record.timeOutAt)}</td>
      <td>${record.timeOutAt ? hours.toFixed(2) + " hrs" : "--"}</td>
      <td>
        ${action}
        <button class="action-btn delete-btn"
          onclick="deleteRecord('${record.id}')">Delete</button>
      </td>
    `;

    tbody.appendChild(row);
  });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

// SEARCH AND FILTER
$("searchInput").addEventListener("input", renderTable);
$("monthFilter").addEventListener("change", renderTable);

// CSV EXPORT
function exportCSV() {
  const myRecords = getMyRecords();

  if (myRecords.length === 0) {
    alert("No attendance records to export.");
    return;
  }

  const rows = [
    ["Date", "Student", "Course", "Year Level", "Subject",
      "Time In", "Time Out", "Total Hours"]
  ];

  myRecords.forEach(r => {
    rows.push([
      r.date,
      currentUser.name,
      currentUser.course,
      currentUser.year,
      r.subject,
      formatTime(r.timeInAt),
      formatTime(r.timeOutAt),
      r.timeOutAt ? calculateHours(r).toFixed(2) : "Not completed"
    ]);
  });

  const csv = rows.map(row =>
    row.map(value =>
      `"${String(value).replace(/"/g, '""')}"`
    ).join(",")
  ).join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "BSIT_Attendance_Report.csv";
  link.click();

  URL.revokeObjectURL(url);
}

// AUTO LOGIN IF SESSION EXISTS
if (currentUser) {
  const validUser = users.find(u => u.id === currentUser.id);

  if (validUser) {
    currentUser = validUser;
    showDashboard();
  } else {
    currentUser = null;
    sessionStorage.removeItem("bsitCurrentUser");
  }
}
