# Corrección de roles: Administrador y Cliente

Se eliminó el rol Operador y se dejó únicamente:

- **Administrador**: acceso completo a Dashboard, Clientes, Productos y Proveedores; puede crear, consultar, editar y eliminar.
- **Cliente**: acceso exclusivo a Productos en modo de solo lectura; puede buscar, filtrar y abrir el detalle de los productos, pero no puede crear, editar ni eliminar.

## Cuenta de demostración del Cliente

- Correo: `cliente@nova.cr`
- Contraseña: `Cliente123*`

## Protección aplicada

- Al iniciar sesión como Cliente se redirige directamente a `Productos.html`.
- El menú del Cliente solo muestra Productos.
- Si el Cliente intenta abrir Dashboard, Clientes o Proveedores escribiendo la URL, se redirige de nuevo a Productos.
- Los botones Nuevo, Editar y Eliminar no se muestran al Cliente.
- La lógica CRUD también valida permisos antes de crear, editar o eliminar, aunque se intente ejecutar la acción manualmente.
- Se incluye migración automática para eliminar del LocalStorage la cuenta anterior de Operador.
