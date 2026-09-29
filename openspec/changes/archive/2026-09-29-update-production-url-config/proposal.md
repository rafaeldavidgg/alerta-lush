# Proposal

## Why

La URL de producción cambió de `https://stockalert-rafaeldavidgg.vercel.app/` a `https://stockalert-telegram.vercel.app/`. Telegram sigue enviando los updates del bot a la URL registrada vía `setWebhook`, por lo que el descubrimiento de `chat_id` (responder "hola" → bot responde con el id) se rompe hasta re-registrar el webhook en el nuevo dominio. Hay que responder a "¿qué me afecta y qué config debo actualizar?" con un plan operativo cerrado.

## What Changes

- Re-registrar el webhook de Telegram (`setWebhook`) apuntando a `https://stockalert-telegram.vercel.app/api/telegram/webhook` con el mismo `secret_token` (`TELEGRAM_WEBHOOK_SECRET` existente, sin rotar salvo que se quiera).
- Verificar el registro con `getWebhookInfo` y con una prueba extremo a extremo (enviar mensaje al bot → responde con `chat_id`).
- Verificar variables de entorno en Vercel en el proyecto nuevo/renombrado (Production + Preview): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`; y el bypass de Deployment Protection para `/api/telegram/webhook` si está activado.
- Verificar que no queden referencias a la URL antigua en docs/config y que el README siga siendo copy-pasteable con el nuevo dominio.
- **No cambia** código de la app, ni secretos de GitHub Actions, ni Upstash, ni detectores de tiendas.

## Capabilities

### New Capabilities

_Ninguna — cambio operativo sin comportamiento nuevo._

### Modified Capabilities

_Ninguna — ningún REQUIREMENT existente cambia. El endpoint ya es agnóstico al dominio (`telegram-chat-id-discovery` no fija dominio); solo cambia a dónde apunta Telegram. Por eso este change declara `skip_specs: true` en `.openspec.yaml`._

## Impact

- **Afectado / requiere acción**: webhook inbound de Telegram (`POST /api/telegram/webhook`): roto hasta hacer `setWebhook` al nuevo dominio. Afecta solo al descubrimiento de `chat_id`; las alertas de restock salientes (`sendMessage` desde el worker) **no se ven afectadas**.
- **Verificar, normalmente sin acción**: env vars de Vercel (si fue rename se heredan; si fue proyecto nuevo hay que recrearlas), Deployment Protection bypass, dominio de producción documentado en README (ya muestra `stockalert-telegram.vercel.app`, verificar que no quede la antigua en ningún sitio).
- **No afectado**: `core/config.ts`, `src/app/api/telegram/webhook/route.ts`, `core/telegram*`, GitHub Actions `monitor.yml` + secrets, Upstash Redis, lógica de `tienda`/detectores (`lush.com`, etc. — dominio de tienda, no dominio de despliegue), desarrollo local.
- Búsqueda en repo confirma cero ocurrencias de `stockalert-rafaeldavidgg` en código/docs actuales: no hay URL hardcodeada que cambiar.
