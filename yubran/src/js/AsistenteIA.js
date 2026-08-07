'use strict';

const NovaAIAssistant = (() => {
  let session = null;
  const byId = id => document.getElementById(id);
  const escape = value => AppCore.escapeHtml(value);

  function init() {
    session = AppCore.initShell('assistant');
    if (!session) return;
    document.querySelectorAll('[data-welcome-name]').forEach(element => { element.textContent = session.name.split(/\s+/)[0] || session.name; });
    document.querySelectorAll('[data-client-only]').forEach(element => element.classList.toggle('hidden', session.role !== 'cliente'));
    document.querySelectorAll('[data-admin-only]').forEach(element => element.classList.toggle('hidden', session.role !== 'administrador'));
    document.querySelectorAll('[data-ai-query]').forEach(button => button.addEventListener('click', () => simulateQuery(button.dataset.aiQuery || '')));
    document.querySelectorAll('[data-open-profile]').forEach(button => button.addEventListener('click', openProfileModal));
    byId('ai-form')?.addEventListener('submit', handleSubmit);
    byId('clear-chat')?.addEventListener('click', resetChat);
    byId('profile-form')?.addEventListener('submit', saveProfile);
    byId('password-form')?.addEventListener('submit', savePassword);
    AppCore.setupPhoneInputs(document);
    AppCore.renderIcons(document);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const input = byId('ai-input');
    const text = input?.value.trim() || '';
    if (!text) return;
    input.value = '';
    simulateQuery(text);
  }

  function simulateQuery(text) {
    if (!text) return;
    addUserMessage(text);
    AppCore.playSound('click');
    setThinking(true);
    window.setTimeout(() => { setThinking(false); processQuery(text); }, 460);
  }

  function processQuery(query) {
    session = AppCore.getSession();
    if (!session) return;
    const q = AppCore.normalize(query);
    if (q.includes('todos los usuarios') || q.includes('ver usuarios') || q.includes('lista de usuarios')) return handleGlobalUsersQuery();
    if (q.includes('garantia') || q.includes('garantía') || q.includes('garantias') || q.includes('garantías')) return handleWarrantyQuery();
    if (q.includes('solicitar devolucion') || q.includes('solicitar devolución')) return handleReturnRequest(query);
    if (q.includes('devolucion') || q.includes('devolución') || q.includes('devoluciones') || q.includes('rechaz')) return handleReturnsQuery(q);
    if (q.includes('compra') || q.includes('compre') || q.includes('compré') || q.includes('historial') || q.includes('orden')) return handlePurchasesQuery();
    if (q.includes('contraseña') || q.includes('contrasena') || q.includes('password') || q.includes('clave')) {
      addBotMessage('<p>Para proteger su cuenta, abriré el formulario seguro de cambio de contraseña. Primero deberá confirmar la contraseña actual.</p>');
      AppCore.openModal('password-modal'); AppCore.playSound('info'); return;
    }
    if (q.includes('perfil') || q.includes('mis datos') || q.includes('editar mi')) {
      addBotMessage('<p>He abierto su perfil. Puede actualizar nombre, correo y teléfono; el cambio se guardará en LocalStorage y conservará su rol actual.</p>');
      openProfileModal(); return;
    }
    if (q.includes('producto') || q.includes('catalogo') || q.includes('catálogo')) {
      addBotMessage(`<p>Puede consultar el catálogo desde <a class="ai-inline-link" href="Productos.html">Productos</a>. ${session.role === 'cliente' ? 'Desde allí también puede agregar artículos al carrito y completar una compra.' : 'Su rol dispone de acceso de consulta al catálogo según las reglas del sistema.'}</p>`); return;
    }
    if (q.includes('proveedor') && session.role === 'administrador') {
      addBotMessage('<p>Como administrador puede gestionar proveedores, solicitudes pendientes y reportes desde el módulo <a class="ai-inline-link" href="Proveedores.html">Proveedores</a>.</p>'); return;
    }
    if (q.includes('ayuda') || q.includes('que puedes') || q.includes('qué puedes')) return addBotMessage(buildCapabilitiesMessage());
    addBotMessage(buildGenericMessage());
  }

  function handleWarrantyQuery() {
    if (session.role === 'proveedor') {
      addBotMessage('<p>Los tickets de garantía pertenecen a los compradores y a la gestión administrativa. Su rol de proveedor no puede consultar esos datos.</p>');
      AppCore.playSound('warning');
      return;
    }
    const tickets = AppCore.read(AppCore.KEYS.warrantyTickets, []);
    if (session.role === 'administrador') {
      const pending = tickets.filter(ticket => ['Pendiente', 'En revisión'].includes(ticket.status)).length;
      addBotMessage(`<p>Hay <strong>${tickets.length}</strong> tickets de garantía registrados y <strong>${pending}</strong> pendientes de resolución.</p><p>Puede revisar el historial de compras y responder solicitudes desde <a class="ai-inline-link" href="Garantias.html">Garantías</a>.</p>`);
      return;
    }
    const own = tickets.filter(ticket => ticket.userId === session.id);
    addBotMessage(`<p>Actualmente tiene <strong>${own.length}</strong> ticket${own.length === 1 ? '' : 's'} de garantía.</p><p>Desde <a class="ai-inline-link" href="Garantias.html">Mis garantías</a> puede revisar sus compras, solicitar garantía para un producto elegible y consultar las respuestas del administrador.</p>`);
  }

  function handleGlobalUsersQuery() {
    if (session.role !== 'administrador') {
      AppCore.addActivity('Autenticación', `${session.name} intentó consultar usuarios globales sin permisos`);
      addBotMessage(`<div class="ai-denied"><span>${AppCore.icon('shieldCheck')}</span><div><strong>Acceso denegado</strong><p>El rol ${escape(AppCore.roleLabel(session.role))} no puede consultar la lista global de usuarios. Esta restricción evita exponer información de otras cuentas.</p></div></div>`);
      AppCore.playSound('warning'); return;
    }
    const users = AppCore.read(AppCore.KEYS.users, []);
    const rows = users.slice(0, 10).map(user => `<li><span><strong>${escape(user.name)}</strong><small>${escape(user.email)}</small></span><span class="ai-role-tag">${escape(AppCore.roleLabel(user.role))}</span></li>`).join('');
    addBotMessage(`<p>Acceso administrativo concedido. Actualmente hay <strong>${users.length}</strong> usuarios registrados.</p><ul class="ai-data-list">${rows || '<li>No hay usuarios registrados.</li>'}</ul>${users.length > 10 ? '<p class="ai-muted">Se muestran los primeros 10 registros.</p>' : ''}<p><a class="ai-inline-link" href="Usuarios.html">Abrir administración de usuarios</a></p>`);
  }

  function handlePurchasesQuery() {
    const orders = AppCore.read(AppCore.KEYS.orders, []);
    const products = AppCore.read(AppCore.KEYS.products, []);
    if (session.role === 'administrador') {
      if (!orders.length) return addBotMessage('<p>No existen compras registradas todavía.</p>');
      return addBotMessage(`<p>Como administrador puede ver el resumen global. Hay <strong>${orders.length}</strong> compras almacenadas.</p><div class="ai-order-list">${orders.slice(0, 6).map(order => purchaseRow(order, products, true)).join('')}</div>`);
    }
    if (session.role !== 'cliente') return addBotMessage(`<p>El historial de compras está disponible para cuentas de cliente. Su sesión actual corresponde al rol <strong>${escape(AppCore.roleLabel(session.role))}</strong>.</p>`);
    const ownOrders = orders.filter(order => order.userId === session.id);
    if (!ownOrders.length) return addBotMessage('<p>No se encontraron compras asociadas a su cuenta. Puede agregar productos al carrito desde el catálogo y completar una compra para verla aquí.</p><p><a class="ai-inline-link" href="Productos.html">Ir al catálogo de productos</a></p>');
    addBotMessage(`<p>Encontré <strong>${ownOrders.length}</strong> compra${ownOrders.length === 1 ? '' : 's'} asociada${ownOrders.length === 1 ? '' : 's'} a su cuenta.</p><div class="ai-order-list">${ownOrders.slice(0, 8).map(order => purchaseRow(order, products, false)).join('')}</div>`);
  }

  function purchaseRow(order, products, showCustomer) {
    const items = Array.isArray(order.items) ? order.items : [];
    const itemText = items.map(item => { const product = products.find(record => record.id === item.productId); return `${Number(item.quantity) || 0}× ${product?.name || item.productId || 'Producto'}`; }).join(', ') || 'Sin detalle de artículos';
    return `<article class="ai-order-card"><div><strong>${escape(order.id)}</strong><small>${escape(AppCore.formatDate(order.createdAt))}</small></div><p>${escape(itemText)}</p>${showCustomer ? `<small>Cliente: ${escape(order.customer || order.userId)}</small>` : ''}<span>${escape(formatOrderAmount(order))}</span></article>`;
  }

  function formatOrderAmount(order) {
    if (order.currency === 'USD' && Number.isFinite(Number(order.amountPaid))) return `US$${Number(order.amountPaid).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return AppCore.formatCurrency(order.total || order.amountPaid || 0);
  }

  function handleReturnsQuery(q) {
    const returns = AppCore.read(AppCore.KEYS.returns, []);
    const visible = session.role === 'administrador' ? returns : returns.filter(item => item.userId === session.id);
    if (session.role === 'proveedor') return addBotMessage('<p>Las solicitudes de devolución pertenecen a las cuentas de cliente y a la gestión administrativa. Este rol no puede consultar devoluciones de compradores.</p>');
    if (!visible.length) return addBotMessage(`<p>No hay solicitudes de devolución ${session.role === 'administrador' ? 'registradas en el sistema' : 'asociadas a su cuenta'}.</p>${session.role === 'cliente' ? '<p>Si desea crear una solicitud, escriba <strong>Solicitar devolución ORD-...</strong> usando el número de una de sus compras.</p>' : ''}`);
    const rejectedOnly = q.includes('rechaz');
    const filtered = rejectedOnly ? visible.filter(item => item.status === 'Rechazada') : visible;
    if (!filtered.length) return addBotMessage('<p>No hay devoluciones rechazadas para mostrar.</p>');
    const html = filtered.slice(0, 8).map(item => `<article class="ai-return-card"><div><strong>${escape(item.id)}</strong><span class="badge ${returnBadgeClass(item.status)}">${escape(item.status)}</span></div><small>Orden: ${escape(item.orderId)}</small><p>${escape(item.reason || 'Sin motivo registrado')}</p>${item.comments ? `<small>${escape(item.comments)}</small>` : ''}</article>`).join('');
    addBotMessage(`<p>Estas son las solicitudes encontradas:</p><div class="ai-return-list">${html}</div>`);
  }

  function returnBadgeClass(status) { return status === 'Aprobada' ? 'badge-active' : status === 'Rechazada' ? 'badge-inactive' : 'badge-low'; }

  function handleReturnRequest(query) {
    if (session.role !== 'cliente') return addBotMessage('<p>Solo una cuenta de cliente puede crear una solicitud de devolución de sus propias compras.</p>');
    const match = String(query).match(/ORD-[A-Z0-9-]+/i);
    if (!match) return addBotMessage('<p>Indique el número de orden. Ejemplo: <strong>Solicitar devolución ORD-ABC123</strong>.</p>');
    const orderId = match[0].toUpperCase();
    const orders = AppCore.read(AppCore.KEYS.orders, []);
    const order = orders.find(item => String(item.id).toUpperCase() === orderId && item.userId === session.id);
    if (!order) return addBotMessage(`<p>No encontré una compra propia con el número <strong>${escape(orderId)}</strong>.</p>`);
    const returns = AppCore.read(AppCore.KEYS.returns, []);
    const existing = returns.find(item => item.userId === session.id && item.orderId === order.id && item.status !== 'Rechazada');
    if (existing) return addBotMessage(`<p>La orden ${escape(order.id)} ya tiene la solicitud <strong>${escape(existing.id)}</strong> con estado <strong>${escape(existing.status)}</strong>.</p>`);
    const request = { id: AppCore.createId('DEV'), userId: session.id, orderId: order.id, status: 'Pendiente', reason: 'Solicitud creada desde el asistente', comments: 'Pendiente de revisión administrativa.', createdAt: new Date().toISOString() };
    returns.unshift(request); AppCore.write(AppCore.KEYS.returns, returns.slice(0, 100)); AppCore.addActivity('Compra', `${session.name} solicitó devolución de ${order.id}`);
    addBotMessage(`<p>La solicitud <strong>${escape(request.id)}</strong> fue registrada para la orden <strong>${escape(order.id)}</strong>. Su estado inicial es <strong>Pendiente</strong>.</p>`); AppCore.playSound('success');
  }

  function buildCapabilitiesMessage() {
    const options = ['Abrir y actualizar su perfil.', 'Abrir el cambio de contraseña.', 'Orientarle hacia el catálogo de productos.'];
    if (session.role === 'cliente') options.push('Consultar sus compras y solicitudes de devolución.', 'Crear una solicitud de devolución usando el número de orden.', 'Abrir sus compras elegibles y tickets de garantía.');
    if (session.role === 'administrador') options.push('Consultar un resumen de usuarios y compras globales.', 'Revisar historial de compras y tickets de garantía.', 'Orientarle a los módulos administrativos.');
    if (session.role === 'proveedor') options.push('Consultar el catálogo disponible como proveedor aprobado.');
    return `<p>Su rol actual es <strong>${escape(AppCore.roleLabel(session.role))}</strong>. Puedo:</p><ul class="ai-capability-list">${options.map(option => `<li>${escape(option)}</li>`).join('')}</ul>`;
  }

  function buildGenericMessage() { return `<p>Entendido. Puedo ayudarle con funciones del sistema dentro de los permisos de <strong>${escape(AppCore.roleLabel(session.role))}</strong>.</p><p>Pruebe con <strong>“Mis compras”</strong>, <strong>“Mis garantías”</strong>, <strong>“Mis devoluciones”</strong>, <strong>“Editar mi perfil”</strong>, <strong>“Cambiar mi contraseña”</strong> o <strong>“¿Qué puedes hacer?”</strong>.</p>`; }

  function openProfileModal() {
    session = AppCore.getSession(); if (!session) return;
    const user = AppCore.read(AppCore.KEYS.users, []).find(item => item.id === session.id); if (!user) return;
    byId('profile-name').value = user.name || ''; byId('profile-email').value = user.email || ''; byId('profile-phone').value = AppCore.sanitizePhone(user.phone || '');
    setFormMessage('profile-message', '', ''); AppCore.openModal('profile-modal'); AppCore.playSound('click');
  }

  function saveProfile(event) {
    event.preventDefault();
    const result = AppCore.updateOwnProfile({ name: byId('profile-name').value, email: byId('profile-email').value, phone: byId('profile-phone').value });
    if (!result.ok) { setFormMessage('profile-message', result.message, 'error'); AppCore.playSound('error'); return; }
    session = AppCore.getSession();
    document.querySelectorAll('[data-user-name]').forEach(element => element.textContent = session.name);
    document.querySelectorAll('[data-user-avatar]').forEach(element => element.textContent = AppCore.initials(session.name));
    document.querySelectorAll('[data-welcome-name]').forEach(element => element.textContent = session.name.split(/\s+/)[0] || session.name);
    setFormMessage('profile-message', 'Perfil actualizado correctamente.', 'success'); AppCore.playSound('success');
    window.setTimeout(() => AppCore.closeModal('profile-modal'), 650); addBotMessage('<p>Su perfil se actualizó correctamente. Los cambios ya están disponibles en la sesión actual.</p>');
  }

  async function savePassword(event) {
    event.preventDefault();
    const current = byId('current-password').value, next = byId('new-password').value, confirm = byId('confirm-new-password').value;
    if (next !== confirm) { setFormMessage('password-message', 'Las contraseñas nuevas no coinciden.', 'error'); AppCore.playSound('error'); return; }
    const result = await AppCore.changeOwnPassword(current, next);
    if (!result.ok) { setFormMessage('password-message', result.message, 'error'); AppCore.playSound('error'); return; }
    event.currentTarget.reset(); setFormMessage('password-message', 'Contraseña actualizada correctamente.', 'success'); AppCore.playSound('success');
    window.setTimeout(() => AppCore.closeModal('password-modal'), 650); addBotMessage('<p>La contraseña se actualizó correctamente.</p>');
  }

  function setFormMessage(id, text, type) { const element = byId(id); if (!element) return; element.textContent = text; element.className = `form-message full ${type || ''}`; }
  function addUserMessage(text) { const chat = byId('chat-window'); const article = document.createElement('article'); article.className = 'ai-message user-message'; article.innerHTML = `<div class="ai-message-bubble"><p>${escape(text)}</p></div>`; chat.appendChild(article); scrollChat(); }
  function addBotMessage(html) { const chat = byId('chat-window'); const article = document.createElement('article'); article.className = 'ai-message bot-message'; article.innerHTML = `<span class="ai-message-avatar">${AppCore.icon('bot')}</span><div class="ai-message-bubble">${html}</div>`; chat.appendChild(article); scrollChat(); AppCore.playSound('info'); }
  function setThinking(active) { const chat = byId('chat-window'); const existing = byId('ai-thinking'); if (!active) { existing?.remove(); return; } if (existing) return; const article = document.createElement('article'); article.id = 'ai-thinking'; article.className = 'ai-message bot-message'; article.innerHTML = `<span class="ai-message-avatar">${AppCore.icon('bot')}</span><div class="ai-message-bubble ai-thinking"><span></span><span></span><span></span></div>`; chat.appendChild(article); scrollChat(); }
  function resetChat() { const chat = byId('chat-window'); chat.innerHTML = `<article class="ai-message bot-message"><span class="ai-message-avatar">${AppCore.icon('bot')}</span><div class="ai-message-bubble"><p>Chat reiniciado. ¿En qué puedo ayudarle?</p></div></article>`; AppCore.playSound('click'); scrollChat(); }
  function scrollChat() { const chat = byId('chat-window'); requestAnimationFrame(() => { chat.scrollTop = chat.scrollHeight; }); }
  return { init };
})();

document.addEventListener('DOMContentLoaded', NovaAIAssistant.init);
