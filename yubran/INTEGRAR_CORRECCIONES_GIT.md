# Integrar la versión v6 en un repositorio existente

Este paquete **no contiene `.git`**. No ejecute `git init` si el proyecto ya está en GitHub.

## 1. Cambiar a su rama y actualizarla

```bash
git switch nombre-de-su-rama
git pull origin nombre-de-su-rama
```

## 2. Copiar los archivos de la corrección

Copie el contenido de `proyecto/` sobre la raíz de su repositorio y acepte reemplazar los archivos modificados.

## 3. Revisar antes de guardar

```bash
git status
git diff
```

## 4. Commit sugerido

```bash
git add page src README.md PROMPTS_IA.md CHECKLIST_REQUISITOS.md PRUEBAS_MANUALES.md CAMBIOS_REGISTRO_USUARIOS_PDF_SONIDO_v6.md
git commit -m "feat(usuarios): agregar registros roles y reportes"
git push
```

Si el equipo necesita commits más atómicos, puede separar autenticación/registro, usuarios/reportes y sonidos en commits distintos.
