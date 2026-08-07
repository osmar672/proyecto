# Ampliación: imágenes, catálogo, carrito y vista móvil

## Archivos modificados
- `page/Productos.html`
- `page/Dashboard.html`
- `src/js/Productos.js`
- `src/js/DASHBOARD.js`
- `src/js/app.js`
- `src/js/crud.js`
- `src/style/style.css`
- `README.md`

## Archivo nuevo
- `src/img/product-placeholder.svg`

## Comportamiento
1. Administrador: puede crear/editar productos y adjuntar hasta cuatro imágenes.
2. Cliente: solo accede a Productos y ve un catálogo visual.
3. Al seleccionar un producto se abre un modal con galería, información y botón para agregar al carrito.
4. El carrito permite sumar, restar y eliminar productos.
5. La compra es una simulación académica: contado o cuotas sin interés de demostración por entidad financiera.
6. El Dashboard incluye una vista responsive dentro de un marco de teléfono.

## Integración Git sugerida
```powershell
git status
git diff
git add page/Productos.html page/Dashboard.html src/js/Productos.js src/js/DASHBOARD.js src/js/app.js src/js/crud.js src/style/style.css src/img/product-placeholder.svg README.md CAMBIOS_CATALOGO_CARRITO_VISTA_MOVIL.md
git commit -m "feat(catalogo): agregar imagenes carrito y vista movil"
git push
```
