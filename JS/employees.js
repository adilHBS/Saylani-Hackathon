/* ---------- Employee CRUD ---------- */
function getEmployees() {
  return getUsers().filter(u => u.role === 'employee');
}

function addEmployee({ name, email, password, department, salary }) {
  const users = getUsers();
  users.push({
    id: Date.now(),
    name: name,
    email: email.toLowerCase(),
    password: password,
    role: 'employee',
    department: department,
    salary: Number(salary)
  });
  saveUsers(users);
}

function updateEmployee(id, { name, email, department, salary, password }) {
  const users = getUsers();
  const u = users.find(x => String(x.id) === String(id));
  if (!u) return;
  u.name = name;
  u.email = email.toLowerCase();
  u.department = department;
  u.salary = Number(salary);
  if (password) u.password = password;
  saveUsers(users);
}

function deleteEmployee(id) {
  const users = getUsers().filter(u => String(u.id) !== String(id));
  saveUsers(users);
}