'use strict';

const UsuariosApp = (() => {
  const state = { users: [], applications: [], filtered: [] };
  const el = id => document.getElementById(id);

  const init = () => {
    const session = AppCore.initShell('usuarios');
    if (!session) return;
    bindEvents();
    load();
  };

  const load = () => {
    state.users = AppCore.read(AppCore.KEYS.users, []);
    state.applications = AppCore.read(AppCore.KEYS.supplierApplications, []);
    applyFilters();
    renderApplications();
    renderStats();
  };

  const applyFilters = () => {
    const term = AppCore.normalize(el('user-search')?.value);
    const role = el('role-filter')?.value || '';
    const status = el('user-status-filter')?.value || '';
    state.filtered = state.users.filter(user => {
      const text = [user.name, user.email, user.phone, user.identification, AppCore.roleLabel(user.role)].join(' ').toLowerCase();
      const matchesTerm = !term || text.includes(term);
      const matchesRole = !role || user.role === role;
      const matchesStatus = !status || (status === 'active' ? user.active !== false : user.active === false);
      return matchesTerm && matchesRole && matchesStatus;
    }).sort((a, b) => String(a.name).localeCompare(String(b.name), 'es'));
    renderUsers();
  };

  const renderStats = () => {
    const pending = state.applications.filter(item => item.status === 'Pendiente').length;
    el('stat-users').textContent = state.users.length;
    el('stat-clients').textContent = state.users.filter(item => item.role === 'cliente').length;
    el('stat-admins').textContent = state.users.filter(item => item.role === 'administrador').length;
    el('stat-pending').textContent = pending;
    el('pending-pill').textContent = `${pending} pendiente${pending === 1 ? '' : 's'}`;
  };

  const renderUsers = () => {
    const body = el('users-table-body');
    body.innerHTML = state.filtered.map(user => `
      <tr>
        <td><span class="table-primary">${AppCore.escapeHtml(user.name)}</span><span class="table-secondary">${AppCore.escapeHtml(user.email)}</span></td>
        <td>${AppCore.escapeHtml(user.identification || 'No registrada')}</td>
        <td><span class="badge badge-info">${AppCore.escapeHtml(AppCore.roleLabel(user.role))}</span></td>
        <td>${AppCore.escapeHtml(user.phone || 'No registrado')}</td>
        <td><span class="badge badge-${user.active === false ? 'inactivo' : 'activo'}">${user.active === false ? 'Inactivo' : 'Activo'}</span></td>
        <td>${AppCore.formatDate(user.createdAt)}</td>
        <td><div class="actions">
          <button class="button button-ghost button-small" type="button" data-user-action="view" data-id="${user.id}">${AppCore.icon('eye')}<span>Ver</span></button>
          <button class="button button-secondary button-small" type="button" data-user-action="edit" data-id="${user.id}">${AppCore.icon('edit')}<span>Editar</span></button>
          <button class="button button-danger button-small" type="button" data-user-action="delete" data-id="${user.id}" ${user.id === AppCore.getSession()?.id ? 'disabled title="No puede eliminar su propia sesión"' : ''}>${AppCore.icon('trash')}<span>Eliminar</span></button>
        </div></td>
      </tr>`).join('');
    el('user-summary').textContent = `${state.filtered.length} de ${state.users.length} registros`;
    el('users-empty').classList.toggle('hidden', state.filtered.length > 0);
    body.closest('.table-wrap').classList.toggle('hidden', state.filtered.length === 0);
  };

  const renderApplications = () => {
    const body = el('applications-table-body');
    const sorted = [...state.applications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    body.innerHTML = sorted.map(application => {
      const pending = application.status === 'Pendiente';
      const badgeClass = pending ? 'low' : application.status === 'Aprobada' ? 'activo' : 'inactivo';
      return `<tr>
        <td><span class="table-primary">${AppCore.escapeHtml(application.company)}</span><span class="table-secondary">${AppCore.escapeHtml(application.legalId)}</span></td>
        <td><span class="table-primary">${AppCore.escapeHtml(application.contact)}</span><span class="table-secondary">${AppCore.escapeHtml(application.email)}</span></td>
        <td>${AppCore.escapeHtml(application.category)}</td>
        <td>${AppCore.escapeHtml(application.province)}</td>
        <td><span class="badge badge-${badgeClass}">${AppCore.escapeHtml(application.status)}</span></td>
        <td>${AppCore.formatDate(application.createdAt)}</td>
        <td><div class="actions">
          <button class="button button-ghost button-small" type="button" data-application-action="view" data-id="${application.id}">${AppCore.icon('eye')}<span>Ver</span></button>
          ${pending ? `<button class="button button-primary button-small" type="button" data-application-action="approve" data-id="${application.id}">${AppCore.icon('checkCircle')}<span>Aprobar</span></button><button class="button button-danger button-small" type="button" data-application-action="reject" data-id="${application.id}">${AppCore.icon('x')}<span>Rechazar</span></button>` : ''}
        </div></td>
      </tr>`;
    }).join('');
    el('applications-empty').classList.toggle('hidden', sorted.length > 0);
    body.closest('.table-wrap').classList.toggle('hidden', sorted.length === 0);
  };

  const bindEvents = () => {
    el('new-user')?.addEventListener('click', openNewUser);
    el('user-search')?.addEventListener('input', applyFilters);
    el('role-filter')?.addEventListener('change', applyFilters);
    el('user-status-filter')?.addEventListener('change', applyFilters);
    el('clear-user-filters')?.addEventListener('click', () => {
      el('user-search').value = '';
      el('role-filter').value = '';
      el('user-status-filter').value = '';
      applyFilters();
      AppCore.playSound('click');
    });
    el('users-table-body')?.addEventListener('click', handleUserAction);
    el('applications-table-body')?.addEventListener('click', handleApplicationAction);
    el('user-form')?.addEventListener('submit', saveUser);
    el('print-users')?.addEventListener('click', printUsers);
  };

  const clearUserErrors = () => document.querySelectorAll('#user-form .error-text').forEach(item => item.textContent = '');

  const openNewUser = () => {
    el('user-form').reset();
    el('user-id').value = '';
    el('user-form-title').textContent = 'Nuevo usuario';
    el('password-help').textContent = '*';
    clearUserErrors();
    AppCore.openModal('user-form-modal');
    AppCore.playSound('click');
  };

  const openEditUser = id => {
    const user = state.users.find(item => item.id === id);
    if (!user) return;
    el('user-id').value = user.id;
    el('user-name').value = user.name || '';
    el('user-identification').value = user.identification || '';
    el('user-phone').value = AppCore.sanitizePhone(user.phone || '');
    el('user-email').value = user.email || '';
    el('user-role').value = user.role || 'cliente';
    el('user-active').value = String(user.active !== false);
    el('user-password').value = '';
    el('user-form-title').textContent = 'Editar usuario';
    el('password-help').textContent = '(opcional)';
    clearUserErrors();
    AppCore.openModal('user-form-modal');
    AppCore.playSound('click');
  };

  const openUserDetail = id => {
    const user = state.users.find(item => item.id === id);
    if (!user) return;
    el('user-detail-content').innerHTML = `
      <div class="detail-item full"><small>Nombre</small><strong>${AppCore.escapeHtml(user.name)}</strong></div>
      <div class="detail-item"><small>Rol</small><strong>${AppCore.escapeHtml(AppCore.roleLabel(user.role))}</strong></div>
      <div class="detail-item"><small>Estado</small><strong>${user.active === false ? 'Inactivo' : 'Activo'}</strong></div>
      <div class="detail-item full"><small>Correo</small><strong>${AppCore.escapeHtml(user.email)}</strong></div>
      <div class="detail-item"><small>Identificación</small><strong>${AppCore.escapeHtml(user.identification || 'No registrada')}</strong></div>
      <div class="detail-item"><small>Teléfono</small><strong>${AppCore.escapeHtml(user.phone || 'No registrado')}</strong></div>
      <div class="detail-item full"><small>Fecha de registro</small><strong>${AppCore.formatDate(user.createdAt)}</strong></div>`;
    AppCore.openModal('user-detail-modal');
  };

  const handleUserAction = event => {
    const button = event.target.closest('[data-user-action]');
    if (!button) return;
    const { userAction: action, id } = button.dataset;
    if (action === 'view') openUserDetail(id);
    if (action === 'edit') openEditUser(id);
    if (action === 'delete') deleteUser(id);
  };

  const saveUser = async event => {
    event.preventDefault();
    clearUserErrors();
    const id = el('user-id').value;
    const name = el('user-name').value.trim();
    const identification = el('user-identification').value.trim();
    const phone = AppCore.sanitizePhone(el('user-phone').value);
    const email = el('user-email').value.trim().toLowerCase();
    const role = el('user-role').value;
    const active = el('user-active').value === 'true';
    const password = el('user-password').value;
    const errors = {};

    if (name.length < 3) errors['user-name'] = 'Ingrese un nombre válido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors['user-email'] = 'Ingrese un correo válido.';
    if (phone && !AppCore.isValidPhone(phone)) errors['user-phone'] = 'Use solo números y un + opcional al inicio.';
    if (!['cliente', 'administrador', 'proveedor'].includes(role)) errors['user-role'] = 'Seleccione un rol válido.';
    if (!id && password.length < 8) errors['user-password'] = 'La contraseña debe tener al menos 8 caracteres.';
    if (id && password && password.length < 8) errors['user-password'] = 'La contraseña debe tener al menos 8 caracteres.';
    if (state.users.some(user => user.id !== id && AppCore.normalize(user.email) === AppCore.normalize(email))) errors['user-email'] = 'Ya existe un usuario con este correo.';

    const currentSession = AppCore.getSession();
    if (id === currentSession?.id && role !== 'administrador') errors['user-role'] = 'No puede quitar el rol administrador a su propia sesión.';
    if (id === currentSession?.id && !active) errors['user-role'] = 'No puede desactivar su propia sesión.';

    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([field, msg]) => { const err = el(`error-${field}`); if (err) err.textContent = msg; });
      AppCore.playSound('error');
      return;
    }

    const users = AppCore.read(AppCore.KEYS.users, []);
    if (id) {
      const index = users.findIndex(user => user.id === id);
      if (index < 0) return;
      const updated = { ...users[index], name, identification, phone, email, role, active, updatedAt: new Date().toISOString() };
      if (password) updated.passwordHash = await AppCore.hashPassword(password);
      users[index] = updated;
      AppCore.addActivity('Usuario', `${updated.name} fue actualizado`);
      AppCore.showToast('Usuario actualizado correctamente.', 'success');
    } else {
      const user = { id: AppCore.createId('USR'), name, identification, phone, email, role, active, passwordHash: await AppCore.hashPassword(password), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      users.push(user);
      AppCore.addActivity('Usuario', `${user.name} fue registrado como ${AppCore.roleLabel(user.role)}`);
      AppCore.showToast('Usuario creado correctamente.', 'success');
    }
    AppCore.write(AppCore.KEYS.users, users);
    AppCore.closeModal('user-form-modal');
    load();
  };

  const deleteUser = id => {
    const user = state.users.find(item => item.id === id);
    if (!user) return;
    if (user.id === AppCore.getSession()?.id) {
      AppCore.showToast('No puede eliminar el usuario con el que inició sesión.', 'warning');
      return;
    }
    const adminCount = state.users.filter(item => item.role === 'administrador' && item.active !== false).length;
    if (user.role === 'administrador' && adminCount <= 1) {
      AppCore.showToast('Debe existir al menos un administrador activo.', 'warning');
      return;
    }
    if (!confirm(`¿Eliminar a ${user.name}? Esta acción no se puede deshacer.`)) return;
    AppCore.write(AppCore.KEYS.users, state.users.filter(item => item.id !== id));
    AppCore.addActivity('Usuario', `${user.name} fue eliminado`);
    AppCore.showToast('Usuario eliminado correctamente.', 'success');
    load();
  };

  const handleApplicationAction = event => {
    const button = event.target.closest('[data-application-action]');
    if (!button) return;
    const action = button.dataset.applicationAction;
    const id = button.dataset.id;
    if (action === 'view') return openApplicationDetail(id);
    if (action === 'approve') {
      if (!confirm('¿Aprobar esta solicitud? Se creará el proveedor y una cuenta con rol Proveedor.')) return;
      const result = AppCore.approveSupplierApplication(id);
      if (!result.ok) return AppCore.showToast(result.message, 'warning');
      AppCore.showToast('Proveedor aprobado. La cuenta ya puede iniciar sesión.', 'success');
      return load();
    }
    if (action === 'reject') {
      if (!confirm('¿Rechazar esta solicitud de proveedor?')) return;
      const result = AppCore.rejectSupplierApplication(id);
      if (!result.ok) return AppCore.showToast(result.message, 'warning');
      AppCore.showToast('Solicitud rechazada.', 'success');
      return load();
    }
  };

  const openApplicationDetail = id => {
    const application = state.applications.find(item => item.id === id);
    if (!application) return;
    el('application-detail-content').innerHTML = `
      <div class="detail-item full"><small>Empresa</small><strong>${AppCore.escapeHtml(application.company)}</strong></div>
      <div class="detail-item"><small>Cédula jurídica</small><strong>${AppCore.escapeHtml(application.legalId)}</strong></div>
      <div class="detail-item"><small>Estado</small><strong>${AppCore.escapeHtml(application.status)}</strong></div>
      <div class="detail-item"><small>Contacto</small><strong>${AppCore.escapeHtml(application.contact)}</strong></div>
      <div class="detail-item"><small>Correo</small><strong>${AppCore.escapeHtml(application.email)}</strong></div>
      <div class="detail-item"><small>Teléfono</small><strong>${AppCore.escapeHtml(application.phone)}</strong></div>
      <div class="detail-item"><small>Categoría</small><strong>${AppCore.escapeHtml(application.category)}</strong></div>
      <div class="detail-item"><small>Provincia</small><strong>${AppCore.escapeHtml(application.province)}</strong></div>
      <div class="detail-item full"><small>Información adicional</small><strong>${AppCore.escapeHtml(application.notes || 'Sin información adicional')}</strong></div>`;
    AppCore.openModal('application-detail-modal');
  };

  const printUsers = () => AppCore.printReport('Reporte de usuarios', [
    { label: 'Nombre', value: row => row.name },
    { label: 'Correo', value: row => row.email },
    { label: 'Identificación', value: row => row.identification || 'No registrada' },
    { label: 'Teléfono', value: row => row.phone || 'No registrado' },
    { label: 'Rol', value: row => AppCore.roleLabel(row.role) },
    { label: 'Estado', value: row => row.active === false ? 'Inactivo' : 'Activo' },
    { label: 'Registro', value: row => AppCore.formatDate(row.createdAt) }
  ], state.filtered);

  return { init };
})();

document.addEventListener('DOMContentLoaded', UsuariosApp.init);
