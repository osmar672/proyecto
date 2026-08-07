# Correcciones de interfaz

- Se sustituyeron los emojis y símbolos usados como controles visuales por iconos SVG vectoriales.
- Los modales ahora se mueven al `body` al inicializarse para evitar que un contenedor animado limite `position: fixed`.
- El fondo del modal usa un `z-index` alto y cubre el viewport completo.
- Los modales se centran horizontal y verticalmente.
- El scroll se limita al cuerpo interno del modal; encabezado y botones permanecen visibles.
- Se mejoró el scrollbar para los temas claro y oscuro.
- Se conservaron las rutas y nombres de archivos existentes para reducir conflictos al integrar los cambios en Git.
