# Checklist de cumplimiento del enunciado

## Requerimiento principal

- [x] Dashboard administrativo completamente funcional.
- [x] Diseño profesional e interfaz amigable.

## Login

- [x] El sistema inicia con pantalla de inicio de sesión.
- [x] Validación de usuario y contraseña.
- [x] Credenciales correctas permiten entrar al dashboard.
- [x] Credenciales incorrectas muestran mensaje de error.
- [x] Autenticación basada en objetos y LocalStorage.
- [x] Sesión y autorización por roles.

## Dashboard

- [x] Menú lateral.
- [x] Encabezado.
- [x] Información del usuario.
- [x] Área principal de trabajo.
- [x] Tarjetas con información resumida.
- [x] Diseño responsive.
- [x] Alertas, gráfico y actividad reciente como mejoras adicionales.

## CRUD de clientes / usuarios

- [x] El módulo visible se denomina **Usuarios**.
- [x] Las cuentas con rol Cliente representan los clientes del sistema.
- [x] Registrar clientes desde el panel administrador o desde el registro público.
- [x] Consultar y buscar.
- [x] Editar información, estado y tipo de usuario.
- [x] Eliminar con permiso de administrador.
- [x] Filtrar por usuarios/clientes, administradores y proveedores.
- [x] Validaciones y persistencia.

## CRUD de productos

- [x] Registrar.
- [x] Consultar y buscar.
- [x] Modificar.
- [x] Eliminar con permiso de administrador.
- [x] Asociación con proveedor, precio, stock, categoría y estado.

## CRUD de proveedores

- [x] Registrar.
- [x] Consultar y buscar.
- [x] Editar.
- [x] Eliminar con permiso de administrador.
- [x] Protección de integridad cuando existen productos asociados.

## Requerimientos técnicos

- [x] HTML5 semántico.
- [x] CSS3.
- [x] JavaScript.
- [x] Variables y constantes.
- [x] Objetos y arreglos.
- [x] Funciones.
- [x] Eventos del DOM.
- [x] Condicionales y ciclos.
- [x] Manipulación dinámica del DOM.
- [x] LocalStorage.
- [x] Métodos de arreglos: `map`, `filter`, `find`, `some`, `reduce`, `sort`, `slice`.
- [x] Formularios y validaciones.
- [x] Código modularizado.

## Git y trabajo colaborativo

- [ ] Ramas creadas por el equipo en el repositorio real.
- [ ] Commits frecuentes y descriptivos realizados por cada integrante.
- [ ] Pull Requests revisados y fusionados.
- [ ] Historial limpio que evidencie participación.

> Estas cuatro evidencias deben realizarse realmente en GitHub. No pueden generarse correctamente dentro de un ZIP.

## Inteligencia artificial

- [x] Prompts documentados.
- [x] Planeación y contexto.
- [x] Revisión crítica de respuestas.
- [x] Correcciones e iteraciones.
- [x] Adaptación del código generado.

## Entregables

- [x] Código fuente completo.
- [ ] Enlace del repositorio Git, agregado por el equipo al entregar.
- [x] Carpeta organizada.
- [x] README.
- [x] Documento de prompts.
- [x] Carpeta para capturas de pantalla.
- [x] Investigación previa incluida en `docs/`.


## Control de acceso por roles

- [x] Administrador con acceso completo al Dashboard y a Usuarios, Productos y Proveedores.
- [x] Cliente con acceso al catálogo, detalle, carrito y compra simulada.
- [x] Proveedor aprobado con acceso de consulta al catálogo.
- [x] Cliente y Proveedor no pueden crear, editar ni eliminar productos.
- [x] Las rutas administrativas redirigen a Cliente y Proveedor hacia Productos.
- [x] Solicitudes de proveedor requieren aprobación administrativa antes de crear la cuenta.


## Mejoras adicionales verificables

- [x] Vista móvil conmutable desde la pantalla de inicio de sesión.
- [x] Registro público de clientes.
- [x] Formulario público para solicitud de proveedor con estado Pendiente.
- [x] Aprobación/rechazo de proveedores desde Usuarios.
- [x] Cambio de tipo de usuario y estado.
- [x] Reporte imprimible / Guardar como PDF de Usuarios.
- [x] Reporte imprimible / Guardar como PDF de Productos.
- [x] Reporte imprimible / Guardar como PDF de Proveedores.
- [x] Sonidos locales para clic, éxito, advertencia y error.
- [x] Módulo adicional Asistente IA accesible según sesión autenticada.
- [x] Consultas del asistente respetan autorización por rol.
- [x] Cliente puede consultar sus compras y devoluciones desde el asistente.
- [x] Administrador puede consultar resumen global de usuarios y compras.
- [x] Perfil y contraseña pueden actualizarse desde modales funcionales del asistente.
- [x] Asistente usa sonidos e iconos SVG locales sin emojis ni CDN.
