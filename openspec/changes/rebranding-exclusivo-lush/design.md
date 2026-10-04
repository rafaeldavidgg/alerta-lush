# Design

## Context

Ver `proposal.md` (Why). Estado actual: detección configurable por tienda en `stores/` + `core/detectors/` + `core/evaluate.ts` (`getStoreForUrl`); registro con `core/url.ts` (`parseProductUrl` deriva `tienda`) y `core/validation.ts` compartida entre API y `ProductForm.tsx`; UI con catálogo (`GET /api/stores`, `SupportedStores.tsx`, `checkStoreSupport` con aviso no-bloqueante); marca `StockAlert` en `package.json`, `layout.tsx`, `manifest.ts`, `page.tsx`, `public/*`, README/docs y `monitor.yml`. Restricción: stack sin cambios (Next 16 + Upstash + Actions + Bot API), coste cero, accesibilidad según `web-accessibility`.

## Goals / Non-Goals

**Goals:**
- Una sola tienda fija (Lush) sin registry ni configuración por dominio, con la misma fiabilidad de detección actual (JSON-LD → botón).
- Registro bloqueante solo `lush.com` en cliente y servidor con mensaje en español.
- Marca española única y coherente en UI, iconos, docs y Telegram.

**Non-Goals:**
- Cambiar la lógica de monitorización (transición `out_of_stock → in_stock`, `unknown` no notifica, 15 min, reintentos): se reutiliza tal cual.
- Migrar o borrar productos históricos no-Lush en Redis.
- Añadir dependencias, i18n multi-idioma o modo claro/oscuro nuevo (se retoca la paleta existente).

## Decisions

1. **Nombre elegido `Alerta Lush` (`alerta-lush`)** — español, directo y memorable, libre como `package.json` privado y título. Descartados: `Vigía Lush` (rechazado por el usuario), `VigiLush`, `Avisa Lush`, `Lush en Stock`, mantener `StockAlert` (incumple requisito). Uso nominativo de "Lush" para un vigilante personal; se añade nota en README de no-afiliación.
2. **Eliminar `stores/` y fijar detección Lush en `core`** — se borran `stores/index.ts`, `types.ts`, `example-shop.*`, `registry.test.ts`, `lush.ts` (su contenido migra a `core/lush-detector.ts` como constante `LUSH_STRATEGIES`). `core/evaluate.ts` deja de resolver por dominio y ejecuta la cadena fija (JSON-LD → botón). Alternativa descartada: mantener registry con una sola entrada (conserva código muerto, docs y tests innecesarios). Los detectores genéricos en `core/detectors/` se conservan como motor, sin estrategia headless (se elimina por innecesaria para Lush).
3. **Validación Lush-only en el núcleo, no solo en UI** — `parseProductUrl` + `isLushHost(host)` (`host === 'lush.com' || host.endsWith('.lush.com')`); `validateRegistration` rechaza no-Lush con error en español ("Solo se vigilan URLs de lush.com"). Así API, worker y formulario no pueden divergir. `tienda` pasa a constante `"Lush"`. Alternativa descartada: validar solo en el formulario (la API seguiría aceptando otras tiendas).
4. **UI sin catálogo** — se eliminan `GET /api/stores`, `SupportedStores.tsx`, `checkStoreSupport` y el aviso no-bloqueante; se sustituyen por texto fijo "Solo Lush (lush.com)" y error bloqueante de campo `url` con `role="alert"` y foco existentes (sin cambios de accesibilidad). `page.tsx` deja de fetchear `/api/stores`.
5. **Rebranding por tokens CSS + assets** — `globals.css`: fondo claro cálido, texto negro `#111`, acento verde Lush `#1f7a4d` (oscuro `#3ddc84`), bordes redondeados artesanales; cabecera con nuevo `favicon.svg` (pastilla/bomba minimalista) regenerando PNGs; `layout.tsx`/`manifest.ts` con nuevo nombre y `themeColor`. Sin frameworks ni fuentes externas (coste cero, sin FOUT). Mensajes Telegram con prefijo de marca (`🧼 Alerta Lush: …`) manteniendo etiqueta+URL.
6. **Renombrado técnico con compatibilidad** — `package.json` → `alerta-lush`, README/docs/workflow/textos a la nueva marca; `STOCKALERT_STORE_BACKEND` → `ALERTA_STORE_BACKEND` leyendo la antigua como fallback durante un ciclo (evita romper deploys existentes). Los secrets `TELEGRAM_*` y `UPSTASH_*` no se renombran (los exigen plataformas externas).

## Risks / Trade-offs

- [Marca Lush] → Mitigación: nota de no-afiliación en README; nombre propio ("Alerta Lush") en vez de hacerse pasar por Lush; iconos originales.
- [Romper deploys por renombrado de var de entorno] → Mitigación: fallback que lee `STOCKALERT_STORE_BACKEND` si la nueva no existe + aviso en logs; docs con tabla de migración.
- [Tests acoplados al registry/example-shop] → Mitigación: borrar/reescribir esos tests a la vez que el código; nueva suite Lush-only (válidas, rechazadas, JSON-LD, botón).
- [Favicon PNGs sin herramienta] → Mitigación: SVG a mano + PNGs exportados con script o editor; si no, se generan en la tarea y se verifica en build.
- [Productos históricos no-Lush en Redis siguen evaluándose a `unknown`] → Aceptado explícitamente (ignorar/mantener); no notifican y no hacen daño salvo una petición por ciclo hasta que el usuario los borre.

## Migration Plan

1. Desplegar como cambio único (requiere re-despliegue Vercel + push para reactivar cron si hiciera falta).
2. Tras desplegar: comprobar `GET /` con nueva marca, registrar URL Lush válida, intentar URL no-Lush (debe fallar con error), forzar `workflow_dispatch` y verificar logs sin secretos.
3. Actualizar secrets/docs solo si se adopta la nueva var (`ALERTA_STORE_BACKEND`); la antigua sigue funcionando.
4. Rollback: revert del commit y re-despliegue; Redis no se migra así que no hay rollback de datos.

## Open Questions

- Ninguna abierta: nombre `Alerta Lush` decidido por el usuario.
