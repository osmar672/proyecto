/* ==========================================================
   DASHBOARD.JS
   ----------------------------------------------------------
   Lógica del Dashboard Administrativo. Lee los productos desde
   LocalStorage (la misma clave que usa productos.js) para
   calcular las estadísticas y mostrar los productos recientes,
   de forma que ambos módulos comparten una única fuente de
   datos sin necesidad de backend.
=========================================================== */

// Clave de LocalStorage compartida con productos.js. Debe coincidir
// exactamente en ambos archivos para que los datos se sincronicen.
const STORAGE_KEY = 'erp_productos';
const LAST_ACCESS_KEY = 'erp_last_access';

/**
 * Lee la lista de productos guardada en LocalStorage.
 * Si no existe nada aún (primer uso), devuelve un array vacío.
 */
function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error leyendo productos de LocalStorage:', err);
    return [];
  }
}

/* ==========================================================
   SIDEBAR: contraer / expandir
=========================================================== */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('toggle-sidebar');
  const toggleMobileBtn = document.getElementById('toggle-sidebar-mobile');

  // Restaurar estado guardado (contraído o expandido) entre recargas
  const savedState = localStorage.getItem('erp_sidebar_collapsed');
  if (savedState === 'true') {
    sidebar.classList.add('collapsed');
  }

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('erp_sidebar_collapsed', sidebar.classList.contains('collapsed'));
  });

  // En móvil, el botón del topbar abre/cierra el menú como overlay
  if (toggleMobileBtn) {
    toggleMobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }
}

/* ==========================================================
   RELOJ Y FECHA EN TIEMPO REAL
=========================================================== */
function initClock() {
  const dateEl = document.getElementById('current-date');
  const timeEl = document.getElementById('current-time');

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  function tick() {
    const now = new Date();
    dateEl.textContent = `${dayNames[now.getDay()]}, ${now.getDate()} de ${monthNames[now.getMonth()]}`;
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    timeEl.textContent = `${h}:${m}:${s}`;
  }

  tick();
  setInterval(tick, 1000); // se actualiza cada segundo
}

/* ==========================================================
   ÚLTIMO ACCESO
   Se guarda la fecha/hora actual como "último acceso" al cargar
   el dashboard, y se muestra el valor previo (el de la sesión
   anterior), simulando el comportamiento típico de un sistema real.
=========================================================== */
function initLastAccess() {
  const lastAccessEl = document.getElementById('last-access');
  const previous = localStorage.getItem(LAST_ACCESS_KEY);

  lastAccessEl.textContent = previous
    ? new Date(previous).toLocaleString('es-ES')
    : 'Primer acceso';

  localStorage.setItem(LAST_ACCESS_KEY, new Date().toISOString());
}

/* ==========================================================
   ANIMACIÓN DE CONTADORES (números que "suben" al cargar)
=========================================================== */
function animateCounter(el, target, duration = 900) {
  const start = 0;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    // easeOutQuad para que la animación desacelere al final
    const eased = 1 - (1 - progress) * (1 - progress);
    const value = Math.round(start + (target - start) * eased);
    el.textContent = value;
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = target;
    }
  }
  requestAnimationFrame(step);
}

/* ==========================================================
   CÁLCULO Y RENDERIZADO DE ESTADÍSTICAS
=========================================================== */
function renderStats(products) {
  const total = products.length;
  const activos = products.filter(p => p.estado === 'Activo').length;
  const agotados = products.filter(p => Number(p.cantidad) === 0).length;
  const categorias = new Set(products.map(p => p.categoria)).size;

  animateCounter(document.getElementById('stat-total'), total);
  animateCounter(document.getElementById('stat-active'), activos);
  animateCounter(document.getElementById('stat-outofstock'), agotados);
  animateCounter(document.getElementById('stat-categories'), categorias);

  // Notificaciones simples basadas en productos agotados
  renderNotifications(products.filter(p => Number(p.cantidad) === 0));
}

/* ==========================================================
   NOTIFICACIONES (dropdown del icono de campana)
=========================================================== */
function renderNotifications(outOfStockProducts) {
  const list = document.getElementById('notif-list');
  const badge = document.getElementById('notif-badge');

  list.innerHTML = '';

  if (outOfStockProducts.length === 0) {
    list.innerHTML = '<p class="notif-empty">Sin notificaciones nuevas</p>';
    badge.classList.add('hidden');
    return;
  }

  badge.textContent = outOfStockProducts.length;
  badge.classList.remove('hidden');

  outOfStockProducts.forEach(p => {
    const item = document.createElement('div');
    item.className = 'notif-item';
    item.textContent = `⚠️ "${p.nombre}" está agotado`;
    list.appendChild(item);
  });
}

function initNotifications() {
  const btn = document.getElementById('notif-btn');
  const dropdown = document.getElementById('notif-dropdown');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });

  // Cerrar el dropdown al hacer click fuera de él
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== btn) {
      dropdown.classList.add('hidden');
    }
  });
}

/* ==========================================================
   TABLA DE PRODUCTOS RECIENTES
   Muestra los últimos 5 productos registrados, ordenados por
   fecha de registro descendente.
=========================================================== */
function renderRecentProducts(products) {
  const tbody = document.getElementById('recent-products-body');
  const emptyMsg = document.getElementById('recent-empty');
  tbody.innerHTML = '';

  if (products.length === 0) {
    emptyMsg.classList.remove('hidden');
    return;
  }
  emptyMsg.classList.add('hidden');

  const recent = [...products]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  recent.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(p.codigo)}</td>
      <td>${escapeHtml(p.nombre)}</td>
      <td>${escapeHtml(p.categoria)}</td>
      <td>$${Number(p.precio).toFixed(2)}</td>
      <td>${p.cantidad}</td>
      <td><span class="status-pill ${p.estado === 'Activo' ? 'activo' : 'inactivo'}">${p.estado}</span></td>
      <td>${formatDate(p.fecha)}</td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Escapa caracteres HTML para prevenir inyección al insertar texto
 * de usuario directamente con innerHTML.
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function formatDate(isoString) {
  if (!isoString) return '--';
  const d = new Date(isoString);
  return d.toLocaleDateString('es-ES');
}

/* ==========================================================
   BUSCADOR GLOBAL (filtra la tabla de productos recientes)
=========================================================== */
function initSearch(products) {
  const input = document.getElementById('global-search');
  input.addEventListener('input', () => {
    const term = input.value.trim().toLowerCase();
    const filtered = term
      ? products.filter(p => p.nombre.toLowerCase().includes(term) || p.codigo.toLowerCase().includes(term))
      : products;
    renderRecentProducts(filtered);
  });
}

/* ==========================================================
   CERRAR SESIÓN (simulado, solo limpia el estado visual)
=========================================================== */
function initLogout() {
  document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('¿Deseas cerrar la sesión?')) {
      alert('Sesión cerrada (simulado). En un sistema real esto redirigiría al login.');
    }
  });
}

/* ==========================================================
   INICIALIZACIÓN GENERAL
=========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initClock();
  initLastAccess();
  initNotifications();
  initLogout();

  const products = loadProducts();
  renderStats(products);
  renderRecentProducts(products);
  initSearch(products);
});