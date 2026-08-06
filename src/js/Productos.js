/* ==========================================================
   PRODUCTOS.JS
   ----------------------------------------------------------
   CRUD completo de productos almacenado en LocalStorage.
   Misma STORAGE_KEY que dashboard.js para compartir los datos
   entre ambos módulos sin backend.

   Estructura de un producto:
   {
     id: string (identificador único interno, distinto del código),
     codigo: string,
     nombre: string,
     categoria: string,
     descripcion: string,
     precio: number,
     cantidad: number,
     estado: 'Activo' | 'Inactivo',
     fecha: string (ISO)
   }
=========================================================== */

const STORAGE_KEY = 'erp_productos';

// Estado en memoria: se mantiene sincronizado con LocalStorage en
// cada operación de escritura (create/update/delete).
let products = [];

// Id del producto que se está eliminando (para el modal de confirmación)
let productIdPendingDelete = null;

/* ==========================================================
   PERSISTENCIA EN LOCALSTORAGE
=========================================================== */
function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error leyendo LocalStorage:', err);
    return [];
  }
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

/**
 * Genera un identificador único simple, suficiente para este
 * contexto (no requiere librerías externas de UUID).
 */
function generateId() {
  return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

/* ==========================================================
   UTILIDADES
=========================================================== */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function formatDate(isoString) {
  if (!isoString) return '--';
  return new Date(isoString).toLocaleDateString('es-ES');
}

function showAlert(message, type = 'success') {
  const box = document.getElementById('alert-box');
  box.textContent = message;
  box.className = `alert-box ${type}`;
  box.classList.remove('hidden');

  // Autodesaparece a los 4 segundos para no saturar la pantalla
  clearTimeout(showAlert._timer);
  showAlert._timer = setTimeout(() => box.classList.add('hidden'), 4000);

  // Llevar la vista arriba para que el usuario vea el mensaje
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ==========================================================
   SIDEBAR (contraer/expandir) — igual que en dashboard.js
=========================================================== */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('toggle-sidebar');
  const toggleMobileBtn = document.getElementById('toggle-sidebar-mobile');

  const savedState = localStorage.getItem('erp_sidebar_collapsed');
  if (savedState === 'true') sidebar.classList.add('collapsed');

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('erp_sidebar_collapsed', sidebar.classList.contains('collapsed'));
  });

  if (toggleMobileBtn) {
    toggleMobileBtn.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));
  }

  document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('¿Deseas cerrar la sesión?')) {
      alert('Sesión cerrada (simulado).');
    }
  });
}

/* ==========================================================
   VALIDACIÓN DEL FORMULARIO
   Se reutiliza tanto para el formulario de registro como para
   el de edición, recibiendo un "prefijo" de ids ('' o 'edit-').
=========================================================== */
function validateForm(prefix, excludeId) {
  const get = (name) => document.getElementById(`${prefix}${name}`);
  const errors = {};

  const codigo = get('codigo').value.trim();
  const nombre = get('nombre').value.trim();
  const categoria = get('categoria').value.trim();
  const descripcion = get('descripcion').value.trim();
  const precio = parseFloat(get('precio').value);
  const cantidad = parseInt(get('cantidad').value, 10);

  if (!codigo) errors.codigo = 'El código es obligatorio.';
  else {
    // Código único: no debe coincidir con otro producto existente,
    // salvo que sea el mismo producto que se está editando.
    const duplicate = products.some(p => p.codigo.toLowerCase() === codigo.toLowerCase() && p.id !== excludeId);
    if (duplicate) errors.codigo = 'Ya existe un producto con este código.';
  }

  if (!nombre) errors.nombre = 'El nombre es obligatorio.';
  if (!categoria) errors.categoria = 'La categoría es obligatoria.';
  if (!descripcion) errors.descripcion = 'La descripción es obligatoria.';

  if (isNaN(precio) || get('precio').value.trim() === '') {
    errors.precio = 'El precio es obligatorio.';
  } else if (precio <= 0) {
    errors.precio = 'El precio debe ser mayor que cero.';
  }

  if (isNaN(cantidad) || get('cantidad').value.trim() === '') {
    errors.cantidad = 'La cantidad es obligatoria.';
  } else if (cantidad < 0) {
    errors.cantidad = 'La cantidad no puede ser negativa.';
  }

  // Pintar errores en pantalla y marcar campos inválidos
  ['codigo', 'nombre', 'categoria', 'precio', 'cantidad', 'descripcion'].forEach(field => {
    const errorEl = document.getElementById(`${prefix}error-${field}`);
    const inputEl = get(field);
    if (errors[field]) {
      errorEl.textContent = errors[field];
      inputEl.classList.add('invalid');
    } else {
      errorEl.textContent = '';
      inputEl.classList.remove('invalid');
    }
  });

  const isValid = Object.keys(errors).length === 0;
  return {
    isValid,
    data: isValid ? {
      codigo, nombre, categoria, descripcion, precio, cantidad,
      estado: get('estado').value
    } : null
  };
}

/* ==========================================================
   FORMULARIO DE REGISTRO (crear nuevo producto)
=========================================================== */
function initCreateForm() {
  const form = document.getElementById('product-form');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { isValid, data } = validateForm('input-', null);
    if (!isValid) {
      showAlert('Revisa los campos marcados en rojo antes de continuar.', 'error');
      return;
    }

    const newProduct = {
      id: generateId(),
      ...data,
      fecha: new Date().toISOString()
    };

    products.push(newProduct);
    saveProducts();

    showAlert(`Producto "${newProduct.nombre}" registrado correctamente.`, 'success');
    form.reset();
    document.getElementById('input-estado').value = 'Activo';

    refreshUI();
  });
}

/* ==========================================================
   EDICIÓN (modal)
=========================================================== */
function openEditModal(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  document.getElementById('edit-id').value = product.id;
  document.getElementById('edit-codigo').value = product.codigo;
  document.getElementById('edit-nombre').value = product.nombre;
  document.getElementById('edit-categoria').value = product.categoria;
  document.getElementById('edit-descripcion').value = product.descripcion;
  document.getElementById('edit-precio').value = product.precio;
  document.getElementById('edit-cantidad').value = product.cantidad;
  document.getElementById('edit-estado').value = product.estado;

  // Limpiar errores de una edición anterior
  ['codigo', 'nombre', 'categoria', 'precio', 'cantidad', 'descripcion'].forEach(field => {
    document.getElementById(`edit-error-${field}`).textContent = '';
    document.getElementById(`edit-${field}`).classList.remove('invalid');
  });

  document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

function initEditModal() {
  document.getElementById('modal-close').addEventListener('click', closeEditModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeEditModal);

  // Cerrar al hacer click fuera de la caja del modal
  document.getElementById('edit-modal').addEventListener('click', (e) => {
    if (e.target.id === 'edit-modal') closeEditModal();
  });

  document.getElementById('edit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const { isValid, data } = validateForm('edit-', id);
    if (!isValid) {
      showAlert('Revisa los campos marcados en rojo antes de guardar.', 'error');
      return;
    }

    const index = products.findIndex(p => p.id === id);
    if (index === -1) return;

    // Se conserva la fecha de registro original; solo se actualizan
    // los datos editables del producto.
    products[index] = { ...products[index], ...data };
    saveProducts();

    showAlert(`Producto "${data.nombre}" actualizado correctamente.`, 'success');
    closeEditModal();
    refreshUI();
  });
}

/* ==========================================================
   ELIMINACIÓN (con modal de confirmación)
=========================================================== */
function openDeleteModal(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  productIdPendingDelete = id;
  document.getElementById('delete-product-name').textContent = product.nombre;
  document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
  productIdPendingDelete = null;
  document.getElementById('delete-modal').classList.add('hidden');
}

function initDeleteModal() {
  document.getElementById('delete-modal-close').addEventListener('click', closeDeleteModal);
  document.getElementById('btn-cancel-delete').addEventListener('click', closeDeleteModal);

  document.getElementById('delete-modal').addEventListener('click', (e) => {
    if (e.target.id === 'delete-modal') closeDeleteModal();
  });

  document.getElementById('btn-confirm-delete').addEventListener('click', () => {
    if (!productIdPendingDelete) return;
    const product = products.find(p => p.id === productIdPendingDelete);
    products = products.filter(p => p.id !== productIdPendingDelete);
    saveProducts();

    showAlert(`Producto "${product ? product.nombre : ''}" eliminado.`, 'success');
    closeDeleteModal();
    refreshUI();
  });
}

/* ==========================================================
   FILTROS DE CATEGORÍA (poblar el <select> dinámicamente)
=========================================================== */
function populateCategoryFilter() {
  const select = document.getElementById('filter-categoria');
  const datalist = document.getElementById('categoria-list');
  const currentValue = select.value;

  const categories = [...new Set(products.map(p => p.categoria))].sort();

  select.innerHTML = '<option value="">Todas las categorías</option>';
  datalist.innerHTML = '';

  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);

    const dataOpt = document.createElement('option');
    dataOpt.value = cat;
    datalist.appendChild(dataOpt);
  });

  // Restaurar selección previa si la categoría sigue existiendo
  if (categories.includes(currentValue)) select.value = currentValue;
}

/* ==========================================================
   RENDERIZADO DE LA TABLA (aplica búsqueda + filtros + orden)
=========================================================== */
function getFilteredProducts() {
  const searchTerm = document.getElementById('search-input').value.trim().toLowerCase();
  const categoryFilter = document.getElementById('filter-categoria').value;
  const statusFilter = document.getElementById('filter-estado').value;
  const sortValue = document.getElementById('sort-select').value;

  let result = [...products];

  if (searchTerm) {
    result = result.filter(p =>
      p.codigo.toLowerCase().includes(searchTerm) ||
      p.nombre.toLowerCase().includes(searchTerm)
    );
  }

  if (categoryFilter) {
    result = result.filter(p => p.categoria === categoryFilter);
  }

  if (statusFilter) {
    result = result.filter(p => p.estado === statusFilter);
  }

  switch (sortValue) {
    case 'nombre-asc':
      result.sort((a, b) => a.nombre.localeCompare(b.nombre));
      break;
    case 'nombre-desc':
      result.sort((a, b) => b.nombre.localeCompare(a.nombre));
      break;
    case 'precio-asc':
      result.sort((a, b) => a.precio - b.precio);
      break;
    case 'precio-desc':
      result.sort((a, b) => b.precio - a.precio);
      break;
    default:
      // Sin ordenar explícitamente: más recientes primero
      result.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  return result;
}

function renderTable() {
  const tbody = document.getElementById('products-body');
  const emptyMsg = document.getElementById('table-empty');
  const filtered = getFilteredProducts();

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    emptyMsg.classList.remove('hidden');
    return;
  }
  emptyMsg.classList.add('hidden');

  filtered.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(p.codigo)}</td>
      <td>${escapeHtml(p.nombre)}</td>
      <td>${escapeHtml(p.categoria)}</td>
      <td>$${Number(p.precio).toFixed(2)}</td>
      <td>${p.cantidad}</td>
      <td><span class="status-pill ${p.estado === 'Activo' ? 'activo' : 'inactivo'}">${p.estado}</span></td>
      <td>${formatDate(p.fecha)}</td>
      <td class="actions-cell">
        <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${p.id}">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${p.id}">🗑️ Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Delegación de eventos: un único listener en el tbody maneja los
 * clicks de todos los botones "Editar" / "Eliminar" generados
 * dinámicamente, evitando tener que re-vincular listeners en cada render.
 */
function initTableActions() {
  document.getElementById('products-body').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const id = btn.dataset.id;
    if (btn.dataset.action === 'edit') openEditModal(id);
    if (btn.dataset.action === 'delete') openDeleteModal(id);
  });
}

/* ==========================================================
   BUSCADOR EN TIEMPO REAL + FILTROS + ORDEN
=========================================================== */
function initTableControls() {
  document.getElementById('search-input').addEventListener('input', renderTable);
  document.getElementById('filter-categoria').addEventListener('change', renderTable);
  document.getElementById('filter-estado').addEventListener('change', renderTable);
  document.getElementById('sort-select').addEventListener('change', renderTable);
}

/* ==========================================================
   REFRESCO GENERAL DE LA INTERFAZ TRAS CUALQUIER CAMBIO
=========================================================== */
function refreshUI() {
  populateCategoryFilter();
  renderTable();
}

/* ==========================================================
   INICIALIZACIÓN GENERAL
=========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  products = loadProducts();

  initSidebar();
  initCreateForm();
  initEditModal();
  initDeleteModal();
  initTableActions();
  initTableControls();

  refreshUI();
});