'use strict';

const clientesApp = CrudController({
  activePage: 'clientes',
  storageKey: AppCore.KEYS.clients,
  entityName: 'Cliente',
  idPrefix: 'CLI',
  searchFields: ['name', 'identification', 'email', 'phone', 'province'],
  extraFilterId: 'province-filter',
  extraFilterMatch: (record, value) => record.province === value,
  displayName: record => record.name,
  rowTemplate: record => `
    <tr>
      <td><span class="table-primary">${AppCore.escapeHtml(record.name)}</span><span class="table-secondary">${AppCore.escapeHtml(record.email)}</span></td>
      <td>${AppCore.escapeHtml(record.identification)}</td>
      <td><span class="table-primary">${AppCore.escapeHtml(record.phone)}</span><span class="table-secondary">${AppCore.escapeHtml(record.email)}</span></td>
      <td>${AppCore.escapeHtml(record.province)}</td>
      <td><span class="badge badge-${record.status.toLowerCase()}">${AppCore.escapeHtml(record.status)}</span></td>
      <td>${AppCore.formatDate(record.createdAt)}</td>
      <td><div class="actions">
        <button class="button button-ghost button-small" data-action="view" data-id="${record.id}" type="button">${AppCore.icon('eye')}<span>Ver</span></button>
        <button class="button button-secondary button-small" data-action="edit" data-id="${record.id}" type="button">${AppCore.icon('edit')}<span>Editar</span></button>
        <button class="button button-danger button-small" data-action="delete" data-id="${record.id}" type="button" ${AppCore.canDelete() ? '' : 'disabled title="Solo el administrador puede eliminar"'}>${AppCore.icon('trash')}<span>Eliminar</span></button>
      </div></td>
    </tr>`,
  detailTemplate: record => `
    <div class="detail-item full"><small>Nombre completo</small><strong>${AppCore.escapeHtml(record.name)}</strong></div>
    <div class="detail-item"><small>Identificación</small><strong>${AppCore.escapeHtml(record.identification)}</strong></div>
    <div class="detail-item"><small>Estado</small><strong>${AppCore.escapeHtml(record.status)}</strong></div>
    <div class="detail-item"><small>Correo</small><strong>${AppCore.escapeHtml(record.email)}</strong></div>
    <div class="detail-item"><small>Teléfono</small><strong>${AppCore.escapeHtml(record.phone)}</strong></div>
    <div class="detail-item"><small>Provincia</small><strong>${AppCore.escapeHtml(record.province)}</strong></div>
    <div class="detail-item"><small>Fecha de registro</small><strong>${AppCore.formatDate(record.createdAt)}</strong></div>
    <div class="detail-item full"><small>Observaciones</small><strong>${AppCore.escapeHtml(record.notes || 'Sin observaciones')}</strong></div>`,
  serializeForm: () => ({
    name: document.getElementById('name').value.trim(),
    identification: document.getElementById('identification').value.trim(),
    email: document.getElementById('email').value.trim().toLowerCase(),
    phone: AppCore.sanitizePhone(document.getElementById('phone').value),
    province: document.getElementById('province').value,
    status: document.getElementById('status').value,
    notes: document.getElementById('notes').value.trim()
  }),
  populateForm: record => {
    ['name','identification','email','phone','province','status','notes'].forEach(field => {
      document.getElementById(field).value = record[field] || '';
    });
  },
  validate: (data, records, currentId) => {
    const errors = {};
    if (data.name.length < 3) errors.name = 'Ingrese un nombre de al menos 3 caracteres.';
    if (!/^[0-9-]{8,20}$/.test(data.identification)) errors.identification = 'Use únicamente números y guiones.';
    if (records.some(item => item.id !== currentId && AppCore.normalize(item.identification) === AppCore.normalize(data.identification))) errors.identification = 'Ya existe un cliente con esta identificación.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Ingrese un correo electrónico válido.';
    if (records.some(item => item.id !== currentId && AppCore.normalize(item.email) === AppCore.normalize(data.email))) errors.email = 'Ya existe un cliente con este correo.';
    if (!AppCore.isValidPhone(data.phone)) errors.phone = 'Use solo números y un + opcional al inicio.';
    if (!data.province) errors.province = 'Seleccione una provincia.';
    if (!['Activo','Inactivo'].includes(data.status)) errors.status = 'Seleccione un estado válido.';
    return errors;
  }
});

document.addEventListener('DOMContentLoaded', clientesApp.init);
