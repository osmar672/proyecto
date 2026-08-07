'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const session = AppCore.initShell('dashboard');
  if (!session) return;

  const users = AppCore.read(AppCore.KEYS.users, []);
  const products = AppCore.read(AppCore.KEYS.products, []);
  const suppliers = AppCore.read(AppCore.KEYS.suppliers, []);
  const activities = AppCore.read(AppCore.KEYS.activities, []);

  document.getElementById('current-date').textContent = new Intl.DateTimeFormat('es-CR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date());

  animateNumber('stat-users', users.length);
  animateNumber('stat-products', products.filter(item => item.status === 'Activo').length);
  animateNumber('stat-suppliers', suppliers.filter(item => item.status === 'Activo').length);
  animateNumber('stat-low-stock', products.filter(item => Number(item.stock) <= 5).length);

  renderStockAlerts(products);
  renderCategoryChart(products);
  renderActivities(activities);

  const resetButton = document.getElementById('reset-demo');
  const resetNote = document.getElementById('admin-reset-note');
  if (!AppCore.canDelete()) {
    resetButton.disabled = true;
    resetNote.classList.remove('hidden');
  }
  resetButton.addEventListener('click', () => {
    if (!AppCore.canDelete()) return;
    if (confirm('¿Desea restaurar los datos de demostración? Se perderán los cambios actuales.')) {
      AppCore.resetDemoData();
      setTimeout(() => window.location.reload(), 500);
    }
  });
});

function animateNumber(id, target) {
  const element = document.getElementById(id);
  const startedAt = performance.now();
  const duration = 750;
  const draw = now => {
    const progress = Math.min((now - startedAt) / duration, 1);
    element.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
    if (progress < 1) requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}

function renderStockAlerts(products) {
  const container = document.getElementById('stock-alerts');
  const lowStock = products.filter(item => Number(item.stock) <= 5).sort((a, b) => Number(a.stock) - Number(b.stock));
  if (!lowStock.length) {
    container.innerHTML = '<p style="margin:0;color:var(--muted)">No hay alertas de inventario. Todos los productos tienen existencias suficientes.</p>';
    return;
  }
  container.innerHTML = lowStock.map(product => `
    <div class="alert-item"><div><strong>${AppCore.escapeHtml(product.name)}</strong><small>${AppCore.escapeHtml(product.code)} · ${product.stock === 0 ? 'Agotado' : `${product.stock} unidades`}</small></div><span class="badge badge-low">${product.stock === 0 ? 'Crítico' : 'Bajo'}</span></div>`).join('');
}

function renderCategoryChart(products) {
  const container = document.getElementById('category-chart');
  const counts = products.reduce((accumulator, product) => {
    const category = product.category || 'Sin categoría';
    accumulator[category] = (accumulator[category] || 0) + 1;
    return accumulator;
  }, {});
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const maximum = Math.max(...entries.map(([, value]) => value), 1);
  if (!entries.length) {
    container.innerHTML = '<p style="margin:0;color:var(--muted)">No hay productos para mostrar.</p>';
    return;
  }
  container.innerHTML = entries.map(([category, value]) => `<div class="chart-row"><span class="chart-label" title="${AppCore.escapeHtml(category)}">${AppCore.escapeHtml(category)}</span><span class="chart-track"><span class="chart-bar" data-width="${Math.round(value / maximum * 100)}"></span></span><span class="chart-value">${value}</span></div>`).join('');
  requestAnimationFrame(() => container.querySelectorAll('.chart-bar').forEach(bar => { bar.style.width = `${bar.dataset.width}%`; }));
}

function renderActivities(activities) {
  const container = document.getElementById('activity-list');
  const iconByType = { Cliente: 'user', Usuario: 'users', Producto: 'box', Proveedor: 'truck', Autenticación: 'lock', Sistema: 'dashboard', Compra: 'shoppingCart' };
  if (!activities.length) {
    container.innerHTML = '<p style="margin:0;color:var(--muted)">Aún no hay actividad registrada.</p>';
    return;
  }
  container.innerHTML = activities.slice(0, 7).map(activity => `
    <div class="activity-item"><span class="activity-icon">${AppCore.icon(iconByType[activity.type] || 'info')}</span><div><strong>${AppCore.escapeHtml(activity.type)}</strong><small>${AppCore.escapeHtml(activity.description)}</small></div><time class="activity-time" datetime="${activity.date}">${AppCore.formatDate(activity.date)}</time></div>`).join('');
}
