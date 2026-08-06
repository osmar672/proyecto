/**
 * Capa de Persistencia y Acceso a Datos (LocalStorage API)
 */
const STORAGE_KEY = 'dashboard_proveedores_data';

const StorageModule = (() => {
    // Datos iniciales de prueba (10 proveedores ficticios)
    const seedData = [
        { id: '1', empresa: 'TechSupplies S.A.', contacto: 'Carlos Mendoza', correo: 'contacto@techsupplies.com', telefono: '555-0192', telefonoSecundario: '', direccion: 'Av. Central 123', provincia: 'San José', ciudad: 'San José', codigoPostal: '10101', pais: 'Costa Rica', categoria: 'Tecnología', sitioWeb: 'https://techsupplies.com', descripcion: 'Distribuidor mayorista de hardware.', fechaRegistro: '2026-01-10', estado: 'Activo', observaciones: 'Entrega rápida' },
        { id: '2', empresa: 'Papelera Nacional', contacto: 'Ana Gómez', correo: 'ventas@papeleranacional.com', telefono: '555-0143', telefonoSecundario: '', direccion: 'Calle 4 Sur', provincia: 'Alajuela', ciudad: 'Alajuela', codigoPostal: '20101', pais: 'Costa Rica', categoria: 'Papelería', sitioWeb: '', descripcion: 'Insumos de oficina y papel.', fechaRegistro: '2026-02-01', estado: 'Activo', observaciones: 'Crédito a 30 días' },
        { id: '3', empresa: 'Limpieza Total', contacto: 'Roberto Fernández', correo: 'rfernandez@limpiezatotal.com', telefono: '555-0876', telefonoSecundario: '555-0877', direccion: 'Zona Industrial Lote 5', provincia: 'Heredia', ciudad: 'Heredia', codigoPostal: '40101', pais: 'Costa Rica', categoria: 'Limpieza', sitioWeb: 'https://limpiezatotal.com', descripcion: 'Productos químicos industriales.', fechaRegistro: '2025-11-15', estado: 'Inactivo', observaciones: '' },
        { id: '4', empresa: 'Constructora del Valle', contacto: 'Laura Morales', correo: 'lmorales@construvalle.com', telefono: '555-0321', telefonoSecundario: '', direccion: 'Km 12 Carretera Norte', provincia: 'Cartago', ciudad: 'Cartago', codigoPostal: '30101', pais: 'Costa Rica', categoria: 'Construcción', sitioWeb: '', descripcion: 'Materiales pesados de construcción.', fechaRegistro: '2026-08-01', estado: 'Activo', observaciones: 'Proveedor crítico' },
        { id: '5', empresa: 'Alimentos Frescos S.R.L.', contacto: 'Jorge Vargas', correo: 'j.vargas@alimentosfrescos.com', telefono: '555-0999', telefonoSecundario: '', direccion: 'Mercado Central Bodega 12', provincia: 'San José', ciudad: 'San José', codigoPostal: '10102', pais: 'Costa Rica', categoria: 'Alimentos', sitioWeb: '', descripcion: 'Perecederos y granos.', fechaRegistro: '2026-03-20', estado: 'Pendiente', observaciones: 'En proceso de auditoría' },
        { id: '6', empresa: 'Logística Express', contacto: 'Sofia Castro', correo: 'scastro@logexpress.com', telefono: '555-0444', telefonoSecundario: '', direccion: 'Terminal de Carga #3', provincia: 'Puntarenas', ciudad: 'Puntarenas', codigoPostal: '60101', pais: 'Costa Rica', categoria: 'Transporte', sitioWeb: 'https://logexpress.com', descripcion: 'Fletes nacionales.', fechaRegistro: '2025-09-12', estado: 'Suspendido', observaciones: 'Retrasos recurrentes' },
        { id: '7', empresa: 'Servicios de Seguridad Alfa', contacto: 'Miguel Ángel Rojas', correo: 'mrojas@seguridadalfa.com', telefono: '555-0777', telefonoSecundario: '', direccion: 'Edificio Alfa Piso 2', provincia: 'San José', ciudad: 'Escazú', codigoPostal: '10201', pais: 'Costa Rica', categoria: 'Servicios', sitioWeb: 'https://seguridadalfa.com', descripcion: 'Seguridad privada y monitoreo.', fechaRegistro: '2026-08-03', estado: 'Activo', observaciones: '' },
        { id: '8', empresa: 'Muebles & Oficinas', contacto: 'Elena Benítez', correo: 'ebenitez@mueblesoficina.com', telefono: '555-0222', telefonoSecundario: '', direccion: 'Av. Las Américas 45', provincia: 'Heredia', ciudad: 'Belén', codigoPostal: '40301', pais: 'Costa Rica', categoria: 'Mobiliario', sitioWeb: '', descripcion: 'Mobiliario ergonómico.', fechaRegistro: '2026-04-18', estado: 'Activo', observaciones: '' },
        { id: '9', empresa: 'Componentes Electrónicos SA', contacto: 'David Silva', correo: 'dsilva@compelectro.com', telefono: '555-0555', telefonoSecundario: '', direccion: 'Parque Tecnológico Ed. B', provincia: 'Cartago', ciudad: 'Cartago', codigoPostal: '30102', pais: 'Costa Rica', categoria: 'Electrónica', sitioWeb: 'https://compelectro.com', descripcion: 'Microcontroladores y sensores.', fechaRegistro: '2025-12-05', estado: 'Inactivo', observaciones: '' },
        { id: '10', empresa: 'Empaque Específico', contacto: 'Patricia Solís', correo: 'psolis@empaqueespecifico.com', telefono: '555-0666', telefonoSecundario: '', direccion: 'Calle 10 Norte', provincia: 'Alajuela', ciudad: 'Alajuela', codigoPostal: '20102', pais: 'Costa Rica', categoria: 'Otro', sitioWeb: '', descripcion: 'Cajas de cartón a medida.', fechaRegistro: '2026-07-29', estado: 'Activo', observaciones: '' }
    ];

    const obtenerProveedores = () => {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
            return seedData;
        }
        return JSON.parse(data);
    };

    const guardarProveedores = (proveedores) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(proveedores));
    };

    return {
        obtenerTodos: obtenerProveedores,
        obtenerPorId: (id) => obtenerProveedores().find(p => p.id === id),
        guardar: (proveedor) => {
            const proveedores = obtenerProveedores();
            if (proveedor.id) {
                // Actualizar
                const index = proveedores.findIndex(p => p.id === proveedor.id);
                if (index !== -1) proveedores[index] = proveedor;
            } else {
                // Crear nuevo
                proveedor.id = Date.now().toString();
                proveedor.fechaRegistro = new Date().toISOString().split('T')[0];
                proveedores.unshift(proveedor);
            }
            guardarProveedores(proveedores);
            return proveedor;
        },
        eliminar: (id) => {
            const proveedores = obtenerProveedores().filter(p => p.id !== id);
            guardarProveedores(proveedores);
        },
        vaciar: () => localStorage.removeItem(STORAGE_KEY)
    };
})();

/**
 * Módulo de Manejo de UI, Modales, Toast y Renderizado de Tablas
 */
const UIModule = (() => {
    // Componentes DOM
    const tbody = document.getElementById('tbody-proveedores');
    const toastContainer = document.getElementById('toast-container');

    const mostrarToast = (mensaje, tipo = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo}`;
        toast.textContent = mensaje;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    };

    const abrirModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
        }
    };

    const cerrarModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 250);
        }
    };

    const renderEstadisticas = (proveedores) => {
        const total = proveedores.length;
        const activos = proveedores.filter(p => p.estado === 'Activo').length;
        const inactivos = proveedores.filter(p => p.estado === 'Inactivo').length;
        const suspendidos = proveedores.filter(p => p.estado === 'Suspendido').length;

        const mesActual = new Date().toISOString().slice(0, 7); // YYYY-MM
        const registradosMes = proveedores.filter(p => p.fechaRegistro && p.fechaRegistro.startsWith(mesActual)).length;

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-activos').textContent = activos;
        document.getElementById('stat-inactivos').textContent = inactivos;
        document.getElementById('stat-suspendidos').textContent = suspendidos;
        document.getElementById('stat-mes').textContent = registradosMes;
    };

    const renderTabla = (proveedores) => {
        tbody.innerHTML = '';
        if (proveedores.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px;">No se encontraron proveedores.</td></tr>`;
            return;
        }

        proveedores.forEach(p => {
            const tr = document.createElement('tr');
            const claseBadge = `badge-${p.estado.toLowerCase()}`;
            tr.innerHTML = `
                <td><strong>${p.empresa}</strong></td>
                <td>${p.contacto}</td>
                <td>${p.correo}</td>
                <td>${p.telefono}</td>
                <td>${p.categoria}</td>
                <td><span class="badge ${claseBadge}">${p.estado}</span></td>
                <td>${p.fechaRegistro}</td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="ProveedoresApp.verDetalle('${p.id}')">Ver</button>
                    <button class="btn btn-primary btn-small" onclick="ProveedoresApp.prepararEditar('${p.id}')">Editar</button>
                    <button class="btn btn-danger btn-small" onclick="ProveedoresApp.prepararEliminar('${p.id}', '${p.empresa}')">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    const renderDetalle = (p) => {
        const contenedor = document.getElementById('detalle-contenido');
        contenedor.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item"><label>ID</label><span>${p.id}</span></div>
                <div class="detail-item"><label>Estado</label><span><span class="badge badge-${p.estado.toLowerCase()}">${p.estado}</span></span></div>
                <div class="detail-item"><label>Empresa</label><span>${p.empresa}</span></div>
                <div class="detail-item"><label>Contacto</label><span>${p.contacto}</span></div>
                <div class="detail-item"><label>Correo</label><span>${p.correo}</span></div>
                <div class="detail-item"><label>Teléfono Principal</label><span>${p.telefono}</span></div>
                <div class="detail-item"><label>Segundo Teléfono</label><span>${p.telefonoSecundario || 'N/A'}</span></div>
                <div class="detail-item"><label>Categoría</label><span>${p.categoria}</span></div>
                <div class="detail-item"><label>Sitio Web</label><span>${p.sitioWeb ? `<a href="${p.sitioWeb}" target="_blank">${p.sitioWeb}</a>` : 'N/A'}</span></div>
                <div class="detail-item"><label>Fecha Registro</label><span>${p.fechaRegistro}</span></div>
                <div class="detail-item"><label>Ubicación</label><span>${p.direccion || ''}, ${p.ciudad || ''}, ${p.provincia || ''}, ${p.pais || ''}</span></div>
                <div class="detail-item"><label>Código Postal</label><span>${p.codigoPostal || 'N/A'}</span></div>
                <div class="detail-item full-width" style="grid-column: span 2;"><label>Descripción</label><span>${p.descripcion || 'Sin descripción'}</span></div>
                <div class="detail-item full-width" style="grid-column: span 2;"><label>Observaciones</label><span>${p.observaciones || 'Sin observaciones'}</span></div>
            </div>
        `;
    };

    const limpiarErroresFormulario = () => {
        document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-control').forEach(el => el.classList.remove('invalid'));
    };

    const mostrarErroresFormulario = (errores) => {
        limpiarErroresFormulario();
        Object.keys(errores).forEach(campo => {
            const input = document.getElementById(campo);
            const errorContainer = document.getElementById(`error-${campo}`);
            if (input) input.classList.add('invalid');
            if (errorContainer) errorContainer.textContent = errores[campo];
        });
    };

    return {
        mostrarToast,
        abrirModal,
        cerrarModal,
        renderEstadisticas,
        renderTabla,
        renderDetalle,
        limpiarErroresFormulario,
        mostrarErroresFormulario
    };
})();

/**
 * Controlador Principal del Módulo de Administración de Proveedores
 */
const ProveedoresApp = (() => {
    // Estado interno de la aplicación
    let estadoApp = {
        proveedores: [],
        filtrados: [],
        paginacion: {
            paginaActual: 1,
            filasPorPagina: 10
        },
        orden: {
            columna: 'empresa',
            ascendente: true
        },
        idEliminarSeleccionado: null
    };

    const init = () => {
        cargarDatos();
        configurarEventListeners();
    };

    const cargarDatos = () => {
        estadoApp.proveedores = StorageModule.obtenerTodos();
        aplicarFiltrosYBusqueda();
    };

    const aplicarFiltrosYBusqueda = () => {
        const textoBusqueda = document.getElementById('input-busqueda').value.toLowerCase().trim();
        const categoriaFiltro = document.getElementById('filtro-categoria').value;
        const estadoFiltro = document.getElementById('filtro-estado').value;

        estadoApp.filtrados = estadoApp.proveedores.filter(p => {
            const coincideBusqueda = 
                p.empresa.toLowerCase().includes(textoBusqueda) ||
                p.contacto.toLowerCase().includes(textoBusqueda) ||
                p.correo.toLowerCase().includes(textoBusqueda) ||
                p.ciudad.toLowerCase().includes(textoBusqueda) ||
                p.provincia.toLowerCase().includes(textoBusqueda);

            const coincideCategoria = categoriaFiltro === '' || p.categoria === categoriaFiltro;
            const coincideEstado = estadoFiltro === '' || p.estado === estadoFiltro;

            return coincideBusqueda && coincideCategoria && coincideEstado;
        });

        aplicarOrdenamiento();
    };

    const aplicarOrdenamiento = () => {
        const { columna, ascendente } = estadoApp.orden;
        estadoApp.filtrados.sort((a, b) => {
            let valA = a[columna] ? a[columna].toString().toLowerCase() : '';
            let valB = b[columna] ? b[columna].toString().toLowerCase() : '';
            
            if (valA < valB) return ascendente ? -1 : 1;
            if (valA > valB) return ascendente ? 1 : -1;
            return 0;
        });

        estadoApp.paginacion.paginaActual = 1;
        actualizarVista();
    };

    const actualizarVista = () => {
        const { paginaActual, filasPorPagina } = estadoApp.paginacion;
        const inicio = (paginaActual - 1) * filasPorPagina;
        const fin = inicio + parseInt(filasPorPagina);
        const paginados = estadoApp.filtrados.slice(inicio, fin);

        UIModule.renderTabla(paginados);
        UIModule.renderEstadisticas(estadoApp.proveedores);
        actualizarControlesPaginacion();
    };

    const actualizarControlesPaginacion = () => {
        const totalPaginas = Math.ceil(estadoApp.filtrados.length / estadoApp.paginacion.filasPorPagina) || 1;
        document.getElementById('info-paginacion').textContent = `Página ${estadoApp.paginacion.paginaActual} de ${totalPaginas}`;
        document.getElementById('btn-pag-prev').disabled = estadoApp.paginacion.paginaActual === 1;
        document.getElementById('btn-pag-next').disabled = estadoApp.paginacion.paginaActual >= totalPaginas;
    };

    const configurarEventListeners = () => {
        // Eventos de Búsqueda y Filtros
        document.getElementById('input-busqueda').addEventListener('input', aplicarFiltrosYBusqueda);
        document.getElementById('filtro-categoria').addEventListener('change', aplicarFiltrosYBusqueda);
        document.getElementById('filtro-estado').addEventListener('change', aplicarFiltrosYBusqueda);
        
        document.getElementById('btn-limpiar-filtros').addEventListener('click', () => {
            document.getElementById('input-busqueda').value = '';
            document.getElementById('filtro-categoria').value = '';
            document.getElementById('filtro-estado').value = '';
            aplicarFiltrosYBusqueda();
        });

        // Ordenamiento por encabezado de tabla
        document.querySelectorAll('#tabla-proveedores th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const col = th.dataset.sort;
                if (estadoApp.orden.columna === col) {
                    estadoApp.orden.ascendente = !estadoApp.orden.ascendente;
                } else {
                    estadoApp.orden.columna = col;
                    estadoApp.orden.ascendente = true;
                }
                aplicarOrdenamiento();
            });
        });

        // Paginación
        document.getElementById('btn-pag-prev').addEventListener('click', () => {
            if (estadoApp.paginacion.paginaActual > 1) {
                estadoApp.paginacion.paginaActual--;
                actualizarVista();
            }
        });

        document.getElementById('btn-pag-next').addEventListener('click', () => {
            const totalPaginas = Math.ceil(estadoApp.filtrados.length / estadoApp.paginacion.filasPorPagina);
            if (estadoApp.paginacion.paginaActual < totalPaginas) {
                estadoApp.paginacion.paginaActual++;
                actualizarVista();
            }
        });

        document.getElementById('select-filas').addEventListener('change', (e) => {
            estadoApp.paginacion.filasPorPagina = parseInt(e.target.value);
            estadoApp.paginacion.paginaActual = 1;
            actualizarVista();
        });

        // Abrir modal de nuevo proveedor
        document.getElementById('btn-nuevo-proveedor').addEventListener('click', () => {
            limpiarFormulario();
            document.getElementById('modal-form-title').textContent = 'Registrar Proveedor';
            UIModule.abrirModal('modal-form');
        });

        // Modal Cierres Automáticos por Data Attribute
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => UIModule.cerrarModal(btn.dataset.closeModal));
        });

        // Submit Formulario Proveedor (Crear/Editar)
        document.getElementById('form-proveedor').addEventListener('submit', guardarProveedor);

        // Confirmar Eliminación
        document.getElementById('btn-confirmar-eliminar').addEventListener('click', () => {
            if (estadoApp.idEliminarSeleccionado) {
                StorageModule.eliminar(estadoApp.idEliminarSeleccionado);
                UIModule.mostrarToast('Proveedor eliminado correctamente', 'success');
                UIModule.cerrarModal('modal-confirm');
                cargarDatos();
            }
        });
    };

    const extraerDatosFormulario = () => {
        return {
            id: document.getElementById('prov-id').value,
            empresa: document.getElementById('empresa').value.trim(),
            contacto: document.getElementById('contacto').value.trim(),
            correo: document.getElementById('correo').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            telefonoSecundario: document.getElementById('telefonoSecundario').value.trim(),
            categoria: document.getElementById('categoria').value,
            estado: document.getElementById('estado').value,
            sitioWeb: document.getElementById('sitioWeb').value.trim(),
            direccion: document.getElementById('direccion').value.trim(),
            ciudad: document.getElementById('ciudad').value.trim(),
            provincia: document.getElementById('provincia').value.trim(),
            codigoPostal: document.getElementById('codigoPostal').value.trim(),
            pais: document.getElementById('pais').value.trim(),
            descripcion: document.getElementById('descripcion').value.trim(),
            observaciones: document.getElementById('observaciones').value.trim()
        };
    };

    const guardarProveedor = (e) => {
        e.preventDefault();
        const datos = extraerDatosFormulario();
        const validacion = ValidacionesModule.validarFormulario(datos, datos.id);

        if (!validacion.esValido) {
            UIModule.mostrarErroresFormulario(validacion.errores);
            return;
        }

        UIModule.limpiarErroresFormulario();
        
        // Conservar la fecha original si es edición
        if (datos.id) {
            const original = StorageModule.obtenerPorId(datos.id);
            if (original) datos.fechaRegistro = original.fechaRegistro;
        }

        StorageModule.guardar(datos);
        UIModule.mostrarToast(`Proveedor ${datos.id ? 'actualizado' : 'registrado'} con éxito`);
        UIModule.cerrarModal('modal-form');
        limpiarFormulario();
        cargarDatos();
    };

    const limpiarFormulario = () => {
        document.getElementById('form-proveedor').reset();
        document.getElementById('prov-id').value = '';
        UIModule.limpiarErroresFormulario();
    };

    // Métodos expuestos globalmente para acciones de fila
    const verDetalle = (id) => {
        const proveedor = StorageModule.obtenerPorId(id);
        if (proveedor) {
            UIModule.renderDetalle(proveedor);
            UIModule.abrirModal('modal-detalle');
        }
    };

    const prepararEditar = (id) => {
        const p = StorageModule.obtenerPorId(id);
        if (!p) return;

        limpiarFormulario();
        document.getElementById('modal-form-title').textContent = 'Editar Proveedor';
        
        document.getElementById('prov-id').value = p.id;
        document.getElementById('empresa').value = p.empresa || '';
        document.getElementById('contacto').value = p.contacto || '';
        document.getElementById('correo').value = p.correo || '';
        document.getElementById('telefono').value = p.telefono || '';
        document.getElementById('telefonoSecundario').value = p.telefonoSecundario || '';
        document.getElementById('categoria').value = p.categoria || '';
        document.getElementById('estado').value = p.estado || 'Activo';
        document.getElementById('sitioWeb').value = p.sitioWeb || '';
        document.getElementById('direccion').value = p.direccion || '';
        document.getElementById('ciudad').value = p.ciudad || '';
        document.getElementById('provincia').value = p.provincia || '';
        document.getElementById('codigoPostal').value = p.codigoPostal || '';
        document.getElementById('pais').value = p.pais || '';
        document.getElementById('descripcion').value = p.descripcion || '';
        document.getElementById('observaciones').value = p.observaciones || '';

        UIModule.abrirModal('modal-form');
    };

    const prepararEliminar = (id, nombreEmpresa) => {
        estadoApp.idEliminarSeleccionado = id;
        document.getElementById('confirm-empresa-nombre').textContent = nombreEmpresa;
        UIModule.abrirModal('modal-confirm');
    };

    // Inicializar al cargar el DOM
    document.addEventListener('DOMContentLoaded', init);

    return {
        verDetalle,
        prepararEditar,
        prepararEliminar
    };
})();

