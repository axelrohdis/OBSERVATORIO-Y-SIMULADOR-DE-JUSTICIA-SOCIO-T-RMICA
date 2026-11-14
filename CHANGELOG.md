# Registro de cambios

Cada hito se anota arriba de los anteriores. Formato fijo para que Claude y ChatGPT lo lean igual.

## 2026-11-13 23:59 — Línea base y repositorio en GitHub
- Qué se modificó: se inicializó Git y se subió el proyecto a GitHub (rama main).
- Archivos que cambiaron: ninguno de código; se agregó este CHANGELOG.md.
- Por qué: tener una única fuente de verdad para Claude y ChatGPT.
- Commit: 13fb71b (initial project snapshot).
- Pruebas ejecutadas: en la copia de Claude, `tsc --noEmit`, `npm test` y `npm run build`; en el equipo de Axel, solo verificación de estructura y versiones (git status, npm ls, grep de archivos clave).
- Resultado: tsc sin errores, 12 de 12 pruebas, build correcto (copia de Claude). Versiones y archivos coinciden con la copia de Claude.
- Pendiente: datos reales de Earth Engine (hoy todo es sintético, 17 de 17 con demo: true); regiones definitivas Concepción y Nonguén; capa social; grilla de tendencias; panel de comparación; publicación pública; página en inglés, demo y declaración de IA.
- Autor: Axel con Claude.