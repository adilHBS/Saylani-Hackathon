/* ---------- Leave helpers ---------- */
function countWorkingDays(from, to, workingDays) {
  if (!from || !to) return 0;
  const start = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  if (start > end) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (!isWeekend(dateToStr(cur), workingDays)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function dateToStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function rangesOverlap(aFrom, aTo, bFrom, bTo) {
  return !(aTo < bFrom || aFrom > bTo); // string compare works for YYYY-MM-DD
}

function getEmployeeApprovedLeaveDays(employeeId) {
  const leaves = getLeaves().filter(l =>
    String(l.employeeId) === String(employeeId) && l.status === 'approved'
  );
  return leaves.reduce((sum, l) => sum + Number(l.days || 0), 0);
}

function getEmployeeLeaveBalance(employeeId) {
  const company = getCompany();
  const quota = company ? Number(company.leaveQuota || 0) : 0;
  const used = getEmployeeApprovedLeaveDays(employeeId);
  return quota - used;
}

function canApplyLeave(employeeId, from, to, type) {
  const company = getCompany() || {};
  const workingDays = company.workingDays || [1,2,3,4,5];

  if (!from || !to) return { ok: false, msg: 'Both dates are required.' };
  if (from > to) return { ok: false, msg: 'From date must be on or before To date.' };

  const days = countWorkingDays(from, to, workingDays);
  if (days <= 0) return { ok: false, msg: 'The selected range contains only weekends/holidays.' };

  // Overlap check
  const existing = getLeaves().filter(l =>
    String(l.employeeId) === String(employeeId) && l.status !== 'rejected'
  );
  for (const l of existing) {
    if (rangesOverlap(from, to, l.from, l.to)) {
      return { ok: false, msg: 'This overlaps with an existing leave request (' + l.from + ' to ' + l.to + ').' };
    }
  }

  const balance = getEmployeeLeaveBalance(employeeId);
  if (days > balance) {
    return { ok: false, msg: `Not enough leave balance. Requested ${days} day(s), available ${balance}.` };
  }

  return { ok: true, days: days, msg: '' };
}

function leaveStatusBadge(status) {
  const cls = status === 'approved' ? 'badge-approved'
            : status === 'rejected' ? 'badge-rejected'
            : 'badge-pending';
  return `<span class="badge ${cls}">${status}</span>`;
}