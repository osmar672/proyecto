'use strict';

const CrudController = config => {
  const state = {
    records: [],
    filtered: [],
    page: 1,
    pageSize: 8,
    pendingDeleteId: null
  };

  const elements = {};

  const cacheElements = () => {
    ['new-button','search-input','status-filter','clear-filters','table-body','empty-state','result-summary','pagination-summary','page-number','prev-page','next-page','entity-form','entity-id','form-title','detail-content','delete-copy','confirm-delete','stat-total','stat-active','stat-inactive','stat-visible'].forEach(id => {
      elements[id] = document.getElementById(id);
    });
    if (config.extraFilterId) elements.extraFilter = document.getElementById(config.extraFilterId);
  };

  const load = () => {
    state.records = AppCore.read(config.storageKey, []);
    applyFilters();
  };

  const save = () => AppCore.write(config.storageKey, state.records);

  const applyFilters = () => {
    const term = AppCore.normalize(elements['search-input'].value);
    const status = elements['status-filter'].value;
    const extraValue = elements.extraFilter?.value || '';

    state.filtered = state.records.filter(record => {
      const searchText = config.searchFields.map(field => record[field]).join(' ').toLowerCase();
      const matchesTerm = !term || searchText.includes(term);
      const matchesStatus = !status || record.status === status;
      const matchesExtra = !config.extraFilterId || !extraValue || config.extraFilterMatch(record, extraValue);
      return matchesTerm && matchesStatus && matchesExtra;
    });

    state.filtered.sort(config.sort || ((a, b) => String(a.name || a.company).localeCompare(String(b.name || b.company), 'es')));
    const maxPage = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.page > maxPage) state.page = maxPage;
    render();
  };

  const render = () => {
    const start = (state.page - 1) * state.pageSize;
    const pageRecords = state.filtered.slice(start, start + state.pageSize);
    elements['table-body'].innerHTML = pageRecords.map(config.rowTemplate).join('');
    elements['empty-state'].classList.toggle('hidden', pageRecords.length > 0);
    elements['table-body'].closest('.table-wrap').classList.toggle('hidden', pageRecords.length === 0);

    const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    elements['result-summary'].textContent = `${state.filtered.length} de ${state.records.length} registros`;
    elements['pagination-summary'].textContent = `Página ${state.page} de ${totalPages}`;
    elements['page-number'].textContent = state.page;
    elements['prev-page'].disabled = state.page <= 1;
    elements['next-page'].disabled = state.page >= totalPages;

    elements['stat-total'].textContent = state.records.length;
    elements['stat-active'].textContent = state.records.filter(record => record.status === 'Activo').length;
    elements['stat-inactive'].textContent = state.records.filter(record => record.status !== 'Activo').length;
    elements['stat-visible'].textContent = state.filtered.length;
    config.afterRender?.(state.records, state.filtered);
  };

  const clearErrors = () => {
    document.querySelectorAll('.error-text').forEach(item => { item.textContent = ''; });
    elements['entity-form'].querySelectorAll('input, select, textarea').forEach(input => input.classList.remove('invalid'));
  };

  const showErrors = errors => {
    clearErrors();
    Object.entries(errors).forEach(([field, message]) => {
      const input = document.getElementById(field);
      const error = document.getElementById(`error-${field}`);
      input?.classList.add('invalid');
      if (error) error.textContent = message;
    });
    const firstField = Object.keys(errors)[0];
    document.getElementById(firstField)?.focus();
    AppCore.playSound('error');
  };

  const openNew = () => {
    if (!AppCore.canManage()) {
      AppCore.showToast('El rol Cliente tiene acceso de solo lectura.', 'warning');
      return;
    }
    elements['entity-form'].reset();
    elements['entity-id'].value = '';
    elements['form-title'].textContent = `Nuevo ${config.entityName.toLowerCase()}`;
    clearErrors();
    config.prepareForm?.(null, state.records);
    const status = document.getElementById('status');
    if (status) status.value = 'Activo';
    document.getElementById('permission-note')?.classList.toggle('hidden', AppCore.canDelete());
    AppCore.openModal('form-modal');
  };

  const openEdit = id => {
    if (!AppCore.canManage()) {
      AppCore.showToast('El rol Cliente no puede editar registros.', 'warning');
      return;
    }
    const record = state.records.find(item => item.id === id);
    if (!record) return;
    elements['entity-form'].reset();
    elements['entity-id'].value = record.id;
    elements['form-title'].textContent = `Editar ${config.entityName.toLowerCase()}`;
    clearErrors();
    config.prepareForm?.(record, state.records);
    config.populateForm(record);
    document.getElementById('permission-note')?.classList.toggle('hidden', AppCore.canDelete());
    AppCore.openModal('form-modal');
  };

  const openDetail = id => {
    const record = state.records.find(item => item.id === id);
    if (!record) return;
    elements['detail-content'].innerHTML = config.detailTemplate(record);
    config.afterOpenDetail?.(record, elements['detail-content']);
    AppCore.openModal('detail-modal');
  };

  const openDelete = id => {
    if (!AppCore.canDelete()) {
      AppCore.showToast('Su rol no tiene permisos para eliminar registros.', 'warning');
      return;
    }
    const record = state.records.find(item => item.id === id);
    if (!record) return;
    state.pendingDeleteId = id;
    elements['delete-copy'].textContent = `Se eliminará “${config.displayName(record)}”. Esta acción no se puede deshacer.`;
    AppCore.openModal('delete-modal');
  };

  const submitForm = event => {
    event.preventDefault();
    if (!AppCore.canManage()) {
      AppCore.showToast('El rol Cliente no puede crear ni modificar registros.', 'warning');
      AppCore.closeModal('form-modal');
      return;
    }
    const id = elements['entity-id'].value;
    const data = config.serializeForm();
    const errors = config.validate(data, state.records, id);
    if (Object.keys(errors).length) {
      showErrors(errors);
      return;
    }

    if (id) {
      const index = state.records.findIndex(item => item.id === id);
      if (index === -1) return;
      state.records[index] = { ...state.records[index], ...data, id, updatedAt: new Date().toISOString() };
      AppCore.addActivity(config.entityName, `${config.displayName(state.records[index])} fue actualizado`);
      AppCore.showToast(`${config.entityName} actualizado correctamente.`, 'success');
    } else {
      const newRecord = {
        ...data,
        id: AppCore.createId(config.idPrefix),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      state.records.push(newRecord);
      AppCore.addActivity(config.entityName, `${config.displayName(newRecord)} fue registrado`);
      AppCore.showToast(`${config.entityName} registrado correctamente.`, 'success');
    }

    save();
    AppCore.closeModal('form-modal');
    config.afterSave?.(state.records);
    state.page = 1;
    load();
  };

  const confirmDelete = () => {
    if (!state.pendingDeleteId || !AppCore.canDelete()) return;
    const record = state.records.find(item => item.id === state.pendingDeleteId);
    if (!record) return;
    if (config.beforeDelete && !config.beforeDelete(record)) return;
    state.records = state.records.filter(item => item.id !== state.pendingDeleteId);
    save();
    AppCore.addActivity(config.entityName, `${config.displayName(record)} fue eliminado`);
    AppCore.showToast(`${config.entityName} eliminado correctamente.`, 'success');
    state.pendingDeleteId = null;
    AppCore.closeModal('delete-modal');
    load();
  };

  const setupEvents = () => {
    elements['new-button'].addEventListener('click', openNew);
    elements['search-input'].addEventListener('input', () => { state.page = 1; applyFilters(); });
    elements['status-filter'].addEventListener('change', () => { state.page = 1; applyFilters(); });
    elements.extraFilter?.addEventListener('change', () => { state.page = 1; applyFilters(); });
    elements['clear-filters'].addEventListener('click', () => {
      elements['search-input'].value = '';
      elements['status-filter'].value = '';
      if (elements.extraFilter) elements.extraFilter.value = '';
      state.page = 1;
      applyFilters();
      AppCore.playSound('click');
    });
    elements['prev-page'].addEventListener('click', () => { if (state.page > 1) { state.page--; render(); } });
    elements['next-page'].addEventListener('click', () => {
      const pages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
      if (state.page < pages) { state.page++; render(); }
    });
    elements['entity-form'].addEventListener('submit', submitForm);
    elements['confirm-delete'].addEventListener('click', confirmDelete);
    elements['table-body'].addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const actions = { view: openDetail, edit: openEdit, delete: openDelete };
      actions[button.dataset.action]?.(button.dataset.id);
    });
    elements['entity-form'].addEventListener('input', event => {
      event.target.classList.remove('invalid');
      const error = document.getElementById(`error-${event.target.id}`);
      if (error) error.textContent = '';
    });
  };

  const init = () => {
    const session = AppCore.initShell(config.activePage);
    if (!session) return;
    cacheElements();
    config.initialize?.();
    setupEvents();
    load();
    if (!AppCore.canManage()) {
      elements['new-button']?.classList.add('hidden');
      document.querySelectorAll('[data-action="edit"], [data-action="delete"]').forEach(button => button.remove());
      document.getElementById('form-modal')?.remove();
      document.getElementById('delete-modal')?.remove();
    }
  };

  return { init, load, state, openDetail };
};
