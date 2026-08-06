"use strict";

const STORAGE_KEYS = {
  USERS: "miniProyectoUsuarios",
  SESSION: "miniProyectoSesion"
};

function generateId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const DEFAULT_USERS = [
  {
    id: generateId(),
    name: "Administrador General",
    email: "admin@demo.com",
    password: "Admin123!",
    role: "administrador",
    active: true
  },
  {
    id: generateId(),
    name: "Usuario de Prueba",
    email: "usuario@demo.com",
    password: "User123!",
    role: "usuario",
    active: true
  }
];

const elements = {
  loginView: document.querySelector("#loginView"),
  dashboardView: document.querySelector("#dashboardView"),
  loginForm: document.querySelector("#loginForm"),
  loginMessage: document.querySelector("#loginMessage"),
  logoutBtn: document.querySelector("#logoutBtn"),
  welcomeTitle: document.querySelector("#welcomeTitle"),
  sessionInfo: document.querySelector("#sessionInfo"),
  roleBadge: document.querySelector("#roleBadge"),
  adminPanel: document.querySelector("#adminPanel"),
  userPanel: document.querySelector("#userPanel"),
  userForm: document.querySelector("#userForm"),
  userFormMessage: document.querySelector("#userFormMessage"),
  usersTableBody: document.querySelector("#usersTableBody"),
  totalUsers: document.querySelector("#totalUsers"),
  totalAdmins: document.querySelector("#totalAdmins"),
  totalActive: document.querySelector("#totalActive"),
  profileInitials: document.querySelector("#profileInitials"),
  profileName: document.querySelector("#profileName"),
  profileEmail: document.querySelector("#profileEmail"),
  resetBtn: document.querySelector("#resetBtn")
};

function initializeData() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    saveUsers(DEFAULT_USERS);
  }
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION));
  } catch {
    return null;
  }
}

function saveSession(user) {
  const safeSession = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(safeSession));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function showMessage(target, text, type = "error") {
  target.textContent = text;
  target.className = `message ${type}`;
}

function clearMessage(target) {
  target.textContent = "";
  target.className = "message";
}

function handleLogin(event) {
  event.preventDefault();
  clearMessage(elements.loginMessage);

  const email = normalizeEmail(elements.loginForm.email.value);
  const password = elements.loginForm.password.value;

  if (!email || !password) {
    showMessage(elements.loginMessage, "Completa el correo y la contraseña.");
    return;
  }

  const user = getUsers().find(item => item.email === email && item.password === password);

  if (!user) {
    showMessage(elements.loginMessage, "Credenciales incorrectas.");
    return;
  }

  if (!user.active) {
    showMessage(elements.loginMessage, "La cuenta está inactiva. Contacta a un administrador.");
    return;
  }

  saveSession(user);
  elements.loginForm.reset();
  renderApplication();
}

function handleLogout() {
  clearSession();
  renderApplication();
}

function handleCreateUser(event) {
  event.preventDefault();
  clearMessage(elements.userFormMessage);

  const name = elements.userForm.newName.value.trim();
  const email = normalizeEmail(elements.userForm.newEmail.value);
  const password = elements.userForm.newPassword.value;
  const role = elements.userForm.newRole.value;

  if (!name || !email || !password || !role) {
    showMessage(elements.userFormMessage, "Completa todos los campos.");
    return;
  }

  if (password.length < 6) {
    showMessage(elements.userFormMessage, "La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  const users = getUsers();
  const emailExists = users.some(user => user.email === email);

  if (emailExists) {
    showMessage(elements.userFormMessage, "Ya existe una cuenta con ese correo.");
    return;
  }

  users.push({
    id: generateId(),
    name,
    email,
    password,
    role,
    active: true
  });

  saveUsers(users);
  elements.userForm.reset();
  showMessage(elements.userFormMessage, "Usuario registrado correctamente.", "success");
  renderAdminPanel();
}

function toggleUserStatus(userId) {
  const session = getSession();
  const users = getUsers();
  const index = users.findIndex(user => user.id === userId);

  if (index === -1) return;

  if (session && session.id === userId) {
    alert("No puedes desactivar tu propia cuenta durante la sesión.");
    return;
  }

  users[index].active = !users[index].active;
  saveUsers(users);
  renderAdminPanel();
}

function deleteUser(userId) {
  const session = getSession();

  if (session && session.id === userId) {
    alert("No puedes eliminar tu propia cuenta durante la sesión.");
    return;
  }

  const confirmed = confirm("¿Deseas eliminar este usuario?");
  if (!confirmed) return;

  const users = getUsers().filter(user => user.id !== userId);
  saveUsers(users);
  renderAdminPanel();
}

function resetDemo() {
  const confirmed = confirm("Esto eliminará los usuarios creados y restaurará las cuentas de demostración. ¿Continuar?");
  if (!confirmed) return;

  const renewedDefaults = DEFAULT_USERS.map(user => ({ ...user, id: generateId() }));
  saveUsers(renewedDefaults);
  clearSession();
  renderApplication();
}

function renderAdminPanel() {
  const users = getUsers();
  const session = getSession();

  elements.usersTableBody.innerHTML = "";

  users.forEach(user => {
    const row = document.createElement("tr");
    const roleLabel = user.role === "administrador" ? "Administrador" : "Usuario";
    const statusClass = user.active ? "status-active" : "status-inactive";
    const statusLabel = user.active ? "Activo" : "Inactivo";
    const ownAccount = session && session.id === user.id;

    row.innerHTML = `
      <td>${escapeHtml(user.name)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${roleLabel}</td>
      <td class="${statusClass}">${statusLabel}</td>
      <td>
        <div class="actions">
          <button class="button button-secondary button-small" data-action="toggle" data-id="${user.id}" ${ownAccount ? "disabled" : ""}>
            ${user.active ? "Desactivar" : "Activar"}
          </button>
          <button class="button button-danger button-small" data-action="delete" data-id="${user.id}" ${ownAccount ? "disabled" : ""}>
            Eliminar
          </button>
        </div>
      </td>
    `;

    elements.usersTableBody.appendChild(row);
  });

  elements.totalUsers.textContent = users.length;
  elements.totalAdmins.textContent = users.filter(user => user.role === "administrador").length;
  elements.totalActive.textContent = users.filter(user => user.active).length;
}

function renderUserPanel(session) {
  const initials = session.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join("");

  elements.profileInitials.textContent = initials || "US";
  elements.profileName.textContent = session.name;
  elements.profileEmail.textContent = session.email;
}

function renderApplication() {
  const session = getSession();

  if (!session) {
    elements.loginView.classList.remove("hidden");
    elements.dashboardView.classList.add("hidden");
    elements.logoutBtn.classList.add("hidden");
    elements.adminPanel.classList.add("hidden");
    elements.userPanel.classList.add("hidden");
    return;
  }

  const activeUser = getUsers().find(user => user.id === session.id && user.active);
  if (!activeUser) {
    clearSession();
    renderApplication();
    return;
  }

  elements.loginView.classList.add("hidden");
  elements.dashboardView.classList.remove("hidden");
  elements.logoutBtn.classList.remove("hidden");
  elements.welcomeTitle.textContent = `Bienvenido, ${session.name}`;
  elements.sessionInfo.textContent = session.email;
  elements.roleBadge.textContent = session.role;

  if (session.role === "administrador") {
    elements.adminPanel.classList.remove("hidden");
    elements.userPanel.classList.add("hidden");
    renderAdminPanel();
  } else {
    elements.adminPanel.classList.add("hidden");
    elements.userPanel.classList.remove("hidden");
    renderUserPanel(session);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

elements.loginForm.addEventListener("submit", handleLogin);
elements.logoutBtn.addEventListener("click", handleLogout);
elements.userForm.addEventListener("submit", handleCreateUser);
elements.resetBtn.addEventListener("click", resetDemo);

elements.usersTableBody.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button || button.disabled) return;

  const { action, id } = button.dataset;
  if (action === "toggle") toggleUserStatus(id);
  if (action === "delete") deleteUser(id);
});

initializeData();
renderApplication();
