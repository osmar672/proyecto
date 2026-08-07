# Cambios v6

## Inicio de sesión
- Vista móvil movida desde Dashboard al login.
- Botón para crear cuenta de cliente.
- Botón para enviar solicitud de proveedor.
- Sonidos locales WAV con fallback Web Audio.

## Usuarios
- El módulo Clientes pasa a llamarse Usuarios.
- `Clientes.html` se conserva como redirección para evitar enlaces rotos.
- Filtros por usuarios/clientes, administradores y proveedores.
- Cambio de rol y estado.
- Alta, consulta, edición y eliminación de cuentas.
- Revisión, aprobación y rechazo de solicitudes de proveedor.

## Proveedores
- Una solicitud aprobada crea automáticamente el registro de proveedor y la cuenta con rol Proveedor.

## Reportes
- Usuarios, Productos y Proveedores tienen botón `Imprimir / PDF`.
- El navegador abre una vista de reporte y el diálogo de impresión; se puede elegir `Guardar como PDF`.

## Git
- No se incluye `.git`.
- Copiar estos archivos sobre la rama actual, revisar con `git status` y `git diff`, y luego crear el commit.
