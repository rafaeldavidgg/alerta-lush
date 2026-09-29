# Política de seguridad

Gracias por ayudar a mantener StockAlert seguro. Este documento explica cómo avisar de vulnerabilidades y qué esperar.

## Versiones compatibles

Al ser una aplicación desplegable (no una librería versionada), solo se da soporte a la rama `main` en su estado actual. Si mantienes un fork o despliegue propio, actualízalo a la última versión de `main` antes de reportar.

## Cómo reportar una vulnerabilidad

**No abras una issue pública** si el problema afecta a la seguridad (por ejemplo: envío de mensajes sin autenticar, exposición de secretos, XSS, SSRF a través de URLs de producto u omisión de la autenticación del webhook).

1. Usa **GitHub Security Advisories**: en la pestaña _Security_ del repositorio → _Report a vulnerability_ (recomendado, mantiene el reporte privado).
2. Si no puedes usar esa vía, abre una issue genérica **sin detalles técnicos** pidiendo un canal de contacto y espera respuesta antes de dar más información.

Incluye en el reporte privado:

- Descripción del problema y su impacto.
- Pasos para reproducirlo (URLs, configuración, logs).
- Versión/commit afectado y entorno (Vercel, local, GitHub Actions).
- Si es posible, una sugerencia de mitigación.

## Qué puedes esperar

- Confirmación de recepción en un plazo razonable (objetivo: 72 h).
- Evaluación del impacto y, si se confirma, corrección en `main` con la mínima exposición pública posible.
- Te pediremos no divulgar el problema hasta que la corrección esté disponible.

## Buenas prácticas para tu despliegue

- Nunca subas secretos al repositorio: usa secrets de GitHub y variables de entorno de Vercel. Los ficheros `.env`, `.env.local` y `.env.*.local` ya están ignorados.
- Rota inmediatamente cualquier secreto que haya quedado expuesto en git, logs o capturas (token del bot, `TELEGRAM_WEBHOOK_SECRET`, credenciales de Upstash).
- Mantén `/api/telegram/webhook` protegido por `TELEGRAM_WEBHOOK_SECRET` y no desactives esa comprobación.
- Recuerda que los datos vigilados (URLs y `chat_id`s) viven en tu base de datos de Upstash, no en el repo: no los pegues en issues, PRs ni capturas públicas.

## Alcance

Esta política cubre el código de este repositorio. No cubre cuentas ni infraestructuras de terceros (Telegram, Vercel, Upstash, GitHub); los problemas de esas plataformas deben reportarse a sus respectivos proveedores.
