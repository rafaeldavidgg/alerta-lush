# Tasks

## 1. Verificar despliegue y configuración en Vercel

- [x] 1.1 Abrir `https://stockalert-telegram.vercel.app` y confirmar que carga el formulario de registro; verificar que `https://stockalert-telegram.vercel.app/api/telegram/webhook` existe como ruta (un GET puede dar 405/401/500, lo importante es que no sea 404 de dominio muerto). [Verificado 2026-09-29: homepage 200 con formulario; GET al webhook devuelve 405 = la ruta existe, solo acepta POST.]
- [x] 1.2 Confirmar en Vercel **Settings → Environment Variables** (Production y Preview) que existen `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` con los valores vigentes; si se creó un proyecto nuevo y falta alguna, añadirla y hacer redeploy, verificando que el despliegue termina en Ready. [Confirmado 2026-09-29 por el usuario: fue rename, las vars se heredan. Sin acción.]
- [x] 1.3 Si Vercel Deployment Protection está activado, confirmar que `/api/telegram/webhook` está públicamente alcanzable o tiene bypass; verificar revisando la configuración de Protection del proyecto. [Confirmado 2026-09-29 por el usuario: Protection nunca se configuró. Sin acción.]

## 2. Re-registrar el webhook de Telegram en el nuevo dominio

- [x] 2.1 Ejecutar `setWebhook` contra la nueva URL con el secreto existente (sin rotar) y `allowed_updates: ["message"]`, verificando respuesta `{"ok":true}`:
  `curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" -H "Content-Type: application/json" -d '{"url":"https://stockalert-telegram.vercel.app/api/telegram/webhook","secret_token":"<WEBHOOK_SECRET>","allowed_updates":["message"]}'` [Ejecutado 2026-09-29: `{"ok":true,"result":true,"description":"Webhook was set"}.]
- [x] 2.2 Ejecutar `curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"` y verificar que `url` es exactamente `https://stockalert-telegram.vercel.app/api/telegram/webhook`, que `has_custom_certificate`/`pending_update_count` son razonables y que no hay `last_error_message` reciente. [Verificado 2026-09-29: url exacta, pending_update_count 0, sin last_error_message, allowed_updates ["message"].]
- [x] 2.3 Enviar al bot un mensaje real (p. ej. `hi`) y verificar que responde con el `chat_id`; si no responde en ~10 s, revisar `getWebhookInfo.last_error_message` y el punto 1.3 antes de reintentar. [Confirmado 2026-09-29 por el usuario: el bot responde.]

## 3. Limpieza y comprobación de restos de la URL antigua

- [x] 3.1 Buscar restos de `stockalert-rafaeldavidgg` en repo, docs y dashboard de Vercel (dominios asignados, alias) y verificar cero ocurrencias en código (`grep -r "stockalert-rafaeldavidgg" .` devuelve vacío); si Vercel conserva el dominio antiguo como alias, decidir si mantenerlo como redirect o eliminarlo y anotar la decisión. [Verificado 2026-09-29: cero ocurrencias en código/docs/config; dominio antiguo eliminado del dashboard por el usuario.]
- [x] 3.2 Releer `README.md` pasos 4–6 y verificar que cada comando es copy-pasteable con el nuevo dominio y los nombres de env vars vigentes (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`); no se exige editar el archivo si ya es correcto, solo verificarlo. [Verificado 2026-09-29: línea 89 ya muestra `stockalert-telegram.vercel.app`, `setWebhook` usa placeholder `<your-vercel-domain>`, nombres de vars coinciden. Sin edición necesaria.]
- [x] 3.3 Confirmar explicitly que GitHub Actions secrets y Upstash no se tocaron y que el worker sigue operativo (p. ej. última ejecución de `monitor.yml` en verde o `npm run worker` local no aplica a prod); verificar que las alertas salientes no dependen del dominio de Vercel. [Confirmado 2026-09-29: `monitor.yml` sin referencias a la URL (verificado en código); última ejecución en verde según el usuario.]
