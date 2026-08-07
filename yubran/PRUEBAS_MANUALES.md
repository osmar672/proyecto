# Pruebas manuales sugeridas

## Login y sonidos
- Abrir el login y usar una cuenta de demostración; debe escucharse un clic al seleccionar la cuenta.
- Intentar iniciar sesión con contraseña incorrecta; debe escucharse el sonido de error.
- Iniciar sesión correctamente; debe escucharse el sonido de éxito.
- Dentro del sistema, usar el botón de sonido para desactivarlo y comprobar que la preferencia queda guardada.

## Vista móvil en login
- Presionar **Vista móvil** y comprobar que el login se muestra dentro de una vista de 390 × 844 px.
- Presionar **Vista escritorio** para regresar al diseño normal.
- Verificar que el formulario siga siendo usable dentro de la simulación.

## Registro de cliente
- Crear una cuenta nueva desde **Registrarse como cliente**.
- Intentar registrar el mismo correo dos veces; debe bloquearse.
- Iniciar sesión con la cuenta recién creada y comprobar que entra a Productos.
- Confirmar que el cliente no puede entrar a Dashboard, Usuarios ni Proveedores escribiendo las URL manualmente.

## Solicitud de proveedor
- Enviar una solicitud desde **Quiero ser proveedor**.
- Verificar que no puede iniciar sesión antes de la aprobación.
- Iniciar sesión como administrador, abrir Usuarios y revisar la solicitud.
- Aprobar la solicitud; debe crearse un proveedor y una cuenta con rol Proveedor.
- Iniciar sesión con la cuenta aprobada; debe poder consultar Productos pero no administrar el sistema ni usar el carrito de cliente.
- Probar también el flujo de rechazo.

## Usuarios
- Crear un usuario desde el panel administrador.
- Editar nombre, teléfono, estado y rol.
- Filtrar por Usuarios/clientes, Administradores y Proveedores.
- Verificar que el administrador no pueda eliminar su propia cuenta ni dejar el sistema sin un administrador activo.
- Eliminar otro usuario y comprobar persistencia al recargar.

## Productos
- Crear y editar productos con varias imágenes.
- Como cliente, abrir una tarjeta del catálogo y cambiar entre imágenes del modal.
- Agregar productos al carrito, aumentar y disminuir cantidades, eliminar líneas y completar una compra simulada.
- Probar CRC y USD, incluyendo actualización de la tasa.

## Proveedores
- Crear, editar, consultar y eliminar un proveedor sin productos asociados.
- Intentar eliminar un proveedor con productos asociados; debe bloquearse.

## Reportes / PDF
- Como administrador, usar **Imprimir / PDF** en Usuarios, Productos y Proveedores.
- Confirmar que se abre una vista limpia de reporte.
- En el diálogo del navegador seleccionar **Guardar como PDF** y verificar el archivo resultante.

## Persistencia
- Recargar el navegador y comprobar que usuarios, solicitudes, productos, imágenes, proveedores, carrito y órdenes permanecen en LocalStorage.


## Asistente IA contextual

1. Inicie sesión como Administrador y abra **Asistente IA**. Compruebe que Dashboard, Usuarios, Productos y Proveedores siguen visibles.
2. Escriba `Ver lista de todos los usuarios`. Debe mostrar un resumen de cuentas.
3. Abra **Mi perfil**, cambie nombre o teléfono y confirme que se actualiza el nombre de la sesión.
4. Abra **Cambiar contraseña**, pruebe primero una contraseña actual incorrecta y luego la correcta.
5. Inicie sesión como Cliente y abra **Asistente IA**. Debe conservar acceso únicamente a Productos y Asistente IA.
6. Como Cliente, escriba `Ver lista de todos los usuarios`. Debe responder Acceso denegado y no mostrar nombres/correos globales.
7. Como Cliente, escriba `Mostrar mis compras`. Si ya realizó compras, deben mostrarse únicamente las órdenes de esa cuenta.
8. Escriba `Solicitar devolución ORD-...` con una orden propia. Debe crear una solicitud pendiente; luego `Ver mis devoluciones` debe mostrarla.
9. Si existe un Proveedor aprobado, inicie sesión y confirme que puede abrir Productos y Asistente IA, pero no consultar usuarios globales ni compras de clientes.
10. Active el sonido y confirme retroalimentación al enviar mensajes y completar acciones.


## Garantías v9

1. Inicie sesión como cliente y complete una compra con al menos un producto.
2. Abra **Garantías** y confirme que la compra aparezca con fecha y vigencia.
3. Pulse **Pedir garantía**, seleccione cantidad y tipo de problema, escriba al menos 20 caracteres y cree el ticket.
4. Verifique que el ticket aparezca como **Pendiente** y permanezca tras recargar la página.
5. Cierre sesión e ingrese como administrador.
6. Abra **Garantías** y confirme que el historial de compras de la empresa muestre la orden del cliente.
7. Abra el ticket y revise la lista automática de requisitos.
8. Responda primero como **En revisión** y confirme que el cliente pueda leer la respuesta.
9. Responda después como **Aprobada** o **Rechazada** y verifique el estado final.
10. Compruebe que el proveedor no puede entrar a `Garantias.html`.
