# Tasks

## 1. Detección exclusiva Lush

- [x] 1.1 Crear `core/lush-detector.ts` con `isLushHost` y cadena fija JSON-LD → botón (`Añadir a la cesta` / `No disponible`) y verificar con `npx vitest run` un test nuevo Lush-only en verde
- [x] 1.2 Reescribir `core/evaluate.ts` para usar la cadena fija Lush (sin `getStoreForUrl`) devolviendo `unknown` para no-Lush y verificar que el test de evaluación Lush pasa y el de tienda desconocida da `unknown` sin notificar
- [x] 1.3 Eliminar `stores/index.ts`, `stores/types.ts`, `stores/example-shop.*`, `stores/registry.test.ts`, `stores/lush.ts` y la estrategia headless no usada, y verificar que `npx vitest run` no referencia ningún import roto y `npm run typecheck` pasa

## 2. Registro solo lush.com

- [x] 2.1 Endurecer `core/url.ts` + `core/validation.ts` para rechazar URLs no `lush.com` con error en español y `tienda` constante `Lush`, y verificar que los tests de validación (URL Lush válida aceptada, no-Lush y `not-a-url` rechazadas sin persistir) pasan
- [x] 2.2 Actualizar `src/app/api/products/*` y el worker para propagar el error bloqueante y fijar `tienda` Lush, y verificar con tests de API/worker que una URL no-Lush devuelve error y no se persiste ni notifica
- [x] 2.3 Documentar en el mensaje de error y ayuda que los productos históricos no-Lush se conservan sin notificar, y verificar en UI y logs que no hay migración ni borrado

## 3. UI sin catálogo y copy en español

- [x] 3.1 Eliminar `GET /api/stores`, `SupportedStores.tsx`, `checkStoreSupport` y el aviso no-bloqueante en `ProductForm.tsx`/`page.tsx`, sustituyendo por texto fijo "Solo Lush (lush.com)" y error bloqueante, y verificar que `npm run typecheck` y los tests de componentes pasan sin fetchear `/api/stores`
- [x] 3.2 Reescribir copy en español orientado a Lush (subtítulo, placeholder `lush.com`, ayuda `chat_id`, estados y mensajes de éxito/error con marca) manteniendo `aria-describedby`/`role="alert|status"` y foco, y verificar manualmente con teclado que el error bloqueante recibe foco y se anuncia
- [x] 3.3 Prefijar mensajes Telegram (alerta + respuesta `chat_id` del bot) con la nueva marca manteniendo etiqueta+URL en la alerta, y verificar con los tests de `telegram*.test.ts` actualizados en verde

## 4. Identidad visual y renombrado de marca

- [x] 4.1 Aplicar paleta Lush en `globals.css` (tokens claro/oscuro, foco visible, `prefers-reduced-motion`) y cabecera con marca, y verificar visualmente en claro y oscuro que el contraste es legible y el foco es visible
- [x] 4.2 Crear nuevo `favicon.svg` y regenerar `favicon-32x32.png`, `favicon-16x16.png`, `apple-touch-icon.png`, `apple-icon.png` más `layout.tsx`/`manifest.ts` con nombre y `themeColor` nuevos, y verificar que `npm run build` incluye los iconos y la pestaña muestra la nueva marca
- [x] 4.3 Renombrar `package.json` a `alerta-lush`, README, `docs/` (eliminar `docs/stores.md` y sección "Añadir una tienda") y `ALERTA_STORE_BACKEND` con fallback a `STOCKALERT_STORE_BACKEND`, y verificar que `npm run worker` funciona con ambas vars y que ningún texto visible dice `StockAlert`

## 5. Integración y cierre

- [x] 5.1 Actualizar `.env.example`, README de despliegue y `.github/workflows/monitor.yml` (ejemplos solo `lush.com`) y verificar que la guía funciona de principio a fin en una lectura
- [x] 5.2 Ejecutar `npm test`, `npm run typecheck` y `npm run lint` y verificar que los tres pasan en limpio antes de abrir PR
