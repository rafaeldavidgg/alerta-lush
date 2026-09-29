# Design

## Context

Ver `proposal.md — Why`. Estado actual verificado en el repo (solo lectura):

- Ninguna referencia a `stockalert-rafaeldavidgg` en código, docs o config — no hay URL hardcodeada que migrar.
- `README.md` (líneas 88–89) ya documenta `https://stockalert-telegram.vercel.app` como dominio de ejemplo; los comandos `setWebhook`/`getWebhookInfo` usan placeholder `<your-vercel-domain>`, por lo que son reutilizables sin edición.
- El endpoint `src/app/api/telegram/webhook/route.ts` autentica por cabecera `X-Telegram-Bot-Api-Secret-Token` contra `TELEGRAM_WEBHOOK_SECRET` y no depende del dominio — no requiere cambio de código.
- El worker (`npm run worker` / `.github/workflows/monitor.yml`) solo llama a `sendMessage` outbound; no usa la URL de Vercel.
- Restricción: `webhook` y `getUpdates` son mutuamente excluyentes; no tocar `deleteWebhook` salvo para el fallback documentado.

## Goals / Non-Goals

**Goals:**
- Dejar el bot respondiendo `chat_id` en el nuevo dominio con el mismo secreto, verificado extremo a extremo.
- Dejar explícito qué verificar en Vercel (env vars + Protection) según fuese rename o proyecto nuevo.
- Confirmar que no queda ninguna referencia operativa a la URL antigua.

**Non-Goals:**
- Rotar `TELEGRAM_WEBHOOK_SECRET` o `TELEGRAM_BOT_TOKEN` (solo si el usuario lo pide).
- Cambiar código, tests, detectores de tiendas o modelo de datos.
- Añadir scripts/automatización de `setWebhook`; se mantiene el `curl` documentado de un solo uso.

## Decisions

- **Reutilizar el secreto existente, no rotar.** Por qué: `setWebhook` acepta el mismo `secret_token` contra la nueva URL; rotar obligaría a cambiar Vercel + Telegram a la vez y aumenta el riesgo de dejar el bot mudo. Alternativa considerada (rotar secreto): rechazada salvo compromiso conocido del valor actual.
- **Orden: Vercel primero, Telegram después.** Por qué: `setWebhook` debe apuntar a un despliegue que ya sirva `/api/telegram/webhook` con el secreto configurado; si se registra antes del redeploy, Telegram recibe 500/`webhook not configured` y el usuario cree que falló el comando. Alternativa (Telegram primero): rechazada por esa ventana de error.
- **Sin cambio de código ni spec.** Por qué: el endpoint es agnóstico al host y los specs (`telegram-chat-id-discovery`) no fijan dominio; el grep confirma cero URLs antiguas. Alternativa (crear capability `deployment/*`): rechazada — sería inventar un requirement para satisfacer validación, contra la guía del schema.
- **Verificación en dos niveles (`getWebhookInfo` + mensaje real).** Por qué: `getWebhookInfo.url` confirma el registro pero no que Vercel responda 200 con secreto válido (p. ej. Protection lo bloquea); solo el mensaje real lo prueba. No se omite ninguno.

## Risks / Trade-offs

- [Riesgo] La URL antigua sigue registrada en Telegram → el bot no responde en el nuevo dominio. → Mitigación: `setWebhook` a la nueva URL + comprobar `getWebhookInfo.url == https://stockalert-telegram.vercel.app/api/telegram/webhook`.
- [Riesgo] Proyecto Vercel nuevo sin env vars (vs. rename que las hereda) → webhook responde 500 `webhook not configured`. → Mitigación: checklist de las 4 vars en Production + Preview antes del `setWebhook`.
- [Riesgo] Vercel Deployment Protection (Password/Auth) bloquea los POST de Telegram. → Mitigación: mantener `/api/telegram/webhook` públicamente alcanzable o añadir bypass; el síntoma es "getWebhookInfo OK pero el bot no responde / last_error en getWebhookInfo".
- [Riesgo] Secreto con caracteres fuera de `A-Z a-z 0-9 _ -` o distinto entre Vercel y `secret_token`. → Mitigación: reutilizar el valor exacto ya desplegado; no generar uno nuevo en este change.
- [Riesgo] URLs de preview confundidas con producción. → Mitigación: usar siempre el dominio de producción (`stockalert-telegram.vercel.app`), nunca una URL `*.vercel.app` con hash de despliegue.

## Migration Plan

1. Desplegar/verificar `https://stockalert-telegram.vercel.app` sirve (abrir la app, comprobar formulario).
2. Confirmar env vars en Vercel (Production y Preview) y redeploy si se añadió alguna.
3. Ejecutar `setWebhook` con la nueva URL + `secret_token` existente + `allowed_updates: ["message"]`.
4. Verificar con `getWebhookInfo` (url + sin `last_error`) y enviando un mensaje al bot (debe responder con el `chat_id`).
5. Rollback: si algo falla, re-ejecutar `setWebhook` a la URL que corresponda (antigua si el dominio aún vive, o de nuevo a la nueva tras corregir env vars); el monitoreo saliente no se interrumpe en ningún caso.

## Open Questions

Ninguna — todas las incógnitas (rename vs. proyecto nuevo) se resuelven con el checklist de verificación en tasks sin cambiar el enfoque.
