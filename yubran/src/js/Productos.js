'use strict';

let suppliersCache = [];
let imagesDraft = [];
let currentGalleryIndex = 0;
let selectedInstallmentMonths = 3;
let selectedCurrency = 'CRC';
let usdCrcRate = null;
let exchangeRateMeta = null;
let exchangeRateLoading = false;
const MAX_PRODUCT_IMAGES = 4;
const MAX_IMAGE_BYTES = 240 * 1024;
const PLACEHOLDER_IMAGE = '../src/img/product-placeholder.svg';
const EXCHANGE_MARKUP = 0.05;
const EXCHANGE_RATE_API = 'https://api.frankfurter.dev/v2/rate/USD/CRC?providers=BCCR';
const EXCHANGE_RATE_CACHE_KEY = 'novaadmin_fx_usd_crc';
const EXCHANGE_RATE_CACHE_MS = 12 * 60 * 60 * 1000;
const EXCHANGE_RATE_FALLBACK_MS = 48 * 60 * 60 * 1000;

const BANK_PLANS = Object.freeze({
  'BAC Credomatic': [3, 6, 12, 18, 24],
  'Banco Nacional de Costa Rica': [3, 6, 12],
  'Banco de Costa Rica (BCR)': [3, 6, 12],
  'Banco Popular': [3, 6],
  'LAFISE': [3, 6, 12, 18]
});

const productosApp = CrudController({
  activePage: 'productos',
  storageKey: AppCore.KEYS.products,
  entityName: 'Producto',
  idPrefix: 'PRD',
  searchFields: ['name', 'code', 'category', 'description'],
  extraFilterId: 'category-filter',
  extraFilterMatch: (record, value) => record.category === value,
  displayName: record => record.name,
  initialize: () => {
    suppliersCache = AppCore.read(AppCore.KEYS.suppliers, []);
    refreshCategoryFilter();
    setupImageUploader();
    setupCatalogAndCartEvents();

    const session = AppCore.getSession();
    const catalogOnly = ['cliente', 'proveedor'].includes(session?.role);
    if (catalogOnly) {
      document.getElementById('product-stats')?.classList.add('hidden');
      document.getElementById('admin-products-table')?.classList.add('hidden');
      document.getElementById('client-catalog-card')?.classList.remove('hidden');
      document.getElementById('cart-button')?.classList.toggle('hidden', session?.role !== 'cliente');
      document.getElementById('print-products')?.classList.add('hidden');
      const title = document.querySelector('.section-heading h2');
      const subtitle = document.querySelector('.section-heading p');
      if (title) title.textContent = 'Catálogo de Productos';
      if (subtitle) subtitle.textContent = session?.role === 'cliente'
        ? 'Seleccione un producto para ver fotografías, detalles y agregarlo al carrito.'
        : 'Consulte el catálogo, existencias, fotografías y detalles de los productos.';
      if (session?.role === 'cliente') updateCartBadge();
    } else {
      document.getElementById('client-catalog-card')?.classList.add('hidden');
      document.getElementById('admin-products-table')?.classList.remove('hidden');
      document.getElementById('print-products')?.addEventListener('click', printProductsReport);
    }
  },
  prepareForm: record => {
    suppliersCache = AppCore.read(AppCore.KEYS.suppliers, []);
    const select = document.getElementById('supplierId');
    if (select) {
      select.innerHTML = '<option value="">Seleccione un proveedor</option>' + suppliersCache
        .filter(item => item.status === 'Activo' || item.id === record?.supplierId)
        .sort((a, b) => a.company.localeCompare(b.company, 'es'))
        .map(item => `<option value="${item.id}">${AppCore.escapeHtml(item.company)}</option>`).join('');
    }
    imagesDraft = sanitizeImages(record?.images || []);
    renderImagePreviews();
  },
  afterSave: refreshCategoryFilter,
  afterRender: (records, filtered) => {
    refreshCategoryFilter();
    if (['cliente', 'proveedor'].includes(AppCore.getSession()?.role)) renderClientCatalog(filtered);
  },
  rowTemplate: record => {
    const supplier = suppliersCache.find(item => item.id === record.supplierId);
    const stockBadge = Number(record.stock) === 0
      ? '<span class="badge badge-inactivo">Agotado</span>'
      : Number(record.stock) <= 5
        ? '<span class="badge badge-low">Bajo</span>'
        : `<span>${record.stock}</span>`;
    return `
      <tr>
        <td><div class="admin-product-cell"><img class="admin-product-thumb" src="${AppCore.escapeHtml(getProductImages(record)[0])}" alt=""><span><span class="table-primary">${AppCore.escapeHtml(record.name)}</span><span class="table-secondary">${AppCore.escapeHtml(record.description || 'Sin descripción')}</span></span></div></td>
        <td>${AppCore.escapeHtml(record.code)}</td>
        <td><span class="badge badge-info">${AppCore.escapeHtml(record.category)}</span></td>
        <td>${AppCore.formatCurrency(record.price)}</td>
        <td>${stockBadge}</td>
        <td>${AppCore.escapeHtml(supplier?.company || 'No asignado')}</td>
        <td><span class="badge badge-${record.status.toLowerCase()}">${AppCore.escapeHtml(record.status)}</span></td>
        <td><div class="actions">
          <button class="button button-ghost button-small" data-action="view" data-id="${record.id}" type="button">${AppCore.icon('eye')}<span>Ver</span></button>
          ${AppCore.canManage() ? `
          <button class="button button-secondary button-small" data-action="edit" data-id="${record.id}" type="button">${AppCore.icon('edit')}<span>Editar</span></button>
          <button class="button button-danger button-small" data-action="delete" data-id="${record.id}" type="button">${AppCore.icon('trash')}<span>Eliminar</span></button>` : ''}
        </div></td>
      </tr>`;
  },
  detailTemplate: record => buildProductDetail(record),
  afterOpenDetail: (record, root) => setupProductDetail(record, root),
  serializeForm: () => ({
    code: document.getElementById('code').value.trim().toUpperCase(),
    name: document.getElementById('name').value.trim(),
    category: document.getElementById('category').value.trim(),
    supplierId: document.getElementById('supplierId').value,
    price: Number(document.getElementById('price').value),
    stock: Number(document.getElementById('stock').value),
    status: document.getElementById('status').value,
    description: document.getElementById('description').value.trim(),
    images: imagesDraft.slice(0, MAX_PRODUCT_IMAGES)
  }),
  populateForm: record => {
    ['code', 'name', 'category', 'supplierId', 'price', 'stock', 'status', 'description'].forEach(field => {
      document.getElementById(field).value = record[field] ?? '';
    });
    renderImagePreviews();
  },
  validate: (data, records, currentId) => {
    const errors = {};
    if (!/^[A-Z0-9-]{3,20}$/.test(data.code)) errors.code = 'Use 3 a 20 letras, números o guiones.';
    if (records.some(item => item.id !== currentId && AppCore.normalize(item.code) === AppCore.normalize(data.code))) errors.code = 'Ya existe un producto con este código.';
    if (data.name.length < 3) errors.name = 'Ingrese un nombre de al menos 3 caracteres.';
    if (data.category.length < 3) errors.category = 'Ingrese una categoría válida.';
    if (!data.supplierId) errors.supplierId = 'Seleccione un proveedor.';
    if (!Number.isFinite(data.price) || data.price <= 0) errors.price = 'El precio debe ser mayor que cero.';
    if (!Number.isInteger(data.stock) || data.stock < 0) errors.stock = 'La cantidad debe ser un entero igual o mayor que cero.';
    if (!['Activo', 'Inactivo'].includes(data.status)) errors.status = 'Seleccione un estado válido.';
    if (data.images.length > MAX_PRODUCT_IMAGES) errors.images = `Puede guardar un máximo de ${MAX_PRODUCT_IMAGES} imágenes.`;
    return errors;
  }
});

function sanitizeImages(images) {
  return (Array.isArray(images) ? images : [])
    .filter(image => typeof image === 'string' && /^data:image\/(jpeg|png|webp);base64,/i.test(image))
    .slice(0, MAX_PRODUCT_IMAGES);
}

function getProductImages(record) {
  const images = sanitizeImages(record?.images || []);
  return images.length ? images : [PLACEHOLDER_IMAGE];
}

function setupImageUploader() {
  const input = document.getElementById('product-images');
  const previews = document.getElementById('image-previews');
  if (!input || !previews) return;

  input.addEventListener('change', async () => {
    const files = [...input.files];
    input.value = '';
    if (!files.length) return;
    const available = MAX_PRODUCT_IMAGES - imagesDraft.length;
    if (available <= 0) {
      AppCore.showToast(`Ya alcanzó el máximo de ${MAX_PRODUCT_IMAGES} imágenes.`, 'warning');
      return;
    }
    const selected = files.slice(0, available);
    if (files.length > available) AppCore.showToast(`Solo se procesarán ${available} imágenes adicionales.`, 'warning');

    const status = document.getElementById('image-upload-status');
    if (status) status.textContent = 'Procesando imágenes…';
    for (const file of selected) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        AppCore.showToast(`${file.name}: formato no compatible.`, 'warning');
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        AppCore.showToast(`${file.name}: la imagen supera 8 MB.`, 'warning');
        continue;
      }
      try {
        imagesDraft.push(await compressImage(file));
      } catch (error) {
        console.error(error);
        AppCore.showToast(`No se pudo procesar ${file.name}.`, 'error');
      }
    }
    renderImagePreviews();
  });

  previews.addEventListener('click', event => {
    const button = event.target.closest('[data-remove-image]');
    if (!button) return;
    imagesDraft.splice(Number(button.dataset.removeImage), 1);
    renderImagePreviews();
    AppCore.playSound('click');
  });
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Imagen no válida'));
      image.onload = () => {
        let width = image.naturalWidth;
        let height = image.naturalHeight;
        const maxDimension = 720;
        const scale = Math.min(1, maxDimension / Math.max(width, height));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });
        let quality = .76;
        let dataUrl = '';

        const encode = () => {
          canvas.width = width;
          canvas.height = height;
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, width, height);
          context.drawImage(image, 0, 0, width, height);
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          const estimatedBytes = Math.ceil((dataUrl.length - dataUrl.indexOf(',') - 1) * 3 / 4);
          if (estimatedBytes <= MAX_IMAGE_BYTES) return resolve(dataUrl);
          if (quality > .48) {
            quality -= .09;
            return encode();
          }
          if (Math.max(width, height) > 440) {
            width = Math.round(width * .82);
            height = Math.round(height * .82);
            quality = .68;
            return encode();
          }
          reject(new Error('La imagen no pudo comprimirse lo suficiente para LocalStorage'));
        };
        encode();
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderImagePreviews() {
  const container = document.getElementById('image-previews');
  const status = document.getElementById('image-upload-status');
  if (!container) return;
  container.innerHTML = imagesDraft.map((image, index) => `
    <figure class="image-preview-item">
      <img src="${AppCore.escapeHtml(image)}" alt="Vista previa ${index + 1}">
      <button class="image-remove-button" type="button" data-remove-image="${index}" aria-label="Eliminar imagen ${index + 1}">${AppCore.icon('trash')}</button>
      <figcaption>Imagen ${index + 1}</figcaption>
    </figure>`).join('');
  if (status) status.textContent = `${imagesDraft.length} de ${MAX_PRODUCT_IMAGES} imágenes seleccionadas.`;
}

function buildProductDetail(record) {
  const supplier = suppliersCache.find(item => item.id === record.supplierId);
  const images = getProductImages(record);
  const canBuy = AppCore.getSession()?.role === 'cliente' && record.status === 'Activo' && Number(record.stock) > 0;
  return `
    <div class="product-detail-layout" data-product-detail="${record.id}">
      <section class="product-gallery" aria-label="Galería de ${AppCore.escapeHtml(record.name)}">
        <div class="product-gallery-stage">
          <img id="product-gallery-main" src="${AppCore.escapeHtml(images[0])}" alt="${AppCore.escapeHtml(record.name)}">
          ${images.length > 1 ? `<button class="gallery-nav gallery-prev" type="button" data-gallery-direction="-1" aria-label="Imagen anterior">${AppCore.icon('chevronLeft')}</button><button class="gallery-nav gallery-next" type="button" data-gallery-direction="1" aria-label="Imagen siguiente">${AppCore.icon('chevronRight')}</button>` : ''}
          <span id="gallery-counter" class="gallery-counter">1 de ${images.length}</span>
        </div>
        <div class="gallery-thumbnails">${images.map((image, index) => `<button class="gallery-thumb ${index === 0 ? 'active' : ''}" type="button" data-gallery-index="${index}" aria-label="Ver imagen ${index + 1}"><img src="${AppCore.escapeHtml(image)}" alt=""></button>`).join('')}</div>
      </section>
      <section class="product-detail-info">
        <div class="product-detail-heading"><div><span class="badge badge-info">${AppCore.escapeHtml(record.category)}</span><h2>${AppCore.escapeHtml(record.name)}</h2><p>${AppCore.escapeHtml(record.description || 'Sin descripción')}</p></div><strong class="product-detail-price">${AppCore.formatCurrency(record.price)}</strong></div>
        <div class="detail-grid product-detail-grid">
          <div class="detail-item"><small>Código</small><strong>${AppCore.escapeHtml(record.code)}</strong></div>
          <div class="detail-item"><small>Existencias</small><strong>${record.stock}</strong></div>
          <div class="detail-item"><small>Proveedor</small><strong>${AppCore.escapeHtml(supplier?.company || 'No asignado')}</strong></div>
          <div class="detail-item"><small>Estado</small><strong>${AppCore.escapeHtml(record.status)}</strong></div>
        </div>
        ${AppCore.getSession()?.role === 'cliente' ? `<div class="product-buy-panel"><div><strong>${canBuy ? 'Disponible para agregar al carrito' : 'Producto no disponible para compra'}</strong><small>${canBuy ? `Existencias disponibles: ${record.stock}` : 'Consulte otro producto activo con existencias.'}</small></div><button class="button button-primary" type="button" data-add-cart="${record.id}" ${canBuy ? '' : 'disabled'}>${AppCore.icon('shoppingCart')} Agregar al carrito</button></div>` : ''}
      </section>
    </div>`;
}

function setupProductDetail(record, root) {
  currentGalleryIndex = 0;
  const images = getProductImages(record);
  const main = root.querySelector('#product-gallery-main');
  const counter = root.querySelector('#gallery-counter');
  const thumbs = [...root.querySelectorAll('[data-gallery-index]')];

  const showImage = index => {
    currentGalleryIndex = (index + images.length) % images.length;
    if (main) main.src = images[currentGalleryIndex];
    if (counter) counter.textContent = `${currentGalleryIndex + 1} de ${images.length}`;
    thumbs.forEach((thumb, thumbIndex) => thumb.classList.toggle('active', thumbIndex === currentGalleryIndex));
  };
  root.querySelectorAll('[data-gallery-direction]').forEach(button => button.addEventListener('click', () => showImage(currentGalleryIndex + Number(button.dataset.galleryDirection))));
  thumbs.forEach(button => button.addEventListener('click', () => showImage(Number(button.dataset.galleryIndex))));
  root.querySelector('[data-add-cart]')?.addEventListener('click', () => addToCart(record.id));
}

function renderClientCatalog(filtered) {
  const container = document.getElementById('client-catalog');
  const empty = document.getElementById('client-empty');
  const summary = document.getElementById('catalog-summary');
  if (!container) return;
  if (summary) summary.textContent = `${filtered.length} producto${filtered.length === 1 ? '' : 's'} encontrado${filtered.length === 1 ? '' : 's'}`;
  empty?.classList.toggle('hidden', filtered.length > 0);
  container.classList.toggle('hidden', filtered.length === 0);
  container.innerHTML = filtered.map(record => {
    const supplier = suppliersCache.find(item => item.id === record.supplierId);
    const stockText = Number(record.stock) === 0 ? 'Agotado' : Number(record.stock) <= 5 ? `Solo ${record.stock} disponibles` : `${record.stock} disponibles`;
    const stockClass = Number(record.stock) === 0 ? 'badge-inactivo' : Number(record.stock) <= 5 ? 'badge-low' : 'badge-activo';
    return `
      <button class="catalog-product-card" type="button" data-product-open="${record.id}" aria-label="Ver ${AppCore.escapeHtml(record.name)}">
        <img class="catalog-product-image" src="${AppCore.escapeHtml(getProductImages(record)[0])}" alt="${AppCore.escapeHtml(record.name)}">
        <span class="catalog-product-content">
          <span class="catalog-product-top"><span><strong>${AppCore.escapeHtml(record.name)}</strong><small>${AppCore.escapeHtml(record.description || 'Sin descripción')}</small></span><b>${AppCore.formatCurrency(record.price)}</b></span>
          <span class="catalog-product-meta"><span class="badge badge-info">${AppCore.escapeHtml(record.category)}</span><span class="badge ${stockClass}">${stockText}</span><span>${AppCore.escapeHtml(record.code)}</span><span>${AppCore.escapeHtml(supplier?.company || 'No asignado')}</span></span>
          <span class="catalog-product-link">${AppCore.icon('eye')} Ver producto y fotografías</span>
        </span>
      </button>`;
  }).join('');
}

function setupCatalogAndCartEvents() {
  document.getElementById('client-catalog')?.addEventListener('click', event => {
    const card = event.target.closest('[data-product-open]');
    if (card) productosApp.openDetail(card.dataset.productOpen);
  });
  document.getElementById('cart-button')?.addEventListener('click', openCart);
  document.getElementById('cart-items')?.addEventListener('click', handleCartAction);
  document.getElementById('checkout-button')?.addEventListener('click', openCheckout);
  document.querySelectorAll('input[name="payment-currency"]').forEach(radio => radio.addEventListener('change', async event => {
    selectedCurrency = event.target.value === 'USD' ? 'USD' : 'CRC';
    toggleExchangeRatePanel();
    if (selectedCurrency === 'USD') await loadUsdCrcRate();
    updateCheckoutPaymentSummary();
  }));
  document.getElementById('refresh-exchange-rate')?.addEventListener('click', async () => {
    if (selectedCurrency !== 'USD') return;
    await loadUsdCrcRate(true);
    updateCheckoutPaymentSummary();
  });
  document.getElementById('bank-select')?.addEventListener('change', () => {
    selectedInstallmentMonths = BANK_PLANS[document.getElementById('bank-select').value]?.[0] || 3;
    renderInstallmentOptions();
    updateCheckoutPaymentSummary();
  });
  document.querySelectorAll('input[name="payment-method"]').forEach(radio => radio.addEventListener('change', () => {
    document.getElementById('financing-options')?.classList.toggle('hidden', radio.value !== 'installments' || !radio.checked);
    updateCheckoutPaymentSummary();
  }));
  document.getElementById('installment-options')?.addEventListener('click', event => {
    const button = event.target.closest('[data-months]');
    if (!button) return;
    selectedInstallmentMonths = Number(button.dataset.months);
    renderInstallmentOptions();
    updateCheckoutPaymentSummary();
  });
  document.getElementById('confirm-purchase')?.addEventListener('click', confirmPurchase);
}

function formatUsd(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

function readExchangeRateCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(EXCHANGE_RATE_CACHE_KEY) || 'null');
    if (!cached || !Number.isFinite(Number(cached.rate)) || Number(cached.rate) <= 0) return null;
    return { ...cached, rate: Number(cached.rate), fetchedAt: Number(cached.fetchedAt || 0) };
  } catch {
    return null;
  }
}

function writeExchangeRateCache(payload) {
  localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify(payload));
}

function setExchangeRateState(rate, meta = null) {
  usdCrcRate = Number.isFinite(Number(rate)) && Number(rate) > 0 ? Number(rate) : null;
  exchangeRateMeta = meta;
}

function toggleExchangeRatePanel() {
  const panel = document.getElementById('exchange-rate-panel');
  panel?.classList.toggle('hidden', selectedCurrency !== 'USD');
  const note = document.getElementById('checkout-currency-note');
  if (note) note.textContent = selectedCurrency === 'USD'
    ? 'Pago seleccionado en dólares (USD). Se aplica 5% al monto convertido.'
    : 'Pago seleccionado en colones (CRC).';
}

function setExchangeRateUi(status, type = 'info') {
  const statusElement = document.getElementById('exchange-rate-status');
  const values = document.getElementById('exchange-rate-values');
  const refreshButton = document.getElementById('refresh-exchange-rate');
  const confirmButton = document.getElementById('confirm-purchase');
  const panel = document.getElementById('exchange-rate-panel');
  if (statusElement) {
    statusElement.textContent = status;
    statusElement.dataset.state = type;
  }
  if (values) values.classList.toggle('hidden', !usdCrcRate);
  if (refreshButton) refreshButton.disabled = exchangeRateLoading;
  if (confirmButton) confirmButton.disabled = selectedCurrency === 'USD' && (!usdCrcRate || exchangeRateLoading);
  if (panel) panel.setAttribute('aria-busy', String(exchangeRateLoading));
}

async function loadUsdCrcRate(force = false) {
  const now = Date.now();
  const cached = readExchangeRateCache();
  if (!force && cached && now - cached.fetchedAt <= EXCHANGE_RATE_CACHE_MS) {
    setExchangeRateState(cached.rate, { ...cached, cached: true });
    setExchangeRateUi(`Tasa BCCR guardada · ${cached.date || 'última disponible'}`, 'success');
    updateExchangeRateValues();
    return true;
  }

  exchangeRateLoading = true;
  setExchangeRateUi('Consultando la tasa de referencia del BCCR…', 'loading');
  try {
    const response = await fetch(EXCHANGE_RATE_API, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const rate = Number(data.rate);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error('La API no devolvió una tasa válida.');

    const payload = {
      rate,
      date: data.date || new Date().toISOString().slice(0, 10),
      fetchedAt: now,
      provider: 'BCCR',
      api: 'Frankfurter'
    };
    writeExchangeRateCache(payload);
    setExchangeRateState(rate, { ...payload, cached: false });
    setExchangeRateUi(`Tasa BCCR actualizada · ${payload.date}`, 'success');
    updateExchangeRateValues();
    return true;
  } catch (error) {
    console.error('No se pudo consultar USD/CRC:', error);
    if (cached && now - cached.fetchedAt <= EXCHANGE_RATE_FALLBACK_MS) {
      setExchangeRateState(cached.rate, { ...cached, cached: true, fallback: true });
      setExchangeRateUi(`API no disponible. Se usa la última tasa guardada del ${cached.date || 'registro previo'}.`, 'warning');
      updateExchangeRateValues();
      AppCore.showToast('No se pudo actualizar la tasa. Se utilizará la última tasa BCCR guardada.', 'warning');
      return true;
    }
    setExchangeRateState(null, null);
    setExchangeRateUi('No fue posible obtener la tasa USD/CRC. Reintente antes de pagar en dólares.', 'error');
    updateExchangeRateValues();
    AppCore.showToast('No se pudo consultar el tipo de cambio. El pago en dólares queda temporalmente bloqueado.', 'error');
    return false;
  } finally {
    exchangeRateLoading = false;
    setExchangeRateUi(document.getElementById('exchange-rate-status')?.textContent || '', document.getElementById('exchange-rate-status')?.dataset.state || 'info');
  }
}

function getCurrencyBreakdown() {
  const totalCrc = getCartTotal();
  if (selectedCurrency !== 'USD') {
    return {
      currency: 'CRC',
      totalCrc,
      payable: totalCrc,
      baseUsd: null,
      markupUsd: null,
      rate: null
    };
  }
  if (!usdCrcRate) {
    return {
      currency: 'USD',
      totalCrc,
      payable: null,
      baseUsd: null,
      markupUsd: null,
      rate: null
    };
  }
  const baseUsd = totalCrc / usdCrcRate;
  const markupUsd = baseUsd * EXCHANGE_MARKUP;
  return {
    currency: 'USD',
    totalCrc,
    payable: baseUsd + markupUsd,
    baseUsd,
    markupUsd,
    rate: usdCrcRate
  };
}

function updateExchangeRateValues() {
  const reference = document.getElementById('exchange-reference-rate');
  const base = document.getElementById('exchange-base-usd');
  const markup = document.getElementById('exchange-markup-usd');
  const breakdown = getCurrencyBreakdown();
  if (reference) reference.textContent = usdCrcRate ? `₡${usdCrcRate.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por US$1` : '—';
  if (base) base.textContent = breakdown.baseUsd == null ? '—' : formatUsd(breakdown.baseUsd);
  if (markup) markup.textContent = breakdown.markupUsd == null ? '—' : formatUsd(breakdown.markupUsd);
}

function getUserCart() {
  const session = AppCore.getSession();
  const carts = AppCore.read(AppCore.KEYS.carts, {});
  return session ? (Array.isArray(carts[session.id]) ? carts[session.id] : []) : [];
}

function saveUserCart(cart) {
  const session = AppCore.getSession();
  if (!session) return;
  const carts = AppCore.read(AppCore.KEYS.carts, {});
  carts[session.id] = cart.filter(item => item.quantity > 0);
  AppCore.write(AppCore.KEYS.carts, carts);
  updateCartBadge();
}

function updateCartBadge() {
  const count = getUserCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = count;
  document.getElementById('cart-button')?.classList.toggle('has-items', count > 0);
}

function addToCart(productId) {
  if (AppCore.getSession()?.role !== 'cliente') return;
  const product = AppCore.read(AppCore.KEYS.products, []).find(item => item.id === productId);
  if (!product || product.status !== 'Activo' || Number(product.stock) <= 0) {
    AppCore.showToast('Este producto no está disponible para compra.', 'warning');
    return;
  }
  const cart = getUserCart();
  const existing = cart.find(item => item.productId === productId);
  const currentQuantity = Number(existing?.quantity || 0);
  if (currentQuantity >= Number(product.stock)) {
    AppCore.showToast('Ya agregó al carrito todas las unidades disponibles.', 'warning');
    return;
  }
  if (existing) existing.quantity += 1;
  else cart.push({ productId, quantity: 1 });
  saveUserCart(cart);
  AppCore.showToast(`${product.name} se agregó al carrito.`, 'success');
  AppCore.playSound('success');
}

function openCart() {
  renderCart();
  AppCore.openModal('cart-modal');
}

function renderCart() {
  const products = AppCore.read(AppCore.KEYS.products, []);
  const cart = getUserCart();
  const container = document.getElementById('cart-items');
  const empty = document.getElementById('cart-empty');
  const checkout = document.getElementById('checkout-button');
  let total = 0;

  const validItems = cart.map(item => ({ item, product: products.find(product => product.id === item.productId) })).filter(entry => entry.product);
  if (container) container.innerHTML = validItems.map(({ item, product }) => {
    const lineTotal = Number(product.price) * Number(item.quantity);
    total += lineTotal;
    return `
      <article class="cart-item">
        <img src="${AppCore.escapeHtml(getProductImages(product)[0])}" alt="${AppCore.escapeHtml(product.name)}">
        <div class="cart-item-info"><strong>${AppCore.escapeHtml(product.name)}</strong><small>${AppCore.escapeHtml(product.code)} · ${AppCore.formatCurrency(product.price)} c/u</small><span>${AppCore.formatCurrency(lineTotal)}</span></div>
        <div class="cart-quantity" aria-label="Cantidad de ${AppCore.escapeHtml(product.name)}"><button type="button" data-cart-action="decrease" data-id="${product.id}" aria-label="Disminuir cantidad">${AppCore.icon('minus')}</button><strong>${item.quantity}</strong><button type="button" data-cart-action="increase" data-id="${product.id}" aria-label="Aumentar cantidad">${AppCore.icon('plus')}</button></div>
        <button class="cart-remove" type="button" data-cart-action="remove" data-id="${product.id}" aria-label="Eliminar ${AppCore.escapeHtml(product.name)} del carrito">${AppCore.icon('trash')}</button>
      </article>`;
  }).join('');
  empty?.classList.toggle('hidden', validItems.length > 0);
  container?.classList.toggle('hidden', validItems.length === 0);
  if (checkout) checkout.disabled = validItems.length === 0;
  const totalElement = document.getElementById('cart-total');
  if (totalElement) totalElement.textContent = AppCore.formatCurrency(total);
  updateCartBadge();
}

function handleCartAction(event) {
  const button = event.target.closest('[data-cart-action]');
  if (!button) return;
  const products = AppCore.read(AppCore.KEYS.products, []);
  const product = products.find(item => item.id === button.dataset.id);
  let cart = getUserCart();
  const entry = cart.find(item => item.productId === button.dataset.id);
  if (!entry) return;

  if (button.dataset.cartAction === 'increase') {
    if (!product || entry.quantity >= Number(product.stock)) {
      AppCore.showToast('No hay más unidades disponibles.', 'warning');
      return;
    }
    entry.quantity += 1;
  } else if (button.dataset.cartAction === 'decrease') {
    entry.quantity -= 1;
    if (entry.quantity <= 0) cart = cart.filter(item => item.productId !== button.dataset.id);
  } else if (button.dataset.cartAction === 'remove') {
    cart = cart.filter(item => item.productId !== button.dataset.id);
  }
  saveUserCart(cart);
  renderCart();
  AppCore.playSound('click');
}

function getCartTotal() {
  const products = AppCore.read(AppCore.KEYS.products, []);
  return getUserCart().reduce((sum, item) => {
    const product = products.find(record => record.id === item.productId);
    return sum + (product ? Number(product.price) * Number(item.quantity) : 0);
  }, 0);
}

function openCheckout() {
  const cart = getUserCart();
  if (!cart.length) return;
  const bankSelect = document.getElementById('bank-select');
  if (bankSelect) {
    bankSelect.innerHTML = Object.keys(BANK_PLANS).map(bank => `<option>${AppCore.escapeHtml(bank)}</option>`).join('');
    selectedInstallmentMonths = BANK_PLANS[bankSelect.value]?.[0] || 3;
  }
  selectedCurrency = 'CRC';
  const crcRadio = document.querySelector('input[name="payment-currency"][value="CRC"]');
  if (crcRadio) crcRadio.checked = true;
  const cashRadio = document.querySelector('input[name="payment-method"][value="cash"]');
  if (cashRadio) cashRadio.checked = true;
  document.getElementById('financing-options')?.classList.add('hidden');
  toggleExchangeRatePanel();
  setExchangeRateUi('Seleccione dólares para consultar la tasa.', 'info');
  renderInstallmentOptions();
  renderCheckoutLines();
  updateCheckoutPaymentSummary();
  AppCore.closeModal('cart-modal');
  AppCore.openModal('checkout-modal');
}

function renderCheckoutLines() {
  const products = AppCore.read(AppCore.KEYS.products, []);
  const container = document.getElementById('checkout-lines');
  const cart = getUserCart();
  if (container) container.innerHTML = cart.map(item => {
    const product = products.find(record => record.id === item.productId);
    if (!product) return '';
    return `<div><span>${item.quantity} × ${AppCore.escapeHtml(product.name)}</span><strong>${AppCore.formatCurrency(product.price * item.quantity)}</strong></div>`;
  }).join('');
  const totalElement = document.getElementById('checkout-total');
  if (totalElement) totalElement.textContent = AppCore.formatCurrency(getCartTotal());
}

function renderInstallmentOptions() {
  const select = document.getElementById('bank-select');
  const container = document.getElementById('installment-options');
  if (!select || !container) return;
  const plans = BANK_PLANS[select.value] || [3];
  if (!plans.includes(selectedInstallmentMonths)) selectedInstallmentMonths = plans[0];
  container.innerHTML = plans.map(months => `<button class="installment-chip ${months === selectedInstallmentMonths ? 'active' : ''}" type="button" data-months="${months}">${months} meses</button>`).join('');
}

function updateCheckoutPaymentSummary() {
  const method = document.querySelector('input[name="payment-method"]:checked')?.value || 'cash';
  const monthly = document.getElementById('monthly-payment');
  const breakdown = getCurrencyBreakdown();
  const totalElement = document.getElementById('checkout-total');
  const totalLabel = document.getElementById('checkout-total-label');
  const exchangeSummary = document.getElementById('exchange-summary');
  const confirmButton = document.getElementById('confirm-purchase');

  toggleExchangeRatePanel();
  updateExchangeRateValues();

  if (selectedCurrency === 'USD') {
    exchangeSummary?.classList.remove('hidden');
    const crc = document.getElementById('exchange-summary-crc');
    const base = document.getElementById('exchange-summary-base');
    const markup = document.getElementById('exchange-summary-markup');
    if (crc) crc.textContent = AppCore.formatCurrency(breakdown.totalCrc);
    if (base) base.textContent = breakdown.baseUsd == null ? 'Pendiente' : formatUsd(breakdown.baseUsd);
    if (markup) markup.textContent = breakdown.markupUsd == null ? 'Pendiente' : formatUsd(breakdown.markupUsd);
    if (totalLabel) totalLabel.textContent = 'Total a pagar en USD';
    if (totalElement) totalElement.textContent = breakdown.payable == null ? 'Consultando…' : formatUsd(breakdown.payable);
  } else {
    exchangeSummary?.classList.add('hidden');
    if (totalLabel) totalLabel.textContent = 'Total a pagar';
    if (totalElement) totalElement.textContent = AppCore.formatCurrency(breakdown.totalCrc);
  }

  if (confirmButton) confirmButton.disabled = selectedCurrency === 'USD' && (!usdCrcRate || exchangeRateLoading);

  if (method === 'cash') {
    monthly?.classList.add('hidden');
    return;
  }

  const bank = document.getElementById('bank-select')?.value || Object.keys(BANK_PLANS)[0];
  monthly?.classList.remove('hidden');
  const monthlyAmount = breakdown.payable == null ? null : breakdown.payable / selectedInstallmentMonths;
  const monthlyAmountElement = document.getElementById('monthly-amount');
  if (monthlyAmountElement) monthlyAmountElement.textContent = monthlyAmount == null
    ? 'Pendiente'
    : selectedCurrency === 'USD' ? formatUsd(monthlyAmount) : AppCore.formatCurrency(monthlyAmount);
  const monthlyDescription = document.getElementById('monthly-description');
  if (monthlyDescription) monthlyDescription.textContent = `${selectedInstallmentMonths} cuotas simuladas con ${bank} · ${selectedCurrency}`;
}

function confirmPurchase() {
  if (AppCore.getSession()?.role !== 'cliente') return;
  const cart = getUserCart();
  const products = AppCore.read(AppCore.KEYS.products, []);
  if (!cart.length) {
    AppCore.showToast('El carrito está vacío.', 'warning');
    return;
  }
  for (const item of cart) {
    const product = products.find(record => record.id === item.productId);
    if (!product || product.status !== 'Activo' || Number(product.stock) < Number(item.quantity)) {
      AppCore.showToast(`Revise las existencias de ${product?.name || 'un producto'} antes de comprar.`, 'error');
      return;
    }
  }

  const breakdown = getCurrencyBreakdown();
  if (selectedCurrency === 'USD' && (!breakdown.rate || !Number.isFinite(breakdown.payable))) {
    AppCore.showToast('Primero debe obtenerse una tasa USD/CRC válida para confirmar el pago en dólares.', 'warning');
    return;
  }

  const method = document.querySelector('input[name="payment-method"]:checked')?.value || 'cash';
  const bank = method === 'installments' ? document.getElementById('bank-select').value : null;
  const total = breakdown.totalCrc;
  cart.forEach(item => {
    const product = products.find(record => record.id === item.productId);
    product.stock = Number(product.stock) - Number(item.quantity);
    if (product.stock === 0) product.status = 'Inactivo';
    product.updatedAt = new Date().toISOString();
  });
  AppCore.write(AppCore.KEYS.products, products);

  const session = AppCore.getSession();
  const orders = AppCore.read(AppCore.KEYS.orders, []);
  const monthlyAmount = method === 'installments' ? breakdown.payable / selectedInstallmentMonths : null;
  const order = {
    id: AppCore.createId('ORD'),
    userId: session.id,
    customer: session.name,
    items: cart.map(item => {
      const product = products.find(record => record.id === item.productId);
      return {
        ...item,
        productName: product?.name || item.productId,
        productCode: product?.code || '',
        unitPrice: Number(product?.price || 0),
        warrantyMonths: 12
      };
    }),
    total,
    currency: selectedCurrency,
    amountPaid: breakdown.payable,
    exchange: selectedCurrency === 'USD' ? {
      pair: 'USD/CRC',
      source: 'BCCR vía Frankfurter API',
      referenceRate: breakdown.rate,
      referenceDate: exchangeRateMeta?.date || null,
      fetchedAt: exchangeRateMeta?.fetchedAt || null,
      markupPercent: EXCHANGE_MARKUP * 100,
      baseUsdAmount: breakdown.baseUsd,
      markupUsdAmount: breakdown.markupUsd,
      finalUsdAmount: breakdown.payable
    } : null,
    payment: method === 'cash'
      ? { type: 'Contado', currency: selectedCurrency, amount: breakdown.payable }
      : { type: 'Cuotas sin interés', bank, months: selectedInstallmentMonths, currency: selectedCurrency, monthlyAmount },
    createdAt: new Date().toISOString()
  };
  orders.unshift(order);
  AppCore.write(AppCore.KEYS.orders, orders.slice(0, 100));
  saveUserCart([]);

  const paymentText = selectedCurrency === 'USD'
    ? `${formatUsd(breakdown.payable)} (base ${AppCore.formatCurrency(total)} + margen cambiario 5%)`
    : AppCore.formatCurrency(total);
  AppCore.addActivity('Compra', `${session.name} registró la compra ${order.id} por ${paymentText}`);
  AppCore.closeModal('checkout-modal');
  AppCore.showToast(`Compra simulada registrada con el número ${order.id}. Total: ${paymentText}.`, 'success', 'Compra completada');
  productosApp.load();
}

function refreshCategoryFilter() {
  const select = document.getElementById('category-filter');
  if (!select) return;
  const current = select.value;
  const products = AppCore.read(AppCore.KEYS.products, []);
  const categories = [...new Set(products.map(item => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  select.innerHTML = '<option value="">Todas</option>' + categories.map(category => `<option>${AppCore.escapeHtml(category)}</option>`).join('');
  select.value = categories.includes(current) ? current : '';
}


function printProductsReport() {
  const products = AppCore.read(AppCore.KEYS.products, []);
  const suppliers = AppCore.read(AppCore.KEYS.suppliers, []);
  AppCore.printReport('Reporte de productos', [
    { label: 'Código', value: row => row.code },
    { label: 'Producto', value: row => row.name },
    { label: 'Categoría', value: row => row.category },
    { label: 'Precio', value: row => AppCore.formatCurrency(row.price) },
    { label: 'Stock', value: row => String(row.stock) },
    { label: 'Proveedor', value: row => suppliers.find(supplier => supplier.id === row.supplierId)?.company || 'No asignado' },
    { label: 'Estado', value: row => row.status },
    { label: 'Descripción', value: row => row.description || 'Sin descripción' }
  ], products);
}

document.addEventListener('DOMContentLoaded', productosApp.init);
