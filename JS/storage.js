/* ---------- Generic localStorage helpers ---------- */
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error('Storage read error for', key, e);
    return fallback;
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- Company ---------- */
function getCompany() { return read('hcm_company', null); }
function saveCompany(company) { write('hcm_company', company); }

/* ---------- Users ---------- */
function getUsers() { return read('hcm_users', []); }
function saveUsers(users) { write('hcm_users', users); }

function getUserById(id) {
  return getUsers().find(u => String(u.id) === String(id));
}
function getUserByEmail(email) {
  return getUsers().find(u => u.email === String(email).toLowerCase());
}

/* ---------- Attendance ---------- */
function getAttendance() { return read('hcm_attendance', []); }
function saveAttendance(records) { write('hcm_attendance', records); }

/* ---------- Leaves ---------- */
function getLeaves() { return read('hcm_leaves', []); }
function saveLeaves(leaves) { write('hcm_leaves', leaves); }

/* ---------- Session ---------- */
function getSession() { return read('hcm_session', null); }
function saveSession(session) { write('hcm_session', session); }
function clearSession() { localStorage.removeItem('hcm_session'); }

/* ---------- Date helpers ---------- */
function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
function isWeekend(dateStr, workingDays) {
  const day = new Date(dateStr + 'T00:00:00').getDay(); // 0=Sun
  if (workingDays && Array.isArray(workingDays)) {
    return !workingDays.includes(day);
  }
  return day === 0 || day === 6;
}

/* ---------- Validation helpers ---------- */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}
function clearErrors(ids) {
  ids.forEach(id => setError(id, ''));
}

/* ---------- Misc ---------- */
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}