'use strict';

const GarantiasApp = (() => {
  const WARRANTY_MONTHS = 12;
  const DAY_MS = 24 * 60 * 60 * 1000;
  let session = null;
  let orders = [];
  let tickets = [];
  let users = [];
  let products = [];

  const el = id => document.getElementById(id);
  const escape = value => AppCore.escapeHtml(value);

  const init = () => {
    session = AppCore.initShell('warranties');
    if (!session) return;
    load();
    bindEvents();
  };

  const load = () => {
    orders = AppCore.read(AppCore.KEYS.orders, []);
    tickets = AppCore.read(AppCore.KEYS.warrantyTickets, []);
    users = AppCore.read(AppCore.KEYS.users, []);
    products = AppCore.read(AppCore.KEYS.products, []);
    renderByRole();
    renderStats();
    AppCore.renderIcons(document);
  };

  const bindEvents = () => {
    el('client-order-search')?.addEventListener('input', renderClientPurchases);
    el('admin-order-search')?.addEventListener('input', renderAdminOrders);
    el('admin-ticket-search')?.addEventListener('input', renderAdminTickets);
    el('ticket-status-filter')?.addEventListener('change', renderAdminTickets);
    el('client-purchases')?.addEventListener('click', handleClientPurchaseAction);
    el('client-tickets')?.addEventListener('click', handleTicketAction);
    el('admin-orders-body')?.addEventListener('click', handleOrderAction);
    el('admin-tickets-body')?.addEventListener('click', handleTicketAction);
    el('warranty-request-form')?.addEventListener('submit', submitWarrantyRequest);
    el('ticket-admin-response-form')?.addEventListener('submit', submitAdminResponse);
  };

  const renderByRole = () => {
    const isAdmin = session.role === 'administrador';
    el('admin-warranty-panel')?.classList.toggle('hidden', !isAdmin);
    el('client-warranty-panel')?.classList.toggle('hidden', isAdmin);
    el('warranty-page-title').textContent = isAdmin ? 'Historial de compras y garantías' : 'Mis compras y garantías';
    el('warranty-page-description').textContent = isAdmin
      ? 'Consulte el historial de compras de la empresa y responda tickets de garantía.'
      : 'Revise sus compras, compruebe la vigencia y solicite garantía mediante un ticket.';
    if (isAdmin) {
      renderAdminOrders();
      renderAdminTickets();
    } else {
      renderClientPurchases();
      renderClientTickets();
    }
  };

  const visibleOrders = () => session.role === 'administrador' ? orders : orders.filter(order => order.userId === session.id);
  const visibleTickets = () => session.role === 'administrador' ? tickets : tickets.filter(ticket => ticket.userId === session.id);

  const renderStats = () => {
    const scopedOrders = visibleOrders();
    const scopedTickets = visibleTickets();
    el('stat-orders').textContent = scopedOrders.length;
    el('stat-pending').textContent = scopedTickets.filter(ticket => ['Pendiente', 'En revisión'].includes(ticket.status)).length;
    el('stat-approved').textContent = scopedTickets.filter(ticket => ticket.status === 'Aprobada').length;
    el('stat-rejected').textContent = scopedTickets.filter(ticket => ticket.status === 'Rechazada').length;
  };

  const getOrderItemSnapshot = (order, item) => {
    const product = products.find(record => record.id === item.productId);
    return {
      id: item.productId,
      name: item.productName || product?.name || item.productId || 'Producto no disponible',
      code: item.productCode || product?.code || 'Sin código',
      unitPrice: Number(item.unitPrice ?? product?.price ?? 0),
      quantity: Number(item.quantity || 0),
      image: Array.isArray(product?.images) ? product.images[0] : null
    };
  };

  const getWarrantyExpiry = order => {
    const purchaseDate = new Date(order.createdAt);
    if (Number.isNaN(purchaseDate.getTime())) return null;
    const expiry = new Date(purchaseDate);
    expiry.setMonth(expiry.getMonth() + WARRANTY_MONTHS);
    return expiry;
  };

  const getEligibility = (order, item, requestedQuantity = 1, userId = order?.userId) => {
    const checks = {
      orderExists: Boolean(order),
      ownerMatches: Boolean(order && userId && order.userId === userId),
      productInOrder: Boolean(order && item && Array.isArray(order.items) && order.items.some(record => record.productId === item.productId)),
      quantityValid: Boolean(item && Number(requestedQuantity) > 0 && Number(requestedQuantity) <= Number(item.quantity || 0)),
      withinPeriod: false
    };
    const expiry = order ? getWarrantyExpiry(order) : null;
    checks.withinPeriod = Boolean(expiry && Date.now() <= expiry.getTime());
    return { checks, eligible: Object.values(checks).every(Boolean), expiry };
  };

  const findOrderItem = (order, productId) => Array.isArray(order?.items) ? order.items.find(item => item.productId === productId) : null;
  const customerName = userId => users.find(user => user.id === userId)?.name || orders.find(order => order.userId === userId)?.customer || userId || 'Cliente';

  const formatOrderAmount = order => {
    if (order.currency === 'USD' && Number.isFinite(Number(order.amountPaid))) return `US$${Number(order.amountPaid).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return AppCore.formatCurrency(order.total || order.amountPaid || 0);
  };

  const renderClientPurchases = () => {
    if (session.role !== 'cliente') return;
    const term = AppCore.normalize(el('client-order-search')?.value || '');
    const ownOrders = orders.filter(order => order.userId === session.id).filter(order => {
      const itemText = (order.items || []).map(item => { const snap = getOrderItemSnapshot(order, item); return `${snap.name} ${snap.code}`; }).join(' ');
      return !term || AppCore.normalize(`${order.id} ${itemText}`).includes(term);
    });
    const container = el('client-purchases');
    if (!container) return;
    const cards = [];
    ownOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const snap = getOrderItemSnapshot(order, item);
        const eligibility = getEligibility(order, item, 1, session.id);
        const activeTicket = tickets.find(ticket => ticket.userId === session.id && ticket.orderId === order.id && ticket.productId === item.productId && ['Pendiente', 'En revisión', 'Aprobada'].includes(ticket.status));
        cards.push(`
          <article class="warranty-purchase-card">
            <div class="warranty-product-thumb">${snap.image ? `<img src="${escape(snap.image)}" alt="${escape(snap.name)}">` : `<span>${AppCore.icon('box')}</span>`}</div>
            <div class="warranty-purchase-main">
              <div class="warranty-purchase-title"><div><strong>${escape(snap.name)}</strong><small>${escape(snap.code)} · Orden ${escape(order.id)}</small></div><span class="badge ${eligibility.eligible ? 'badge-active' : 'badge-inactive'}">${eligibility.eligible ? 'Garantía vigente' : 'Garantía vencida'}</span></div>
              <div class="warranty-purchase-meta"><span>Compra: ${escape(AppCore.formatDate(order.createdAt))}</span><span>Vence: ${escape(eligibility.expiry ? AppCore.formatDate(eligibility.expiry) : 'Sin fecha')}</span><span>Cantidad comprada: ${snap.quantity}</span></div>
            </div>
            <div class="warranty-purchase-actions">
              <button class="button button-secondary button-small" type="button" data-order-action="view" data-order-id="${escape(order.id)}"><span data-icon="eye"></span> Ver compra</button>
              ${activeTicket
                ? `<button class="button button-secondary button-small" type="button" data-ticket-action="view" data-ticket-id="${escape(activeTicket.id)}"><span data-icon="ticket"></span> Ver ticket</button>`
                : `<button class="button button-primary button-small" type="button" data-warranty-request data-order-id="${escape(order.id)}" data-product-id="${escape(item.productId)}" ${eligibility.eligible ? '' : 'disabled'}><span data-icon="shieldCheck"></span> Pedir garantía</button>`}
            </div>
          </article>`);
      });
    });
    container.innerHTML = cards.join('');
    container.classList.toggle('hidden', cards.length === 0);
    el('client-purchases-empty')?.classList.toggle('hidden', cards.length > 0);
    AppCore.renderIcons(container);
  };

  const renderClientTickets = () => {
    if (session.role !== 'cliente') return;
    const own = tickets.filter(ticket => ticket.userId === session.id).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    const container = el('client-tickets');
    if (!container) return;
    container.innerHTML = own.map(ticket => {
      const order = orders.find(record => record.id === ticket.orderId);
      const item = findOrderItem(order, ticket.productId);
      const snap = getOrderItemSnapshot(order || {}, item || { productId: ticket.productId, quantity: ticket.quantity, productName: ticket.productName, productCode: ticket.productCode });
      return `<button class="warranty-ticket-card" type="button" data-ticket-action="view" data-ticket-id="${escape(ticket.id)}"><span class="warranty-ticket-icon">${AppCore.icon('ticket')}</span><span><strong>${escape(ticket.id)}</strong><small>${escape(snap.name)} · ${escape(ticket.orderId)}</small><em>${escape(ticket.issueType || 'Solicitud de garantía')}</em></span><span class="badge ${statusBadgeClass(ticket.status)}">${escape(ticket.status)}</span></button>`;
    }).join('');
    container.classList.toggle('hidden', own.length === 0);
    el('client-tickets-empty')?.classList.toggle('hidden', own.length > 0);
  };

  const renderAdminOrders = () => {
    if (session.role !== 'administrador') return;
    const term = AppCore.normalize(el('admin-order-search')?.value || '');
    const filtered = orders.filter(order => {
      const items = (order.items || []).map(item => { const snap = getOrderItemSnapshot(order, item); return `${snap.name} ${snap.code}`; }).join(' ');
      return !term || AppCore.normalize(`${order.id} ${order.customer || ''} ${customerName(order.userId)} ${items}`).includes(term);
    });
    const body = el('admin-orders-body');
    if (!body) return;
    body.innerHTML = filtered.map(order => {
      const itemText = (order.items || []).map(item => { const snap = getOrderItemSnapshot(order, item); return `${snap.quantity}× ${snap.name}`; }).join(', ');
      return `<tr><td><strong>${escape(order.id)}</strong></td><td>${escape(order.customer || customerName(order.userId))}</td><td>${escape(AppCore.formatDate(order.createdAt))}</td><td class="warranty-items-cell">${escape(itemText || 'Sin detalle')}</td><td>${escape(order.payment?.type || 'No registrado')}</td><td><strong>${escape(formatOrderAmount(order))}</strong></td><td><button class="button button-secondary button-small" type="button" data-order-action="view" data-order-id="${escape(order.id)}"><span data-icon="eye"></span> Ver</button></td></tr>`;
    }).join('');
    body.closest('.table-wrap')?.classList.toggle('hidden', filtered.length === 0);
    el('admin-orders-empty')?.classList.toggle('hidden', filtered.length > 0);
    AppCore.renderIcons(body);
  };

  const renderAdminTickets = () => {
    if (session.role !== 'administrador') return;
    const term = AppCore.normalize(el('admin-ticket-search')?.value || '');
    const status = el('ticket-status-filter')?.value || '';
    const filtered = tickets.filter(ticket => {
      const order = orders.find(record => record.id === ticket.orderId);
      const item = findOrderItem(order, ticket.productId);
      const snap = getOrderItemSnapshot(order || {}, item || { productId: ticket.productId, productName: ticket.productName, productCode: ticket.productCode, quantity: ticket.quantity });
      const haystack = `${ticket.id} ${ticket.orderId} ${customerName(ticket.userId)} ${snap.name} ${snap.code}`;
      return (!term || AppCore.normalize(haystack).includes(term)) && (!status || ticket.status === status);
    });
    const body = el('admin-tickets-body');
    if (!body) return;
    body.innerHTML = filtered.map(ticket => {
      const order = orders.find(record => record.id === ticket.orderId);
      const item = findOrderItem(order, ticket.productId);
      const snap = getOrderItemSnapshot(order || {}, item || { productId: ticket.productId, productName: ticket.productName, productCode: ticket.productCode, quantity: ticket.quantity });
      const eligibility = validateTicket(ticket);
      return `<tr><td><strong>${escape(ticket.id)}</strong><small class="table-subtext">${escape(AppCore.formatDate(ticket.createdAt))}</small></td><td>${escape(customerName(ticket.userId))}</td><td><strong>${escape(ticket.orderId)}</strong></td><td>${escape(snap.name)}</td><td><span class="badge ${eligibility.eligible ? 'badge-active' : 'badge-inactive'}">${eligibility.eligible ? 'Cumple' : 'No cumple'}</span></td><td><span class="badge ${statusBadgeClass(ticket.status)}">${escape(ticket.status)}</span></td><td><button class="button button-primary button-small" type="button" data-ticket-action="review" data-ticket-id="${escape(ticket.id)}"><span data-icon="messageSquare"></span> Revisar</button></td></tr>`;
    }).join('');
    body.closest('.table-wrap')?.classList.toggle('hidden', filtered.length === 0);
    el('admin-tickets-empty')?.classList.toggle('hidden', filtered.length > 0);
    AppCore.renderIcons(body);
  };

  const statusBadgeClass = status => status === 'Aprobada' ? 'badge-active' : status === 'Rechazada' ? 'badge-inactive' : 'badge-low';

  const handleClientPurchaseAction = event => {
    const request = event.target.closest('[data-warranty-request]');
    if (request) return openWarrantyRequest(request.dataset.orderId, request.dataset.productId);
    const orderButton = event.target.closest('[data-order-action]');
    if (orderButton) return openOrderDetail(orderButton.dataset.orderId);
    const ticketButton = event.target.closest('[data-ticket-action]');
    if (ticketButton) return openTicketDetail(ticketButton.dataset.ticketId, false);
  };

  const handleOrderAction = event => {
    const button = event.target.closest('[data-order-action]');
    if (button) openOrderDetail(button.dataset.orderId);
  };

  const handleTicketAction = event => {
    const button = event.target.closest('[data-ticket-action]');
    if (!button) return;
    openTicketDetail(button.dataset.ticketId, session.role === 'administrador');
  };

  const openWarrantyRequest = (orderId, productId) => {
    const order = orders.find(record => record.id === orderId && record.userId === session.id);
    const item = findOrderItem(order, productId);
    if (!order || !item) return AppCore.showToast('No se encontró la compra seleccionada.', 'error');
    const eligibility = getEligibility(order, item, 1, session.id);
    if (!eligibility.eligible) return AppCore.showToast('Este producto ya no se encuentra dentro del periodo de garantía.', 'warning');
    const snap = getOrderItemSnapshot(order, item);
    el('warranty-order-id').value = order.id;
    el('warranty-product-id').value = item.productId;
    el('warranty-quantity').innerHTML = Array.from({ length: Math.max(1, snap.quantity) }, (_, index) => `<option value="${index + 1}">${index + 1}</option>`).join('');
    el('warranty-issue').value = '';
    el('warranty-description').value = '';
    el('warranty-request-error').textContent = '';
    el('warranty-request-summary').innerHTML = `<span class="warranty-request-icon">${AppCore.icon('shieldCheck')}</span><div><strong>${escape(snap.name)}</strong><small>${escape(snap.code)} · Orden ${escape(order.id)}</small><p>Compra: ${escape(AppCore.formatDate(order.createdAt))} · Garantía hasta ${escape(AppCore.formatDate(eligibility.expiry))}</p></div>`;
    AppCore.openModal('warranty-request-modal');
    AppCore.playSound('click');
  };

  const submitWarrantyRequest = event => {
    event.preventDefault();
    const orderId = el('warranty-order-id').value;
    const productId = el('warranty-product-id').value;
    const quantity = Number(el('warranty-quantity').value || 1);
    const issueType = el('warranty-issue').value;
    const description = el('warranty-description').value.trim();
    const order = orders.find(record => record.id === orderId && record.userId === session.id);
    const item = findOrderItem(order, productId);
    const eligibility = getEligibility(order, item, quantity, session.id);
    const error = el('warranty-request-error');
    if (!issueType) { error.textContent = 'Seleccione el tipo de problema.'; AppCore.playSound('error'); return; }
    if (description.length < 20) { error.textContent = 'Describa el problema con al menos 20 caracteres.'; AppCore.playSound('error'); return; }
    if (!eligibility.eligible) { error.textContent = 'La compra no cumple los requisitos básicos de garantía.'; AppCore.playSound('error'); return; }
    const existing = tickets.find(ticket => ticket.userId === session.id && ticket.orderId === orderId && ticket.productId === productId && ['Pendiente', 'En revisión', 'Aprobada'].includes(ticket.status));
    if (existing) { error.textContent = `Ya existe el ticket ${existing.id} para este producto.`; AppCore.playSound('warning'); return; }
    const snap = getOrderItemSnapshot(order, item);
    const now = new Date().toISOString();
    const ticket = {
      id: AppCore.createId('GAR'), userId: session.id, customerName: session.name,
      orderId, productId, productName: snap.name, productCode: snap.code, quantity,
      issueType, description, status: 'Pendiente', createdAt: now, updatedAt: now,
      warrantyExpiresAt: eligibility.expiry?.toISOString() || null,
      messages: [{ id: AppCore.createId('MSG'), authorRole: 'cliente', authorName: session.name, text: description, createdAt: now }]
    };
    tickets.unshift(ticket);
    AppCore.write(AppCore.KEYS.warrantyTickets, tickets.slice(0, 200));
    AppCore.addActivity('Garantía', `${session.name} abrió el ticket ${ticket.id} para la orden ${orderId}`);
    AppCore.closeModal('warranty-request-modal');
    AppCore.showToast(`Ticket ${ticket.id} creado. Un administrador debe revisarlo y responder.`, 'success', 'Garantía solicitada');
    load();
  };

  const openOrderDetail = orderId => {
    const order = orders.find(record => record.id === orderId);
    if (!order || (session.role !== 'administrador' && order.userId !== session.id)) return;
    const expiry = getWarrantyExpiry(order);
    const rows = (order.items || []).map(item => {
      const snap = getOrderItemSnapshot(order, item);
      const eligibility = getEligibility(order, item, 1, order.userId);
      return `<article class="warranty-order-item"><span class="warranty-order-item-icon">${AppCore.icon('box')}</span><div><strong>${escape(snap.name)}</strong><small>${escape(snap.code)} · ${snap.quantity} unidad${snap.quantity === 1 ? '' : 'es'} · ${escape(AppCore.formatCurrency(snap.unitPrice))} c/u</small></div><span class="badge ${eligibility.eligible ? 'badge-active' : 'badge-inactive'}">${eligibility.eligible ? 'Vigente' : 'Vencida'}</span></article>`;
    }).join('');
    el('order-detail-content').innerHTML = `
      <div class="warranty-detail-grid">
        <div class="detail-item"><small>Orden</small><strong>${escape(order.id)}</strong></div>
        <div class="detail-item"><small>Cliente</small><strong>${escape(order.customer || customerName(order.userId))}</strong></div>
        <div class="detail-item"><small>Fecha de compra</small><strong>${escape(AppCore.formatDate(order.createdAt))}</strong></div>
        <div class="detail-item"><small>Garantía general hasta</small><strong>${escape(expiry ? AppCore.formatDate(expiry) : 'Sin fecha')}</strong></div>
        <div class="detail-item"><small>Forma de pago</small><strong>${escape(order.payment?.type || 'No registrada')}</strong></div>
        <div class="detail-item"><small>Total</small><strong>${escape(formatOrderAmount(order))}</strong></div>
      </div>
      <div class="warranty-order-items"><h4>Productos comprados</h4>${rows || '<p class="muted">Sin detalle de productos.</p>'}</div>`;
    AppCore.openModal('order-detail-modal');
    AppCore.renderIcons(el('order-detail-content'));
    AppCore.playSound('click');
  };

  const validateTicket = ticket => {
    const order = orders.find(record => record.id === ticket.orderId);
    const item = findOrderItem(order, ticket.productId);
    return getEligibility(order, item, ticket.quantity, ticket.userId);
  };

  const openTicketDetail = (ticketId, adminMode) => {
    const ticket = tickets.find(record => record.id === ticketId);
    if (!ticket || (!adminMode && ticket.userId !== session.id)) return;
    const order = orders.find(record => record.id === ticket.orderId);
    const item = findOrderItem(order, ticket.productId);
    const snap = getOrderItemSnapshot(order || {}, item || { productId: ticket.productId, productName: ticket.productName, productCode: ticket.productCode, quantity: ticket.quantity });
    const validation = validateTicket(ticket);
    const checks = [
      ['Compra registrada', validation.checks.orderExists, order ? `Orden ${order.id}` : 'No encontrada'],
      ['Cliente coincide con la compra', validation.checks.ownerMatches, customerName(ticket.userId)],
      ['Producto pertenece a la orden', validation.checks.productInOrder, snap.name],
      ['Cantidad solicitada válida', validation.checks.quantityValid, `${ticket.quantity} unidad${Number(ticket.quantity) === 1 ? '' : 'es'}`],
      [`Dentro de ${WARRANTY_MONTHS} meses`, validation.checks.withinPeriod, validation.expiry ? `Vence ${AppCore.formatDate(validation.expiry)}` : 'Sin fecha válida']
    ];
    const messages = Array.isArray(ticket.messages) ? ticket.messages : [];
    el('ticket-detail-subtitle').textContent = `${ticket.id} · ${ticket.status}`;
    el('ticket-detail-content').innerHTML = `
      <div class="warranty-ticket-summary">
        <div><small>Cliente</small><strong>${escape(ticket.customerName || customerName(ticket.userId))}</strong></div>
        <div><small>Orden</small><strong>${escape(ticket.orderId)}</strong></div>
        <div><small>Producto</small><strong>${escape(snap.name)}</strong></div>
        <div><small>Cantidad</small><strong>${Number(ticket.quantity) || 1}</strong></div>
        <div><small>Problema</small><strong>${escape(ticket.issueType || 'No especificado')}</strong></div>
        <div><small>Estado</small><span class="badge ${statusBadgeClass(ticket.status)}">${escape(ticket.status)}</span></div>
      </div>
      <section class="warranty-validation-box ${validation.eligible ? 'eligible' : 'not-eligible'}">
        <header><span>${AppCore.icon(validation.eligible ? 'shieldCheck' : 'alertTriangle')}</span><div><strong>${validation.eligible ? 'Cumple los requisitos básicos' : 'No cumple todos los requisitos básicos'}</strong><small>Validación automática basada en el historial guardado. La decisión final corresponde al administrador.</small></div></header>
        <div class="warranty-check-list">${checks.map(([label, ok, detail]) => `<div><span class="warranty-check-icon ${ok ? 'ok' : 'fail'}">${AppCore.icon(ok ? 'checkCircle' : 'x')}</span><span><strong>${escape(label)}</strong><small>${escape(detail)}</small></span></div>`).join('')}</div>
      </section>
      <section class="warranty-conversation"><h4>Conversación del ticket</h4>${messages.length ? messages.map(message => `<article class="warranty-message ${message.authorRole === 'administrador' ? 'admin' : 'client'}"><header><strong>${escape(message.authorName || AppCore.roleLabel(message.authorRole))}</strong><small>${escape(AppCore.formatDate(message.createdAt))}</small></header><p>${escape(message.text)}</p></article>`).join('') : `<article class="warranty-message client"><header><strong>${escape(ticket.customerName || customerName(ticket.userId))}</strong><small>${escape(AppCore.formatDate(ticket.createdAt))}</small></header><p>${escape(ticket.description || 'Sin descripción')}</p></article>`}</section>`;
    el('ticket-admin-response-form').classList.toggle('hidden', !adminMode);
    el('ticket-client-footer').classList.toggle('hidden', adminMode);
    if (adminMode) {
      el('ticket-response-id').value = ticket.id;
      el('ticket-new-status').value = ticket.status === 'Pendiente' ? 'En revisión' : (['En revisión', 'Aprobada', 'Rechazada'].includes(ticket.status) ? ticket.status : 'En revisión');
      el('ticket-admin-message').value = '';
      el('ticket-response-error').textContent = '';
    }
    AppCore.openModal('ticket-detail-modal');
    AppCore.renderIcons(el('ticket-detail-content'));
    AppCore.playSound('click');
  };

  const submitAdminResponse = event => {
    event.preventDefault();
    if (session.role !== 'administrador') return;
    const ticketId = el('ticket-response-id').value;
    const status = el('ticket-new-status').value;
    const message = el('ticket-admin-message').value.trim();
    const error = el('ticket-response-error');
    const ticket = tickets.find(record => record.id === ticketId);
    if (!ticket) return;
    if (message.length < 10) { error.textContent = 'Escriba una respuesta de al menos 10 caracteres para el cliente.'; AppCore.playSound('error'); return; }
    const validation = validateTicket(ticket);
    if (status === 'Aprobada' && !validation.eligible) { error.textContent = 'No se puede aprobar: el ticket no cumple todos los requisitos básicos de garantía.'; AppCore.playSound('warning'); return; }
    const now = new Date().toISOString();
    ticket.status = status;
    ticket.adminResponse = message;
    ticket.reviewedBy = session.id;
    ticket.reviewedByName = session.name;
    ticket.updatedAt = now;
    ticket.messages = Array.isArray(ticket.messages) ? ticket.messages : [];
    ticket.messages.push({ id: AppCore.createId('MSG'), authorRole: 'administrador', authorName: session.name, text: message, createdAt: now, status });
    AppCore.write(AppCore.KEYS.warrantyTickets, tickets);
    AppCore.addActivity('Garantía', `${session.name} respondió ${ticket.id}: ${status}`);
    AppCore.closeModal('ticket-detail-modal');
    AppCore.showToast(`El ticket ${ticket.id} quedó en estado ${status}.`, 'success', 'Respuesta registrada');
    load();
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', GarantiasApp.init);
