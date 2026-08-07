# NovaAdmin CR

Sistema administrativo web desarrollado con **HTML5, CSS3, JavaScript y LocalStorage** para el Primer Mini Proyecto de Desarrollo Web.

## Funcionalidades

- Login funcional con validación de correo y contraseña.
- Autenticación local con contraseñas comparadas mediante SHA-256.
- Autorización por roles:
  - **Administrador:** acceso completo a Dashboard, Asistente IA, Usuarios, Productos y Proveedores.
  - **Cliente:** acceso al catálogo de Productos, carrito, compra simulada y Asistente IA contextual.
  - **Proveedor:** acceso de consulta al catálogo de Productos y Asistente IA contextual después de que su solicitud sea aprobada.
- Dashboard responsive con tarjetas resumen, alertas de inventario, gráfico por categorías y actividad reciente.
- Gestión de **Usuarios** con CRUD de cuentas y filtro por clientes/usuarios, administradores y proveedores. El requisito de clientes se cubre mediante las cuentas con rol Cliente.
- CRUD completo de productos para Administrador y catálogo de solo lectura para Cliente.
- CRUD completo de proveedores.
- Búsqueda, filtros, paginación, validaciones, modales y notificaciones.
- Persistencia de datos, sesión, solicitudes de proveedor, tema y preferencias de sonido con LocalStorage.
- Tema claro/oscuro, animaciones, imágenes SVG e iconos.
- Sonidos locales WAV para clics, éxitos, advertencias y errores, con Web Audio como respaldo si el navegador bloquea un archivo.
- Prevención de eliminación de proveedores que todavía tienen productos asociados.

## Asistente IA contextual

- El menú incluye un módulo **Asistente IA** disponible para Administrador, Cliente y Proveedor.
- El asistente utiliza la sesión real guardada en LocalStorage; **no permite cambiar o simular el rol desde la interfaz**.
- Las consultas respetan permisos: un Cliente o Proveedor no puede obtener el listado global de usuarios.
- El Cliente puede consultar sus órdenes reales almacenadas, revisar solicitudes de devolución y crear una solicitud escribiendo el número `ORD-...`.
- El Administrador puede consultar un resumen de usuarios y compras globales.
- El asistente abre modales funcionales para **Mi perfil** y **Cambiar contraseña**. Los cambios se guardan en LocalStorage.
- El campo de teléfono del perfil mantiene la regla de solo números y un `+` opcional al inicio.
- Esta integración es una **simulación académica local basada en reglas**; no envía datos privados a un servicio externo de IA.
- Se conservan el tema, sonidos, iconos SVG locales y diseño responsive del resto de NovaAdmin CR.

## Cuentas de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@nova.cr` | `Admin123*` |
| Cliente | `cliente@nova.cr` | `Cliente123*` |

## Cómo ejecutar

No requiere instalación ni dependencias.

1. Descargue o clone el repositorio.
2. Ejecute `INICIAR_SERVIDOR.bat` si tiene Python instalado, o abra el proyecto con **Live Server** en VS Code.
3. Ingrese a `http://localhost:8000` o a la dirección mostrada por Live Server.

> Se recomienda usar un servidor local porque el comportamiento de LocalStorage entre archivos `file://` puede variar según el navegador.

## Estructura

```text
proyecto/
├── index.html
├── page/
│   ├── index.html
│   ├── Dashboard.html
│   ├── AsistenteIA.html
│   ├── Usuarios.html
│   ├── Clientes.html  # redirección de compatibilidad
│   ├── Productos.html
│   └── Proveedores.html
├── src/
│   ├── audio/
│   ├── img/
│   ├── js/
│   └── style/
├── docs/
├── capturas/
├── PROMPTS_IA.md
└── CHECKLIST_REQUISITOS.md
```

## Cómo subir los cambios sin conflictos

Este ZIP **no contiene una carpeta `.git`**, por lo que no reemplaza el historial ni la configuración del repositorio existente.

1. Antes de copiar los archivos, cambie a su rama:

```bash
git switch nombre-de-su-rama
git pull origin nombre-de-su-rama
```

2. Copie el contenido de la carpeta `proyecto` sobre la raíz del repositorio y acepte reemplazar los archivos existentes.
3. Revise los cambios:

```bash
git status
git diff
```

4. Cree commits pequeños y descriptivos. Ejemplo:

```bash
git add page/index.html src/js/index.js src/style/styles2.css
git commit -m "feat(auth): completar inicio de sesión"
```

5. Suba la rama:

```bash
git push origin nombre-de-su-rama
```

6. Cree un Pull Request hacia `main`. No copie la carpeta `.git` de otro proyecto y no use `git init` dentro de un repositorio ya existente.

## Consideración de seguridad

LocalStorage cumple el objetivo académico del proyecto, pero no es apropiado para almacenar autenticación sensible en producción. Una aplicación real debe validar credenciales en un backend, usar HTTPS, sesiones seguras y una base de datos protegida.


## Funciones ampliadas del catálogo

- El administrador puede adjuntar hasta 4 imágenes por producto desde el formulario. Las imágenes se redimensionan y comprimen antes de guardarse en LocalStorage.
- El cliente dispone de un catálogo visual de solo lectura con fotografías y detalle emergente con galería.
- El cliente puede agregar productos a un carrito persistente, aumentar/disminuir cantidades y eliminar líneas.
- El flujo **Comprar** incluye contado o una simulación académica de cuotas sin interés con BAC Credomatic, Banco Nacional, BCR, Banco Popular y LAFISE. Los plazos son datos de demostración, no ofertas bancarias reales.
- Al confirmar una compra simulada se registra la orden en LocalStorage y se descuentan existencias.
- La pantalla de **inicio de sesión** incluye un botón **Vista móvil** que cambia el login a una simulación responsive de 390 × 844 px para revisar cómo se ve en un teléfono.

## Pago en colones o dólares y tipo de cambio

- Antes de confirmar una compra, el cliente puede elegir **CRC (colones)** o **USD (dólares)**.
- Si selecciona USD, el navegador consulta la tasa de referencia **USD/CRC del BCCR** mediante Frankfurter API:
  `https://api.frankfurter.dev/v2/rate/USD/CRC?providers=BCCR`
- La aplicación conserva temporalmente la última tasa válida en LocalStorage para evitar consultas innecesarias. Si la API falla, solo se usa una tasa guardada reciente; sin una tasa válida el pago en USD queda bloqueado.
- El margen de cambio de la empresa es del **5% sobre el monto convertido a dólares**:

```text
montoBaseUSD = totalCRC / tasaBCCR
margenUSD = montoBaseUSD * 0.05
totalUSD = montoBaseUSD + margenUSD
```

- En la pantalla de pago se muestran por separado la tasa BCCR, la conversión base, el margen del 5% y el total final en USD.
- Las órdenes guardan la moneda elegida, la tasa utilizada, la fecha de referencia, el margen aplicado y el monto final.

> El proyecto sigue siendo académico. El tipo de cambio sí se consulta desde una API externa, por lo que para obtener una tasa nueva se requiere conexión a Internet.


## Registro de clientes y solicitudes de proveedor

- Desde el inicio de sesión cualquier persona puede **registrarse como cliente**. La cuenta queda activa y puede iniciar sesión de inmediato.
- El botón **Quiero ser proveedor** abre un formulario público. La solicitud se guarda como **Pendiente** y no permite iniciar sesión hasta que un administrador la apruebe.
- En **Usuarios**, el administrador revisa solicitudes pendientes. Al aprobar una solicitud se crea:
  1. el registro del proveedor;
  2. una cuenta de usuario con rol **Proveedor** vinculada al registro.
- El administrador puede cambiar el rol y estado de los usuarios desde el módulo Usuarios.

## Reportes e impresión PDF

Los módulos **Usuarios**, **Productos** y **Proveedores** incluyen el botón **Imprimir / PDF**. El navegador genera un reporte limpio y abre el diálogo de impresión. Desde ese diálogo se puede seleccionar **Guardar como PDF** o una impresora física. No se requiere una librería externa.

## Garantías y tickets (v9)

- El cliente puede revisar sus compras y solicitar garantía por producto desde `Garantias.html`.
- La política de demostración usa 12 meses desde la fecha de compra.
- Cada solicitud crea un ticket con conversación y estado: Pendiente, En revisión, Aprobada o Rechazada.
- El administrador puede consultar el historial completo de compras de la empresa, validar orden, cliente, producto, cantidad y vigencia, y responder el ticket.
- Una garantía no puede aprobarse si la validación automática detecta que no cumple los requisitos básicos.
- Los tickets y respuestas se guardan en LocalStorage bajo `novaadmin_warranty_tickets`.
