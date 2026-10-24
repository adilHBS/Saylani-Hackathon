/* ---------- Auth logic ---------- */
function login(email, password) {
  const user = getUserByEmail(email);
  if (!user) return null;
  if (user.password !== password) return null;
  saveSession({ userId: user.id, role: user.role, loginAt: Date.now() });
  return user;
}

function logout() {
  clearSession();
  const inPages = window.location.pathname.includes('/pages/');
  window.location.href = inPages ? '../index.html' : 'index.html';
}

/* Require a session; redirect if none. Optionally require role. */
function requireAuth(requiredRole) {
  const session = getSession();
  if (!session) {
    redirectToLogin();
    return null;
  }
  const user = getUserById(session.userId);
  if (!user) {
    clearSession();
    redirectToLogin();
    return null;
  }
  if (requiredRole && user.role !== requiredRole) {
    redirectToDashboard(user);
    return null;
  }
  return user;
}

function redirectToLogin() {
  const inPages = window.location.pathname.includes('/pages/');
  window.location.href = inPages ? '../index.html' : 'index.html';
}

function redirectToDashboard(user) {
  const inPages = window.location.pathname.includes('/pages/');
  const prefix = inPages ? '' : 'pages/';
  if (user.role === 'admin') {
    window.location.href = prefix + 'admin.html';
  } else {
    window.location.href = prefix + 'employee.html';
  }
}

/* Render the top nav bar based on role */
function renderNav(active) {
  const session = getSession();
  if (!session) return '';
  const user = getUserById(session.userId);
  if (!user) return '';

  let links = '';
  if (user.role === 'admin') {
    links = `
      <a href="admin.html" class="${active === 'admin' ? 'active' : ''}">Dashboard</a>
      <a href="employees.html" class="${active === 'employees' ? 'active' : ''}">Employees</a>
      <a href="leaves.html" class="${active === 'leaves' ? 'active' : ''}">Leaves</a>
      <a href="settings.html" class="${active === 'settings' ? 'active' : ''}">Settings</a>
      <a href="payslip.html" class="${active === 'payslip' ? 'active' : ''}">Payslips</a>
    `;
  } else {
    links = `
      <a href="employee.html" class="${active === 'employee' ? 'active' : ''}">My Dashboard</a>
      <a href="payslip.html" class="${active === 'payslip' ? 'active' : ''}">My Payslip</a>
    `;
  }

  return `
    <header class="app-header">
      <h1>HCM Lite</h1>
      <div class="user-info">
        ${escapeHtml(user.name)} (${user.role}) &nbsp;|&nbsp;
        <a href="#" id="logoutLink" style="color:#fff;text-decoration:underline;">Logout</a>
      </div>
    </header>
    <nav class="nav">${links}</nav>
  `;
}

function bindLogout() {
  const link = document.getElementById('logoutLink');
  if (link) link.addEventListener('click', function (e) {
    e.preventDefault();
    logout();
  });
}