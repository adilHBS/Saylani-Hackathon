/* ---------- Attendance logic ---------- */
function getOfficeStartMinutes() {
  const c = getCompany() || {};
  const t = c.startTime || '09:00';
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function getGraceMinutes() {
  const c = getCompany() || {};
  return Number(c.graceMinutes || 0);
}
function nowTimeStr() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/* Check in */
function checkIn(employeeId) {
  const today = todayStr();
  const attendance = getAttendance();
  const existing = attendance.find(r =>
    String(r.employeeId) === String(employeeId) && r.date === today
  );
  if (existing) {
    return { ok: false, msg: 'Already checked in today.' };
  }

  const now = nowTimeStr();
  const start = getOfficeStartMinutes();
  const grace = getGraceMinutes();
  const nowMin = timeToMinutes(now);

  let status = 'present';
  if (nowMin > start + grace) status = 'late';

  attendance.push({
    id: Date.now(),
    employeeId: employeeId,
    date: today,
    checkIn: now,
    checkOut: '',
    status: status
  });
  saveAttendance(attendance);
  return { ok: true, msg: `Checked in at ${now} (${status}).` };
}

/* Check out */
function checkOut(employeeId) {
  const today = todayStr();
  const attendance = getAttendance();
  const rec = attendance.find(r =>
    String(r.employeeId) === String(employeeId) && r.date === today
  );
  if (!rec) {
    return { ok: false, msg: 'You must check in first.' };
  }
  if (rec.checkOut) {
    return { ok: false, msg: 'Already checked out today.' };
  }
  const now = nowTimeStr();
  rec.checkOut = now;

  // Recalculate status with half-day rule
  const inMin = timeToMinutes(rec.checkIn);
  const outMin = timeToMinutes(rec.checkOut);
  const hours = (outMin - inMin) / 60;

  if (hours < 5) {
    rec.status = 'halfday';
  } else if (rec.status !== 'late') {
    rec.status = 'present';
  } else {
    rec.status = 'late';
  }

  saveAttendance(attendance);
  return { ok: true, msg: `Checked out at ${now}. Total hours: ${hours.toFixed(1)}.` };
}

/* Compute worked hours */
function hoursWorked(rec) {
  if (!rec.checkIn || !rec.checkOut) return '—';
  const inMin = timeToMinutes(rec.checkIn);
  const outMin = timeToMinutes(rec.checkOut);
  if (outMin <= inMin) return '—';
  const h = (outMin - inMin) / 60;
  return h.toFixed(2) + ' h';
}

/* Status badge renderer */
function statusBadge(status) {
  const map = {
    present: 'badge-present',
    late: 'badge-late',
    halfday: 'badge-halfday',
    absent: 'badge-absent'
  };
  const label = status === 'halfday' ? 'Half Day' : status;
  return `<span class="badge ${map[status] || 'badge-absent'}">${label}</span>`;
}