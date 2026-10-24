/* ---------- Smart Helper Chat ---------- */
function initHelper(role, currentUser) {
  const toggle = document.getElementById('helperToggle');
  const box = document.getElementById('helperBox');
  const messages = document.getElementById('helperMessages');
  const input = document.getElementById('helperInput');
  const sendBtn = document.getElementById('helperSend');

  if (!toggle || !box) return;

  toggle.addEventListener('click', () => {
    box.classList.toggle('hidden');
    if (!box.classList.contains('hidden') && messages.children.length === 0) {
      addMsg('bot', 'Hi! Ask me about ' + (role === 'admin'
        ? 'employees, leaves, or attendance.'
        : 'your leaves, hours, or attendance.'));
    }
  });

  function addMsg(type, text) {
    const div = document.createElement('div');
    div.className = 'helper-msg ' + type;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function send() {
    const q = input.value.trim();
    if (!q) return;
    addMsg('user', q);
    input.value = '';
    const answer = answerQuestion(q, role, currentUser);
    setTimeout(() => addMsg('bot', answer), 250);
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') send();
  });
}

function answerQuestion(question, role, user) {
  const q = question.toLowerCase();

  if (role === 'admin') {
    /* --- Admin questions --- */
    if (q.includes('how many employees') || (q.includes('employee') && q.includes('count'))) {
      const count = getUsers().filter(u => u.role === 'employee').length;
      return `There are currently ${count} employee(s) in the company.`;
    }

    if (q.includes('department')) {
      const emps = getUsers().filter(u => u.role === 'employee');
      const map = {};
      emps.forEach(e => { map[e.department] = (map[e.department] || 0) + 1; });
      const list = Object.entries(map).map(([d, c]) => `${d}: ${c}`).join(', ');
      return list ? `Departments:\n${list}` : 'No employees yet.';
    }

    if (q.includes('on leave today') || (q.includes('who') && q.includes('leave') && q.includes('today'))) {
      const today = todayStr();
      const leaves = getLeaves().filter(l =>
        l.status === 'approved' && l.from <= today && l.to >= today
      );
      if (leaves.length === 0) return 'No one is on approved leave today.';
      const names = leaves.map(l => {
        const emp = getUserById(l.employeeId);
        return emp ? emp.name : 'Unknown';
      });
      return `On leave today: ${names.join(', ')}.`;
    }

    if (q.includes('late') && (q.includes('today') || q.includes('who'))) {
      const today = todayStr();
      const late = getAttendance().filter(r => r.date === today && r.status === 'late');
      if (late.length === 0) return 'No one is marked late today.';
      const names = late.map(r => {
        const emp = getUserById(r.employeeId);
        return emp ? emp.name : 'Unknown';
      });
      return `Late today: ${names.join(', ')}.`;
    }

    if (q.includes('pending leave') || (q.includes('leave') && q.includes('pending'))) {
      const count = getLeaves().filter(l => l.status === 'pending').length;
      return `There are ${count} pending leave request(s).`;
    }

    if (q.includes('payroll') || q.includes('salary total') || q.includes('total salary')) {
      const total = getUsers()
        .filter(u => u.role === 'employee')
        .reduce((s, u) => s + Number(u.salary || 0), 0);
      return `Total monthly payroll: Rs. ${total.toLocaleString()}.`;
    }

    if (q.includes('present today') || (q.includes('how many') && q.includes('present'))) {
      const today = todayStr();
      const present = getAttendance().filter(r =>
        r.date === today && (r.status === 'present' || r.status === 'late' || r.status === 'halfday')
      ).length;
      return `${present} employee(s) have checked in today.`;
    }
  } else {
    /* --- Employee questions --- */
    if (q.includes('leave') && (q.includes('left') || q.includes('balance') || q.includes('remaining') || q.includes('how many'))) {
      const balance = getEmployeeLeaveBalance(user.id);
      const company = getCompany() || {};
      return `You have ${balance} leave day(s) remaining out of ${company.leaveQuota || 0}.`;
    }

    if (q.includes('late today') || (q.includes('was i late'))) {
      const today = todayStr();
      const rec = getAttendance().find(r =>
        String(r.employeeId) === String(user.id) && r.date === today
      );
      if (!rec) return "You haven't checked in today yet.";
      if (rec.status === 'late') return `Yes, you were marked late today (checked in at ${rec.checkIn}).`;
      if (rec.status === 'present') return `No, you were on time today (checked in at ${rec.checkIn}).`;
      if (rec.status === 'halfday') return `You were marked half-day today (checked out early).`;
      return `Today's status: ${rec.status}.`;
    }

    if (q.includes('hours') && (q.includes('week') || q.includes('this week'))) {
      const att = getAttendance().filter(r => String(r.employeeId) === String(user.id));
      const today = new Date();
      let total = 0;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6);
      att.forEach(r => {
        if (!r.checkIn || !r.checkOut) return;
        const recDate = new Date(r.date + 'T00:00:00');
        if (recDate >= weekStart && recDate <= today) {
          const [ih, im] = r.checkIn.split(':').map(Number);
          const [oh, om] = r.checkOut.split(':').map(Number);
          const diff = (oh * 60 + om) - (ih * 60 + im);
          if (diff > 0) total += diff;
        }
      });
      const hours = (total / 60).toFixed(1);
      return `You've worked ${hours} hour(s) in the last 7 days.`;
    }

    if (q.includes('hours today') || (q.includes('how long') && q.includes('today'))) {
      const today = todayStr();
      const rec = getAttendance().find(r =>
        String(r.employeeId) === String(user.id) && r.date === today
      );
      if (!rec || !rec.checkIn) return "You haven't checked in today.";
      if (!rec.checkOut) return `You checked in at ${rec.checkIn} and haven't checked out yet.`;
      return `Today you worked ${hoursWorked(rec)} (${rec.checkIn} – ${rec.checkOut}).`;
    }

    if (q.includes('attendance') && (q.includes('this month') || q.includes('month'))) {
      const now = new Date();
      const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const att = getAttendance().filter(r =>
        String(r.employeeId) === String(user.id) && r.date.startsWith(prefix)
      );
      const present = att.filter(r => r.status === 'present' || r.status === 'late').length;
      const half = att.filter(r => r.status === 'halfday').length;
      return `This month: ${present} full day(s) and ${half} half day(s) recorded.`;
    }

    if (q.includes('salary') || q.includes('pay') || q.includes('payslip')) {
      return `Your monthly salary is Rs. ${Number(user.salary).toLocaleString()}. Check the Payslip page for detailed breakdown.`;
    }

    if (q.includes('my name') || q.includes('who am i')) {
      return `You are ${user.name}, ${user.department}, role: ${user.role}.`;
    }

    if (q.includes('leave') && q.includes('status')) {
      const leaves = getLeaves().filter(l => String(l.employeeId) === String(user.id));
      const pending = leaves.filter(l => l.status === 'pending').length;
      const approved = leaves.filter(l => l.status === 'approved').length;
      const rejected = leaves.filter(l => l.status === 'rejected').length;
      return `Your leaves: ${pending} pending, ${approved} approved, ${rejected} rejected.`;
    }
  }

  return "I'm not sure how to answer that. Try asking about: " +
    (role === 'admin'
      ? 'employees count, who is late today, who is on leave today, pending leaves.'
      : 'leave balance, was I late today, hours this week, my attendance.');
}