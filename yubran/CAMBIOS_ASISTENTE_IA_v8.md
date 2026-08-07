# Cambios v8 · Asistente IA contextual

- Nuevo módulo `page/AsistenteIA.html`.
- Nuevo controlador `src/js/AsistenteIA.js`.
- Navegación a Asistente IA agregada a las páginas internas.
- Acceso permitido a Administrador, Cliente y Proveedor, conservando restricciones del resto de módulos.
- El asistente utiliza la sesión real; no existe selector para suplantar roles.
- Consultas de compras y devoluciones se basan en datos de LocalStorage.
- Prueba de permisos para listado global de usuarios.
- Edición del perfil autenticado.
- Cambio de contraseña con comprobación de la contraseña actual.
- Solicitudes de devolución por número de orden para clientes.
- Sonidos e iconos SVG locales integrados.
- Diseño responsive y compatible con tema claro/oscuro.

## Integración Git recomendada

```bash
git status
git diff
git add .
git commit -m "feat(ia): agregar asistente contextual por rol"
git push
```

El paquete de corrección no contiene `.git`.
