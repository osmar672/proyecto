# Integrar este proyecto en el repositorio existente sin conflictos

El ZIP no contiene `.git`, por lo que no altera las ramas, commits, remotos ni Pull Requests existentes.

## 1. Proteger el trabajo actual

```bash
git status
```

Si hay cambios sin guardar:

```bash
git add .
git commit -m "chore: respaldar trabajo antes de integrar"
```

## 2. Cambiar a la rama de trabajo

```bash
git fetch origin
git switch nombre-de-la-rama
git pull origin nombre-de-la-rama
```

## 3. Copiar los archivos

Copie el contenido de la carpeta `proyecto` del ZIP sobre la raíz del repositorio. Acepte reemplazar los archivos con el mismo nombre.

El archivo vacío anterior `src/img/img` puede eliminarse:

```bash
git rm src/img/img
```

Si Git indica que no existe, continúe normalmente.

## 4. Revisar antes de confirmar

```bash
git status
git diff --stat
git diff
```

## 5. Crear commits por partes

No suba todo en un único commit. Ejemplo:

```bash
git add page/index.html src/js/index.js src/js/app.js src/style/styles2.css
git commit -m "feat(auth): completar login por roles"

git add page/Dashboard.html src/js/DASHBOARD.js src/style/style.css
git commit -m "feat(dashboard): agregar resumen administrativo"

git add page/Clientes.html src/js/clientes.js src/js/crud.js
git commit -m "feat(clientes): implementar CRUD completo"

git add page/Productos.html src/js/Productos.js
git commit -m "feat(productos): implementar gestión de inventario"

git add page/Proveedores.html src/js/proveedores.js
git commit -m "feat(proveedores): implementar CRUD completo"

git add README.md PROMPTS_IA.md CHECKLIST_REQUISITOS.md docs capturas .github
git commit -m "docs: completar evidencias del mini proyecto"
```

## 6. Subir la rama

```bash
git push origin nombre-de-la-rama
```

Luego cree un Pull Request hacia `main`, solicite revisión de otro integrante y resuelva cualquier conflicto desde la rama antes de fusionar.
