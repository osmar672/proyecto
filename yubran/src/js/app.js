'use strict';

const AppCore = (() => {
  const KEYS = Object.freeze({
    users: 'novaadmin_users',
    session: 'novaadmin_session',
    clients: 'novaadmin_clients',
    products: 'novaadmin_products',
    suppliers: 'novaadmin_suppliers',
    activities: 'novaadmin_activities',
    settings: 'novaadmin_settings',
    carts: 'novaadmin_carts',
    orders: 'novaadmin_orders',
    supplierApplications: 'novaadmin_supplier_applications',
    returns: 'novaadmin_returns',
    warrantyTickets: 'novaadmin_warranty_tickets'
  });

  const DEFAULT_USERS = [
    {
      id: 'USR-ADMIN-001',
      name: 'Andrea Solano',
      email: 'admin@nova.cr',
      passwordHash: '0a5bc3e342432f1bad92ffd51b785343ec72906cdba6a26131060b008e786656',
      role: 'administrador',
      active: true,
      identification: '1-1111-1111',
      phone: '88880001',
      createdAt: '2026-07-01T14:00:00.000Z'
    },
    {
      id: 'USR-CLIENT-001',
      name: 'María Fernández',
      email: 'cliente@nova.cr',
      passwordHash: 'ff3317ed92af000942897760a1cdad0920e8f3fdb42f7d29a4e0c4843598a30c',
      role: 'cliente',
      active: true,
      identification: '1-2222-2222',
      phone: '88880002',
      createdAt: '2026-07-02T14:00:00.000Z'
    }
  ];

  const SEED_CLIENTS = [
    { id: 'CLI-001', name: 'Sofía Jiménez', identification: '1-1456-0789', email: 'sofia@ejemplo.cr', phone: '88881200', province: 'San José', status: 'Activo', notes: 'Cliente corporativo.', createdAt: '2026-07-22T15:30:00.000Z' },
    { id: 'CLI-002', name: 'Marco Vargas', identification: '2-0798-0456', email: 'marco@ejemplo.cr', phone: '87009921', province: 'Alajuela', status: 'Activo', notes: '', createdAt: '2026-07-26T17:10:00.000Z' },
    { id: 'CLI-003', name: 'Valeria Rojas', identification: '3-0555-0912', email: 'valeria@ejemplo.cr', phone: '83124470', province: 'Cartago', status: 'Inactivo', notes: 'Solicitó pausar comunicaciones.', createdAt: '2026-07-29T14:05:00.000Z' }
  ];

  const SEED_SUPPLIERS = [
    { id: 'PROV-001', company: 'TechSupply CR', legalId: '3-101-778899', contact: 'Luis Ramírez', email: 'ventas@techsupply.cr', phone: '22013344', category: 'Tecnología', province: 'San José', status: 'Activo', notes: 'Entrega en 24 horas.', createdAt: '2026-07-18T16:00:00.000Z' },
    { id: 'PROV-002', company: 'OfiMarket', legalId: '3-102-445566', contact: 'Natalia Brenes', email: 'contacto@ofimarket.cr', phone: '24301188', category: 'Oficina', province: 'Alajuela', status: 'Activo', notes: '', createdAt: '2026-07-20T19:20:00.000Z' },
    { id: 'PROV-003', company: 'Redes del Valle', legalId: '3-101-992211', contact: 'Diego Ureña', email: 'soporte@redesvalle.cr', phone: '25508012', category: 'Redes', province: 'Cartago', status: 'Suspendido', notes: 'Pendiente actualización contractual.', createdAt: '2026-07-24T13:15:00.000Z' }
  ];

  const SEED_PRODUCTS = [
    { id: 'PRD-001', code: 'LT-100', name: 'Laptop Empresarial 14”', category: 'Computadoras', price: 525000, stock: 12, supplierId: 'PROV-001', status: 'Activo', description: 'Equipo portátil para trabajo administrativo.', createdAt: '2026-07-23T16:45:00.000Z', updatedAt: '2026-07-23T16:45:00.000Z' },
    { id: 'PRD-002', code: 'MON-240', name: 'Monitor IPS 24”', category: 'Monitores', price: 98500, stock: 4, supplierId: 'PROV-001', status: 'Activo', description: 'Monitor Full HD con conexión HDMI.', createdAt: '2026-07-25T18:15:00.000Z', updatedAt: '2026-07-25T18:15:00.000Z' },
    { id: 'PRD-003', code: 'SW-008', name: 'Switch Gigabit 8 Puertos', category: 'Redes', price: 32600, stock: 2, supplierId: 'PROV-003', status: 'Activo', description: 'Switch no administrable para pequeñas oficinas.', createdAt: '2026-07-27T15:35:00.000Z', updatedAt: '2026-07-27T15:35:00.000Z' },
    { id: 'PRD-004', code: 'TK-500', name: 'Teclado Inalámbrico', category: 'Accesorios', price: 18500, stock: 0, supplierId: 'PROV-002', status: 'Inactivo', description: 'Teclado compacto de bajo perfil.', createdAt: '2026-07-30T20:12:00.000Z', updatedAt: '2026-07-30T20:12:00.000Z' }
  ];

  const safeParse = (value, fallback) => {
    try { return value ? JSON.parse(value) : fallback; }
    catch { return fallback; }
  };

  const read = (key, fallback = []) => safeParse(localStorage.getItem(key), fallback);
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  // Teléfonos: únicamente números y un signo + opcional al inicio.
  const sanitizePhone = value => {
    const raw = String(value || '');
    const startsWithPlus = raw.trim().startsWith('+');
    const digits = raw.replace(/\D/g, '').slice(0, 15);
    return `${startsWithPlus ? '+' : ''}${digits}`;
  };

  const isValidPhone = value => /^\+?\d{8,15}$/.test(String(value || '').trim());

  const setupPhoneInputs = (root = document) => {
    root.querySelectorAll('[data-phone-input]').forEach(input => {
      if (input.dataset.phoneReady === 'true') return;
      input.dataset.phoneReady = 'true';
      input.setAttribute('inputmode', 'tel');
      input.setAttribute('autocomplete', 'tel');
      input.addEventListener('input', () => {
        const clean = sanitizePhone(input.value);
        if (input.value !== clean) input.value = clean;
      });
      input.addEventListener('paste', event => {
        event.preventDefault();
        const pasted = event.clipboardData?.getData('text') || '';
        const clean = sanitizePhone(pasted);
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? start;
        input.value = sanitizePhone(input.value.slice(0, start) + clean + input.value.slice(end));
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
  };

  const initializeData = () => {
    const allowedRoles = ['administrador', 'cliente', 'proveedor'];
    let storedUsers = read(KEYS.users, []);

    if (!storedUsers.length) {
      storedUsers = DEFAULT_USERS;
    } else {
      storedUsers = storedUsers
        .filter(user => user && user.email)
        .map(user => ({
          ...user,
          role: user.role === 'operador' ? 'cliente' : (allowedRoles.includes(user.role) ? user.role : 'cliente'),
          active: user.active !== false,
          phone: sanitizePhone(user.phone),
          createdAt: user.createdAt || new Date().toISOString()
        }));

      if (!storedUsers.some(user => user.role === 'administrador')) {
        storedUsers.push(DEFAULT_USERS[0]);
      }
    }
    write(KEYS.users, storedUsers);

    const storedSession = read(KEYS.session, null);
    if (storedSession && !allowedRoles.includes(storedSession.role)) {
      localStorage.removeItem(KEYS.session);
    }

    if (!localStorage.getItem(KEYS.clients)) {
      write(KEYS.clients, SEED_CLIENTS.map(client => ({ ...client, phone: sanitizePhone(client.phone) })));
    } else {
      const storedClients = read(KEYS.clients, []);
      const migratedClients = storedClients.map(client => ({ ...client, phone: sanitizePhone(client.phone) }));
      if (JSON.stringify(storedClients) !== JSON.stringify(migratedClients)) write(KEYS.clients, migratedClients);
    }
    if (!localStorage.getItem(KEYS.products)) {
      write(KEYS.products, SEED_PRODUCTS.map(product => ({ ...product, images: [] })));
    } else {
      const storedProducts = read(KEYS.products, []);
      const migratedProducts = storedProducts.map(product => ({
        ...product,
        images: Array.isArray(product.images)
          ? product.images.filter(image => typeof image === 'string' && /^data:image\/(jpeg|png|webp);base64,/i.test(image)).slice(0, 4)
          : []
      }));
      if (JSON.stringify(storedProducts) !== JSON.stringify(migratedProducts)) write(KEYS.products, migratedProducts);
    }
    if (!localStorage.getItem(KEYS.suppliers)) {
      write(KEYS.suppliers, SEED_SUPPLIERS.map(supplier => ({ ...supplier, phone: sanitizePhone(supplier.phone) })));
    } else {
      const storedSuppliers = read(KEYS.suppliers, []);
      const migratedSuppliers = storedSuppliers.map(supplier => ({ ...supplier, phone: sanitizePhone(supplier.phone) }));
      if (JSON.stringify(storedSuppliers) !== JSON.stringify(migratedSuppliers)) write(KEYS.suppliers, migratedSuppliers);
    }
    if (!localStorage.getItem(KEYS.carts)) write(KEYS.carts, {});
    if (!localStorage.getItem(KEYS.orders)) write(KEYS.orders, []);
    if (!localStorage.getItem(KEYS.returns)) write(KEYS.returns, []);
    if (!localStorage.getItem(KEYS.warrantyTickets)) write(KEYS.warrantyTickets, []);
    if (!localStorage.getItem(KEYS.supplierApplications)) {
      write(KEYS.supplierApplications, []);
    } else {
      const storedApplications = read(KEYS.supplierApplications, []);
      const migratedApplications = storedApplications.map(application => ({ ...application, phone: sanitizePhone(application.phone) }));
      if (JSON.stringify(storedApplications) !== JSON.stringify(migratedApplications)) write(KEYS.supplierApplications, migratedApplications);
    }
    if (!localStorage.getItem(KEYS.activities)) {
      write(KEYS.activities, [
        { id: createId('ACT'), type: 'Sistema', description: 'Datos de demostración inicializados', date: new Date().toISOString() }
      ]);
    }
    if (!localStorage.getItem(KEYS.settings)) write(KEYS.settings, { theme: 'light', sound: true, sidebarCollapsed: false });
    applyTheme();
  };

  const createId = prefix => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  const normalize = value => String(value ?? '').trim().toLowerCase();
  const formatCurrency = value => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(Number(value) || 0);
  const formatDate = value => value ? new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Sin fecha';
  const initials = name => String(name || 'Usuario').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();

  const ICONS = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
    box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
    truck: '<path d="M10 17h4V5H2v12h3"/><path d="M14 9h4l4 4v4h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    volume2: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"/>',
    volumeX: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="m16 9 6 6M22 9l-6 6"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    circleOff: '<circle cx="12" cy="12" r="9"/><path d="m8 8 8 8"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    alertTriangle: '<path d="M10.3 3.7 2.4 17.4A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.7-2.6L13.7 3.7a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    alertCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>',
    eyeOff: '<path d="m3 3 18 18M10.7 10.7a2 2 0 0 0 2.6 2.6M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a16 16 0 0 1-2.1 3.1M6.6 6.6C3.7 8.5 2 12 2 12s3.5 8 10 8a10.4 10.4 0 0 0 4.2-.9"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    shieldCheck: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    ticket: '<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Z"/><path d="M13 5v2M13 10v4M13 17v2"/>',
    messageSquare: '<rect x="3" y="4" width="18" height="14" rx="3"/><path d="m8 18-3 3v-3"/><path d="M7 9h10M7 13h7"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/>',
    rotateCcw: '<path d="M3 2v6h6"/><path d="M3.5 8a9 9 0 1 1 2.1 9.4"/>',
    shoppingCart: '<circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M3 4h2l2.4 10.1a2 2 0 0 0 2 1.5h7.9a2 2 0 0 0 2-1.6L21 8H7"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 15-5-5L5 20"/>',
    camera: '<path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3z"/><circle cx="12" cy="13" r="3"/>',
    smartphone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
    creditCard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    landmark: '<path d="m3 10 9-6 9 6"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18M2 18h20"/>',
    wallet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v10H5a3 3 0 0 1-3-3V6"/><path d="M16 13h2"/>',
    minus: '<path d="M5 12h14"/>',
    receipt: '<path d="M6 2v20l3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2z"/><path d="M9 9h6M9 13h6"/>',
    filterX: '<path d="M4 5h16l-6 7v5l-4 2v-7z"/><path d="m17 17 4 4M21 17l-4 4"/>',
    dollarSign: '<circle cx="12" cy="12" r="9"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 6v12"/>',
    refreshCw: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5M3 12A9 9 0 0 1 18.5 5.8L21 8"/><path d="M21 3v5h-5"/>',
    userPlus: '<path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8" cy="7" r="4"/><path d="M19 8v6M16 11h6"/>',
    store: '<path d="M3 9 5 3h14l2 6"/><path d="M5 13v8h14v-8"/><path d="M9 21v-6h6v6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>',
    printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    clipboardCheck: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2M9 13l2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    bot: '<rect x="4" y="7" width="16" height="12" rx="3"/><path d="M12 3v4M8 12h.01M16 12h.01M8 16h8"/>',
    brain: '<path d="M9.5 4.5A3 3 0 0 0 4 6.2a3.2 3.2 0 0 0 .6 6.2A3.5 3.5 0 0 0 9.5 18V4.5ZM14.5 4.5A3 3 0 0 1 20 6.2a3.2 3.2 0 0 1-.6 6.2A3.5 3.5 0 0 1 14.5 18V4.5ZM9.5 9H7M14.5 9H17M9.5 14H7.5M14.5 14h2"/>',
    send: '<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4Z"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M18 5l2 2M15 8l2 2"/>',
    bag: '<path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
    rotateLeft: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    sparkles: '<path d="m12 3-1.2 3.3L7.5 7.5l3.3 1.2L12 12l1.2-3.3 3.3-1.2-3.3-1.2L12 3ZM5 14l-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8L5 14ZM19 13l-.8 2.2L16 16l2.2.8L19 19l.8-2.2L22 16l-2.2-.8L19 13Z"/>',
    volume1: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15 9.5a4 4 0 0 1 0 5"/>'
  };

  const icon = (name, extraClass = '') => {
    const paths = ICONS[name] || ICONS.info;
    const className = ['ui-icon', extraClass].filter(Boolean).join(' ');
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
  };

  const renderIcons = (root = document) => {
    root.querySelectorAll('[data-icon]').forEach(element => {
      element.innerHTML = icon(element.dataset.icon, element.dataset.iconClass || '');
    });
  };

  const getSettings = () => read(KEYS.settings, { theme: 'light', sound: true, sidebarCollapsed: false });
  const saveSettings = settings => write(KEYS.settings, settings);
  const applyTheme = () => {
    const settings = getSettings();
    document.documentElement.dataset.theme = settings.theme === 'dark' ? 'dark' : 'light';
  };

  const toggleTheme = () => {
    const settings = getSettings();
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    saveSettings(settings);
    applyTheme();
    const button = document.getElementById('theme-toggle');
    if (button) button.innerHTML = icon(settings.theme === 'dark' ? 'sun' : 'moon');
    playSound('click');
  };

  const toggleSound = () => {
    const settings = getSettings();
    settings.sound = !settings.sound;
    saveSettings(settings);
    const button = document.getElementById('sound-toggle');
    if (button) {
      button.setAttribute('aria-pressed', String(settings.sound));
      button.innerHTML = icon(settings.sound ? 'volume2' : 'volumeX');
    }
    if (settings.sound) playSound('success');
  };

  const SOUND_FILES = Object.freeze({
    click: 'click.wav',
    success: 'success.wav',
    error: 'error.wav',
    warning: 'warning.wav',
    info: 'notification.wav'
  });

  const playFallbackTone = type => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const presets = {
        success: [660, 880, .16],
        error: [220, 150, .2],
        warning: [420, 360, .18],
        info: [520, 700, .12],
        click: [620, 680, .08]
      };
      const [start, end, duration] = presets[type] || presets.click;
      oscillator.type = type === 'error' ? 'sawtooth' : 'sine';
      oscillator.frequency.setValueAtTime(start, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(end, context.currentTime + duration);
      gain.gain.setValueAtTime(.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.18, context.currentTime + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
      oscillator.addEventListener('ended', () => context.close());
    } catch { /* El audio es una mejora visual/sonora y no bloquea el sistema. */ }
  };

  const playSound = type => {
    if (!getSettings().sound) return;
    const soundType = SOUND_FILES[type] ? type : 'click';
    try {
      const url = new URL(`../src/audio/${SOUND_FILES[soundType]}`, window.location.href).href;
      const audio = new Audio(url);
      audio.volume = .42;
      const promise = audio.play();
      if (promise?.catch) promise.catch(() => playFallbackTone(soundType));
    } catch {
      playFallbackTone(soundType);
    }
  };

  const hashPassword = async password => {
    const data = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const getSession = () => read(KEYS.session, null);
  const setSession = user => write(KEYS.session, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    linkedSupplierId: user.linkedSupplierId || null,
    loginAt: new Date().toISOString()
  });
  const clearSession = () => localStorage.removeItem(KEYS.session);

  const login = async (email, password) => {
    const users = read(KEYS.users, []);
    const passwordHash = await hashPassword(password);
    const user = users.find(item => normalize(item.email) === normalize(email) && item.passwordHash === passwordHash);
    if (!user) return { ok: false, message: 'El correo o la contraseña son incorrectos.' };
    if (!user.active) return { ok: false, message: 'La cuenta está inactiva. Contacte al administrador.' };
    setSession(user);
    addActivity('Autenticación', `${user.name} inició sesión`);
    return { ok: true, user };
  };

  const requireAuth = () => {
    initializeData();
    const session = getSession();
    if (!session) {
      window.location.replace('index.html');
      return null;
    }
    return session;
  };

  const logout = () => {
    const session = getSession();
    if (session) addActivity('Autenticación', `${session.name} cerró sesión`);
    clearSession();
    playSound('click');
    window.location.replace('index.html');
  };

  const canManage = () => getSession()?.role === 'administrador';
  const canDelete = canManage;
  const roleLabel = role => role === 'administrador' ? 'Administrador' : role === 'cliente' ? 'Cliente' : role === 'proveedor' ? 'Proveedor' : 'Usuario';
  const getHomePage = role => ['cliente', 'proveedor'].includes(role) ? 'Productos.html' : 'Dashboard.html';
  const canAccessPage = (role, page) => role === 'administrador' || (role === 'cliente' && ['productos', 'assistant', 'warranties'].includes(page)) || (role === 'proveedor' && ['productos', 'assistant'].includes(page));
  const canShop = () => getSession()?.role === 'cliente';

  const addActivity = (type, description) => {
    const activities = read(KEYS.activities, []);
    activities.unshift({ id: createId('ACT'), type, description, date: new Date().toISOString() });
    write(KEYS.activities, activities.slice(0, 40));
  };

  const showToast = (message, type = 'success', title) => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const labels = { success: 'Operación completada', error: 'No se pudo completar', warning: 'Atención', info: 'Información' };
    const icons = { success: 'checkCircle', error: 'alertCircle', warning: 'alertTriangle', info: 'info' };
    const toast = document.createElement('article');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${icon(icons[type] || icons.info)}</span>
      <div><strong>${escapeHtml(title || labels[type] || labels.info)}</strong><small>${escapeHtml(message)}</small></div>
      <button class="toast-close" type="button" aria-label="Cerrar notificación">${icon('x')}</button>`;
    container.appendChild(toast);
    playSound(type === 'info' ? 'click' : type);
    const close = () => toast.remove();
    toast.querySelector('.toast-close').addEventListener('click', close);
    setTimeout(close, 4400);
  };

  const openModal = id => {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    const focusable = modal.querySelector('input:not([type="hidden"]), select, textarea, button');
    setTimeout(() => focusable?.focus(), 80);
  };

  const closeModal = id => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal-backdrop.open')) document.body.classList.remove('modal-open');
  };

  const setupModalClosers = () => {
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      if (backdrop.parentElement !== document.body) document.body.appendChild(backdrop);
    });
    renderIcons(document);
    document.querySelectorAll('[data-close-modal]').forEach(button => {
      button.addEventListener('click', () => closeModal(button.dataset.closeModal));
    });
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', event => {
        if (event.target === backdrop) closeModal(backdrop.id);
      });
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') document.querySelectorAll('.modal-backdrop.open').forEach(modal => closeModal(modal.id));
    });
  };

  const initShell = activePage => {
    const session = requireAuth();
    if (!session) return null;

    if (!canAccessPage(session.role, activePage)) {
      window.location.replace(getHomePage(session.role));
      return null;
    }

    const settings = getSettings();
    const sidebar = document.getElementById('sidebar');
    if (settings.sidebarCollapsed) sidebar?.classList.add('collapsed');

    document.querySelectorAll('[data-nav]').forEach(link => {
      const allowedForLimitedRole = session.role === 'cliente' ? ['productos', 'assistant', 'warranties'] : ['productos', 'assistant'];
      const restricted = ['cliente', 'proveedor'].includes(session.role) && !allowedForLimitedRole.includes(link.dataset.nav);
      link.classList.toggle('hidden', restricted);
      link.classList.toggle('active', link.dataset.nav === activePage);
    });

    if (['cliente', 'proveedor'].includes(session.role)) {
      const brand = document.querySelector('.brand');
      if (brand) brand.setAttribute('href', 'Productos.html');
    }

    document.querySelectorAll('[data-user-name]').forEach(element => element.textContent = session.name);
    document.querySelectorAll('[data-user-role]').forEach(element => element.textContent = roleLabel(session.role));
    document.querySelectorAll('[data-user-avatar]').forEach(element => element.textContent = initials(session.name));

    const themeButton = document.getElementById('theme-toggle');
    if (themeButton) {
      themeButton.innerHTML = icon(settings.theme === 'dark' ? 'sun' : 'moon');
      themeButton.addEventListener('click', toggleTheme);
    }
    const soundButton = document.getElementById('sound-toggle');
    if (soundButton) {
      soundButton.innerHTML = icon(settings.sound ? 'volume2' : 'volumeX');
      soundButton.setAttribute('aria-pressed', String(settings.sound));
      soundButton.addEventListener('click', toggleSound);
    }
    document.getElementById('logout-button')?.addEventListener('click', logout);
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      sidebar?.classList.toggle('collapsed');
      const current = getSettings();
      current.sidebarCollapsed = sidebar?.classList.contains('collapsed') || false;
      saveSettings(current);
      playSound('click');
    });
    document.getElementById('mobile-menu-button')?.addEventListener('click', () => sidebar?.classList.toggle('mobile-open'));
    document.addEventListener('click', event => {
      if (window.innerWidth <= 820 && sidebar?.classList.contains('mobile-open') && !sidebar.contains(event.target) && !event.target.closest('#mobile-menu-button')) sidebar.classList.remove('mobile-open');
    });
    setupModalClosers();
    renderIcons(document);
    return session;
  };

  const emailExists = email => {
    const normalized = normalize(email);
    const users = read(KEYS.users, []);
    const applications = read(KEYS.supplierApplications, []);
    return users.some(user => normalize(user.email) === normalized) ||
      applications.some(application => normalize(application.email) === normalized && application.status !== 'Rechazada');
  };

  const registerClient = async data => {
    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim().toLowerCase();
    const password = String(data.password || '');
    const phone = sanitizePhone(data.phone);
    if (name.length < 3) return { ok: false, message: 'Ingrese un nombre válido.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: 'Ingrese un correo válido.' };
    if (phone && !isValidPhone(phone)) return { ok: false, message: 'El teléfono debe contener solo números y un + opcional al inicio.' };
    if (password.length < 8) return { ok: false, message: 'La contraseña debe tener al menos 8 caracteres.' };
    if (emailExists(email)) return { ok: false, message: 'Ya existe una cuenta o solicitud con este correo.' };

    const users = read(KEYS.users, []);
    const user = {
      id: createId('USR'),
      name,
      email,
      phone,
      identification: String(data.identification || '').trim(),
      passwordHash: await hashPassword(password),
      role: 'cliente',
      active: true,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    write(KEYS.users, users);
    addActivity('Usuario', `${user.name} creó una cuenta de cliente`);
    return { ok: true, user };
  };

  const submitSupplierApplication = async data => {
    const company = String(data.company || '').trim();
    const legalId = String(data.legalId || '').trim();
    const contact = String(data.contact || '').trim();
    const email = String(data.email || '').trim().toLowerCase();
    const phone = sanitizePhone(data.phone);
    const category = String(data.category || '').trim();
    const province = String(data.province || '').trim();
    const password = String(data.password || '');

    if (company.length < 3 || contact.length < 3) return { ok: false, message: 'Complete correctamente la empresa y persona de contacto.' };
    if (!/^[0-9-]{8,22}$/.test(legalId)) return { ok: false, message: 'Ingrese una cédula jurídica válida.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: 'Ingrese un correo válido.' };
    if (!isValidPhone(phone)) return { ok: false, message: 'El teléfono debe contener solo números y un + opcional al inicio.' };
    if (!category || !province) return { ok: false, message: 'Complete la categoría y provincia.' };
    if (password.length < 8) return { ok: false, message: 'La contraseña debe tener al menos 8 caracteres.' };
    if (emailExists(email)) return { ok: false, message: 'Ya existe una cuenta o solicitud con este correo.' };

    const applications = read(KEYS.supplierApplications, []);
    if (applications.some(application => normalize(application.legalId) === normalize(legalId) && application.status === 'Pendiente')) {
      return { ok: false, message: 'Ya existe una solicitud pendiente con esta cédula jurídica.' };
    }

    const application = {
      id: createId('SOL'),
      company,
      legalId,
      contact,
      email,
      phone,
      category,
      province,
      notes: String(data.notes || '').trim(),
      passwordHash: await hashPassword(password),
      status: 'Pendiente',
      createdAt: new Date().toISOString(),
      reviewedAt: null
    };
    applications.unshift(application);
    write(KEYS.supplierApplications, applications);
    addActivity('Proveedor', `${company} envió una solicitud de registro`);
    return { ok: true, application };
  };

  const approveSupplierApplication = id => {
    const applications = read(KEYS.supplierApplications, []);
    const application = applications.find(item => item.id === id);
    if (!application || application.status !== 'Pendiente') return { ok: false, message: 'La solicitud ya fue procesada o no existe.' };

    const users = read(KEYS.users, []);
    const suppliers = read(KEYS.suppliers, []);
    if (users.some(user => normalize(user.email) === normalize(application.email))) return { ok: false, message: 'Ya existe un usuario con ese correo.' };
    if (suppliers.some(supplier => normalize(supplier.legalId) === normalize(application.legalId))) return { ok: false, message: 'Ya existe un proveedor con esa cédula jurídica.' };

    const supplier = {
      id: createId('PROV'),
      company: application.company,
      legalId: application.legalId,
      contact: application.contact,
      email: application.email,
      phone: application.phone,
      category: application.category,
      province: application.province,
      status: 'Activo',
      notes: application.notes || 'Proveedor aprobado desde el formulario público.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    suppliers.push(supplier);

    const user = {
      id: createId('USR'),
      name: application.contact,
      email: application.email,
      phone: application.phone,
      identification: application.legalId,
      passwordHash: application.passwordHash,
      role: 'proveedor',
      active: true,
      linkedSupplierId: supplier.id,
      createdAt: new Date().toISOString()
    };
    users.push(user);

    application.status = 'Aprobada';
    application.reviewedAt = new Date().toISOString();
    application.linkedSupplierId = supplier.id;
    application.linkedUserId = user.id;

    write(KEYS.users, users);
    write(KEYS.suppliers, suppliers);
    write(KEYS.supplierApplications, applications);
    addActivity('Proveedor', `${application.company} fue aprobado como proveedor`);
    return { ok: true, supplier, user };
  };

  const rejectSupplierApplication = id => {
    const applications = read(KEYS.supplierApplications, []);
    const application = applications.find(item => item.id === id);
    if (!application || application.status !== 'Pendiente') return { ok: false, message: 'La solicitud ya fue procesada o no existe.' };
    application.status = 'Rechazada';
    application.reviewedAt = new Date().toISOString();
    write(KEYS.supplierApplications, applications);
    addActivity('Proveedor', `${application.company} fue rechazado como proveedor`);
    return { ok: true, application };
  };

  const printReport = (title, columns, rows) => {
    const reportWindow = window.open('', '_blank', 'width=1100,height=760');
    if (!reportWindow) {
      showToast('El navegador bloqueó la ventana de impresión. Permita ventanas emergentes e intente nuevamente.', 'warning');
      return;
    }
    const printedAt = new Intl.DateTimeFormat('es-CR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date());
    const header = columns.map(column => `<th>${escapeHtml(column.label)}</th>`).join('');
    const body = rows.length
      ? rows.map(row => `<tr>${columns.map(column => `<td>${escapeHtml(typeof column.value === 'function' ? column.value(row) : row[column.key] ?? '')}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${columns.length}">No hay datos para imprimir.</td></tr>`;
    reportWindow.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111827;margin:28px}header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #4f46e5;padding-bottom:14px;margin-bottom:20px}h1{font-size:22px;margin:0}p{margin:5px 0;color:#64748b;font-size:12px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;vertical-align:top}th{background:#eef2ff;color:#312e81}tr:nth-child(even){background:#f8fafc}.report-brand{font-weight:800;color:#4f46e5}.no-print{margin:18px 0;padding:10px 14px;border:0;border-radius:8px;background:#4f46e5;color:white;font-weight:700;cursor:pointer}@page{size:landscape;margin:12mm}@media print{.no-print{display:none}body{margin:0}}
    </style></head><body><header><div><div class="report-brand">NovaAdmin CR</div><h1>${escapeHtml(title)}</h1><p>Generado: ${escapeHtml(printedAt)}</p></div><div><p>Reporte académico del sistema administrativo</p></div></header><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table><button class="no-print" onclick="window.print()">Imprimir / Guardar como PDF</button><script>setTimeout(()=>window.print(),350)<\/script></body></html>`);
    reportWindow.document.close();
    playSound('click');
  };

  const updateOwnProfile = data => {
    const session = getSession();
    if (!session) return { ok: false, message: 'No hay una sesión activa.' };
    const users = read(KEYS.users, []);
    const user = users.find(item => item.id === session.id);
    if (!user) return { ok: false, message: 'No se encontró la cuenta autenticada.' };

    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim().toLowerCase();
    const phone = sanitizePhone(data.phone);
    if (name.length < 3) return { ok: false, message: 'Ingrese un nombre válido.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: 'Ingrese un correo válido.' };
    if (phone && !isValidPhone(phone)) return { ok: false, message: 'El teléfono debe contener solo números y un + opcional al inicio.' };
    if (users.some(item => item.id !== user.id && normalize(item.email) === normalize(email))) return { ok: false, message: 'Ese correo ya pertenece a otra cuenta.' };

    user.name = name;
    user.email = email;
    user.phone = phone;
    user.updatedAt = new Date().toISOString();
    write(KEYS.users, users);

    if (user.role === 'proveedor' && user.linkedSupplierId) {
      const suppliers = read(KEYS.suppliers, []);
      const supplier = suppliers.find(item => item.id === user.linkedSupplierId);
      if (supplier) {
        supplier.contact = name;
        supplier.email = email;
        supplier.phone = phone;
        supplier.updatedAt = new Date().toISOString();
        write(KEYS.suppliers, suppliers);
      }
    }

    write(KEYS.session, { ...session, name, email, role: user.role, linkedSupplierId: user.linkedSupplierId || null });
    addActivity('Usuario', `${name} actualizó su perfil`);
    return { ok: true, user };
  };

  const changeOwnPassword = async (currentPassword, newPassword) => {
    const session = getSession();
    if (!session) return { ok: false, message: 'No hay una sesión activa.' };
    if (String(newPassword || '').length < 8) return { ok: false, message: 'La nueva contraseña debe tener al menos 8 caracteres.' };
    const users = read(KEYS.users, []);
    const user = users.find(item => item.id === session.id);
    if (!user) return { ok: false, message: 'No se encontró la cuenta autenticada.' };
    const currentHash = await hashPassword(String(currentPassword || ''));
    if (currentHash !== user.passwordHash) return { ok: false, message: 'La contraseña actual es incorrecta.' };
    const newHash = await hashPassword(String(newPassword || ''));
    if (newHash === user.passwordHash) return { ok: false, message: 'La nueva contraseña debe ser diferente a la actual.' };
    user.passwordHash = newHash;
    user.updatedAt = new Date().toISOString();
    write(KEYS.users, users);
    addActivity('Autenticación', `${user.name} cambió su contraseña`);
    return { ok: true };
  };

  const resetDemoData = () => {
    write(KEYS.users, DEFAULT_USERS);
    write(KEYS.clients, SEED_CLIENTS);
    write(KEYS.products, SEED_PRODUCTS.map(product => ({ ...product, images: [] })));
    write(KEYS.suppliers, SEED_SUPPLIERS);
    write(KEYS.supplierApplications, []);
    write(KEYS.carts, {});
    write(KEYS.orders, []);
    write(KEYS.returns, []);
    write(KEYS.warrantyTickets, []);
    write(KEYS.activities, [{ id: createId('ACT'), type: 'Sistema', description: 'Datos de demostración restaurados', date: new Date().toISOString() }]);
    showToast('Los usuarios, productos, proveedores y solicitudes volvieron a su estado inicial.', 'success');
  };

  initializeData();
  document.addEventListener('DOMContentLoaded', () => { renderIcons(document); setupPhoneInputs(document); });

  return {
    KEYS, read, write, initializeData, createId, escapeHtml, normalize, formatCurrency, formatDate, initials,
    hashPassword, login, getSession, requireAuth, logout, canManage, canDelete, canShop, roleLabel, getHomePage, canAccessPage,
    registerClient, submitSupplierApplication, approveSupplierApplication, rejectSupplierApplication, printReport, updateOwnProfile, changeOwnPassword,
    sanitizePhone, isValidPhone, setupPhoneInputs,
    addActivity, showToast, openModal, closeModal, setupModalClosers, initShell, playSound, getSettings, resetDemoData, icon, renderIcons
  };
})();
