'use strict';

const proveedoresApp = CrudController({
  activePage: 'proveedores',
  storageKey: AppCore.KEYS.suppliers,
  entityName: 'Proveedor',
  idPrefix: 'PROV',
  searchFields: ['company', 'legalId', 'contact', 'email', 'phone', 'category', 'province'],
  extraFilterId: 'category-filter',
  extraFilterMatch: (record, value) => record.category === value,
  displayName: record => record.company,
  initialize: () => {
    refreshSupplierCategories();
    document.getElementById('print-suppliers')?.addEventListener('click', printSuppliersReport);
  },
  afterSave: refreshSupplierCategories,
  afterRender: refreshSupplierCategories,
  rowTemplate: record => `
    <tr>
      <td><span class="table-primary">${AppCore.escapeHtml(record.company)}</span><span class="table-secondary">${AppCore.escapeHtml(record.email)}</span></td>
      <td>${AppCore.escapeHtml(record.legalId)}</td>
      <td><span class="table-primary">${AppCore.escapeHtml(record.contact)}</span><span class="table-secondary">${AppCore.escapeHtml(record.phone)}</span></td>
      <td><span class="badge badge-info">${AppCore.escapeHtml(record.category)}</span></td>
      <td>${AppCore.escapeHtml(record.province)}</td>
      <td><span class="badge badge-${record.status.toLowerCase()}">${AppCore.escapeHtml(record.status)}</span></td>
      <td><div class="actions">
        <button class="button button-ghost button-small" data-action="view" data-id="${record.id}" type="button">${AppCore.icon('eye')}<span>Ver</span></button>
        <button class="button button-secondary button-small" data-action="edit" data-id="${record.id}" type="button">${AppCore.icon('edit')}<span>Editar</span></button>
        <button class="button button-danger button-small" data-action="delete" data-id="${record.id}" type="button" ${AppCore.canDelete() ? '' : 'disabled title="Solo el administrador puede eliminar"'}>${AppCore.icon('trash')}<span>Eliminar</span></button>
      </div></td>
    </tr>`,
  detailTemplate: record => `
    <div class="detail-item full"><small>Empresa</small><strong>${AppCore.escapeHtml(record.company)}</strong></div>
    <div class="detail-item"><small>Cédula jurídica</small><strong>${AppCore.escapeHtml(record.legalId)}</strong></div>
    <div class="detail-item"><small>Estado</small><strong>${AppCore.escapeHtml(record.status)}</strong></div>
    <div class="detail-item"><small>Contacto</small><strong>${AppCore.escapeHtml(record.contact)}</strong></div>
    <div class="detail-item"><small>Correo</small><strong>${AppCore.escapeHtml(record.email)}</strong></div>
    <div class="detail-item"><small>Teléfono</small><strong>${AppCore.escapeHtml(record.phone)}</strong></div>
    <div class="detail-item"><small>Categoría</small><strong>${AppCore.escapeHtml(record.category)}</strong></div>
    <div class="detail-item"><small>Provincia</small><strong>${AppCore.escapeHtml(record.province)}</strong></div>
    <div class="detail-item full"><small>Observaciones</small><strong>${AppCore.escapeHtml(record.notes || 'Sin observaciones')}</strong></div>`,
  serializeForm: () => ({
    company: document.getElementById('company').value.trim(),
    legalId: document.getElementById('legalId').value.trim(),
    contact: document.getElementById('contact').value.trim(),
    email: document.getElementById('email').value.trim().toLowerCase(),
    phone: AppCore.sanitizePhone(document.getElementById('phone').value),
    category: document.getElementById('category').value.trim(),
    province: document.getElementById('province').value,
    status: document.getElementById('status').value,
    notes: document.getElementById('notes').value.trim()
  }),
  populateForm: record => {
    ['company','legalId','contact','email','phone','category','province','status','notes'].forEach(field => {
      document.getElementById(field).value = record[field] || '';
    });
  },
  validate: (data, records, currentId) => {
    const errors = {};
    if (data.company.length < 3) errors.company = 'Ingrese el nombre de la empresa.';
    if (!/^[0-9-]{8,22}$/.test(data.legalId)) errors.legalId = 'Use únicamente números y guiones.';
    if (records.some(item => item.id !== currentId && AppCore.normalize(item.legalId) === AppCore.normalize(data.legalId))) errors.legalId = 'Ya existe un proveedor con esta cédula jurídica.';
    if (data.contact.length < 3) errors.contact = 'Ingrese una persona de contacto.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Ingrese un correo electrónico válido.';
    if (records.some(item => item.id !== currentId && AppCore.normalize(item.email) === AppCore.normalize(data.email))) errors.email = 'Ya existe un proveedor con este correo.';
    if (!AppCore.isValidPhone(data.phone)) errors.phone = 'Use solo números y un + opcional al inicio.';
    if (data.category.length < 3) errors.category = 'Ingrese una categoría válida.';
    if (!data.province) errors.province = 'Seleccione una provincia.';
    if (!['Activo','Inactivo','Suspendido'].includes(data.status)) errors.status = 'Seleccione un estado válido.';
    return errors;
  },
  beforeDelete: record => {
    const products = AppCore.read(AppCore.KEYS.products, []);
    const linked = products.filter(product => product.supplierId === record.id);
    if (linked.length) {
      AppCore.showToast(`No puede eliminarse porque tiene ${linked.length} producto(s) asociado(s). Reasigne esos productos primero.`, 'warning');
      AppCore.closeModal('delete-modal');
      return false;
    }
    return true;
  }
});

function refreshSupplierCategories() {
  const select = document.getElementById('category-filter');
  if (!select) return;
  const current = select.value;
  const suppliers = AppCore.read(AppCore.KEYS.suppliers, []);
  const categories = [...new Set(suppliers.map(item => item.category).filter(Boolean))].sort((a,b) => a.localeCompare(b,'es'));
  select.innerHTML = '<option value="">Todas</option>' + categories.map(category => `<option>${AppCore.escapeHtml(category)}</option>`).join('');
  select.value = categories.includes(current) ? current : '';
}


function printSuppliersReport() {
  const suppliers = AppCore.read(AppCore.KEYS.suppliers, []);
  AppCore.printReport('Reporte de proveedores', [
    { label: 'Empresa', value: row => row.company },
    { label: 'Cédula jurídica', value: row => row.legalId },
    { label: 'Contacto', value: row => row.contact },
    { label: 'Correo', value: row => row.email },
    { label: 'Teléfono', value: row => row.phone },
    { label: 'Categoría', value: row => row.category },
    { label: 'Provincia', value: row => row.province },
    { label: 'Estado', value: row => row.status }
  ], suppliers);
}

document.addEventListener('DOMContentLoaded', proveedoresApp.init);
