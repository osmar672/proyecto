# Corrección de campo Teléfono — v7

- Los campos de teléfono aceptan únicamente números (`0-9`) y un signo `+` opcional al inicio.
- Letras, espacios, guiones, paréntesis y otros símbolos se eliminan automáticamente al escribir o pegar.
- Se aplica en registro de cliente, solicitud de proveedor, administración de usuarios y administración de proveedores.
- Formatos válidos de ejemplo: `88888888` y `+50688888888`.
- Los teléfonos antiguos guardados con guiones o espacios se migran automáticamente al formato limpio al cargar la aplicación.
