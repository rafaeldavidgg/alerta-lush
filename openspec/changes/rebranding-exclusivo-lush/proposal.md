# Proposal

## Why

StockAlert nació como monitor genérico multi-tienda, pero en la práctica solo vigila Lush (`lush.com`) y arrastra abstracción, docs y UI para tiendas que nunca se usarán. Convertirlo en una app exclusivamente Lush con nombre e identidad en español lo deja "perfecto y sin tocar": menos código, menos confusión y mensaje claro para quien lo despliega.

## What Changes

- **BREAKING — Exclusividad Lush:** solo se aceptan URLs cuyo host sea `lush.com` o subdominio (p. ej. `www.lush.com`). Cualquier otra URL se rechaza con error bloqueante en formulario y API.
- **BREAKING — Eliminación del sistema multi-tienda:** se elimina `stores/` como registry (`index.ts`, `types.ts`, `example-shop.*`, `registry.test.ts`, catálogo visible, `/api/stores`, `SupportedStores.tsx`, `checkStoreSupport`, avisos "tienda no soportada"). La detección Lush pasa a ser directa y fija (JSON-LD + respaldo botón).
- Productos ya guardados de otras tiendas: se mantienen en Redis sin migrar ni borrar; simplemente no volverán a notificarse y no se aceptan nuevas altas no-Lush (decisión explícita del usuario: ignorar/mantener).
- Nuevo nombre de proyecto en español elegido: **Alerta Lush** (`alerta-lush`): renombra `package.json`, README, docs, títulos UI, mensajes Telegram con tono Lush, `manifest.ts`, `layout.tsx` metadata.
- **Rebranding visual Lush:** paleta/tipografía/estilo Lush (negro intenso + acentos verdes/artesanales), nuevo `favicon.svg`/iconos, `globals.css`, cabecera y copy 100% en español orientado a Lush ("Pega tu URL de lush.com…").
- Refactor de simplificación: `tienda` pasa a ser constante `"Lush"`; se elimina `docs/stores.md` / sección "Añadir una tienda"; se simplifican validación, formulario y worker al no resolver tiendas por dominio.
- Actualiza README, `docs/`, `.env.example` y workflow `monitor.yml` (nombres, ejemplos solo `lush.com`, variables renombradas si se decide).

Nombre decidido por el usuario (descartados `Vigía Lush`, `VigiLush`, `Avisa Lush`, `Lush en Stock`, `Atento Lush`; uso nominativo personal de "Lush" con nota de no-afiliación en README).

## Capabilities

### New Capabilities
- `identidad-marca`: nombre en español elegido, identidad visual Lush (colores, logo/iconos, tipografía), copy en español y tono de mensajes/bot con la nueva marca. Cubre lo observable (títulos, landing, notificaciones) sin duplicar lógica de otras specs.

### Modified Capabilities
- `availability-detection`: la detección deja de ser configurable por tienda y pasa a ser exclusivamente Lush directa (JSON-LD Product/Offer + respaldo texto botón `Añadir a la cesta` / `No disponible`); se eliminan registry, estrategias por dominio, catálogo y marcador demo.
- `product-tracking`: el registro solo acepta URLs `lush.com`; se elimina el catálogo visible y el aviso no-bloqueante (ahora error bloqueante); `tienda` es siempre Lush; la lista y el formulario reflejan una sola tienda. Productos históricos no-Lush se conservan pero quedan fuera del flujo de avisos.

## Impact

- A eliminar/simplificar: `stores/*`, `src/app/api/stores/*`, `src/components/SupportedStores.tsx`, `checkStoreSupport` en `ProductForm.tsx`, `docs/stores.md`, sección README "Añadir una tienda", tests de registry/example-shop.
- A modificar: `src/app/page.tsx`, `ProductForm.tsx`, `ProductList.tsx`, `globals.css`, `layout.tsx`, `manifest.ts`, `public/*` iconos, `core/validation.ts`, `core/url.ts` (si filtra dominio), `core/evaluate.ts`, `src/worker/*`, `src/app/api/products/*`, `telegram.ts` (copy), `package.json` (+ posible renombrado de vars `STOCKALERT_*` y secrets docs), `.github/workflows/monitor.yml`, `README.md`, `CONTRIBUTING.md`.
- Sin cambios de infra: mismo stack Vercel + GitHub Actions + Upstash + Telegram Bot API; sin nuevas dependencias.
