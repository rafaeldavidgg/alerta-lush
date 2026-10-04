# Alerta Lush

Vigila la disponibilidad de productos de **Lush** y recibe un **mensaje de Telegram en cuanto un producto vuelve a estar en stock**.

Pega la URL de un producto de Lush que esté agotado y Alerta Lush la revisará cada 15 minutos para avisarte cuando vuelva a estar disponible (cuando el botón `No disponible` pasa a ser `Añadir a la cesta`).

Todo funciona con planes gratuitos: **Vercel Hobby** (aplicación web) + **GitHub Actions** (planificador) + **Upstash Redis** (almacenamiento compartido) + **Telegram Bot API** (notificaciones). Coste total: 0 €.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-cada_15_min-2088FF?logo=github-actions&logoColor=white)](.github/workflows/monitor.yml)
[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-green.svg)](LICENSE)

> Interfaz y documentación en español. Proyecto personal sin afiliación con Lush. Si usas este proyecto, una estrella en GitHub se agradece.

---

## Índice

- [Características](#características)
- [Cómo funciona](#cómo-funciona)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
  - [1. Crear el bot de Telegram](#1-crear-el-bot-de-telegram)
  - [2. Crear la base de datos Redis en Upstash](#2-crear-la-base-de-datos-redis-en-upstash)
  - [3. Configurar los secrets de GitHub Actions](#3-configurar-los-secrets-de-github-actions)
  - [4. Desplegar la aplicación web en Vercel](#4-desplegar-la-aplicación-web-en-vercel)
  - [5. Registrar el webhook de Telegram (una sola vez)](#5-registrar-el-webhook-de-telegram-una-sola-vez)
  - [6. Obtener tu chat_id](#6-obtener-tu-chat_id)
  - [7. Usarlo](#7-usarlo)
- [Desarrollo local](#desarrollo-local)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Solo Lush](#solo-lush)
- [Seguridad y privacidad](#seguridad-y-privacidad)
- [Robustez y limitaciones](#robustez-y-limitaciones)
- [Solución de problemas](#solución-de-problemas)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Características

- **Exclusivo Lush**: solo acepta URLs de `lush.com`. Cualquier otra URL se rechaza con un error claro, sin guardarse.
- **Monitorización cada 15 minutos** mediante GitHub Actions, sin servidores que mantener.
- **Alertas por Telegram** solo en la transición `sin stock → en stock`. Sin spam ni duplicados.
- **Detección fija Lush**: primero Schema.org JSON-LD y, como respaldo, texto del botón (`Añadir a la cesta` / `No disponible`).
- **Sin falsos positivos**: los errores de red o anti-bots (`403`/`429`/timeouts) se registran como `desconocido` y nunca notifican.
- **Coste cero** con los niveles gratuitos de Vercel, GitHub, Upstash y Telegram.
- **Interfaz en español**, sencilla: URL de Lush + `chat_id` + etiqueta opcional.

---

## Cómo funciona

```text
┌──────────────┐  registrar   ┌───────────────┐  cada 15 min   ┌──────────────┐
│ App Next.js  │ ───────────▶ │ Upstash Redis │ ◀────────────── │ GH Actions   │
│ (Vercel)     │              │ (estado común)│                │ worker       │
└──────────────┘              └───────────────┘                └──────┬───────┘
                                                                      │ descargar + detectar
                                                                      ▼
                                                                 ┌──────────┐
                                                                 │ Telegram │
                                                                 └──────────┘
```

1. La aplicación web guarda los productos de Lush vigilados en Upstash Redis.
2. Un job de GitHub Actions los lee, comprueba cada producto una vez y actualiza el estado guardado.
3. Solo la transición `sin stock → en stock` envía un mensaje de Telegram. La primera observación solo fija la referencia inicial y el estado `desconocido` (fallos de red/anti-bots) nunca notifica.

La detección es fija para Lush: JSON-LD de Schema.org y, si no hay datos utilizables, el texto del botón del producto.

---

## Requisitos

- Una cuenta de [GitHub](https://github.com) (gratuita).
- Una cuenta de [Vercel](https://vercel.com) (plan Hobby gratuito).
- Una cuenta de [Upstash](https://upstash.com) (nivel gratuito suficiente).
- Telegram y una cuenta para hablar con [@BotFather](https://t.me/BotFather).
- [Node.js](https://nodejs.org/) **20 o superior** y `npm` (solo para desarrollo local o para ejecutar el worker fuera de Actions).

> No necesitas clonar el repo para usar Alerta Lush una vez desplegado: basta con la URL de tu despliegue en Vercel. Clónalo solo si quieres tu propia instancia o contribuir.

---

## Instalación

Tiempo estimado: unos 15 minutos. Necesitarás tener a mano el token del bot, la URL y el token REST de Upstash y la URL de producción de Vercel.

### 1. Crear el bot de Telegram

1. Abre Telegram y habla con [@BotFather](https://t.me/BotFather).
2. Envía `/newbot`, elige un nombre y un nombre de usuario terminado en `bot`.
3. Copia el **token** (tiene el formato `123456789:AA...`). Es tu `TELEGRAM_BOT_TOKEN`. La aplicación web lo usa para responderte con tu `chat_id`; el worker programado lo usa para enviar las alertas de reposición.

### 2. Crear la base de datos Redis en Upstash

1. Inicia sesión en [upstash.com](https://upstash.com) y crea una base de datos **Redis** (el nivel gratuito es suficiente).
2. En la sección **REST API** de la base de datos, copia:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 3. Configurar los secrets de GitHub Actions

Haz un fork de este repositorio (o usa tu clon) y ve a **Settings → Secrets and variables → Actions → New repository secret**. Añade:

| Secret                     | Valor                 |
| -------------------------- | --------------------- |
| `TELEGRAM_BOT_TOKEN`       | Token de tu bot       |
| `UPSTASH_REDIS_REST_URL`   | URL REST de Upstash   |
| `UPSTASH_REDIS_REST_TOKEN` | Token REST de Upstash |

Sin estos tres secrets, el workflow programado (`.github/workflows/monitor.yml`) fallará.

### 4. Desplegar la aplicación web en Vercel

1. Importa tu repositorio en Vercel (framework: Next.js, los valores por defecto valen).
2. En **Settings → Environment Variables** añade estas variables (para Production y Preview):

   | Variable                   | Valor                                                             |
   | -------------------------- | ----------------------------------------------------------------- |
   | `TELEGRAM_BOT_TOKEN`       | Token de tu bot (se usa para responderte con tu `chat_id`)        |
   | `TELEGRAM_WEBHOOK_SECRET`  | Cadena aleatoria usando solo `A-Z a-z 0-9 _ -` (1–256 caracteres) |
   | `UPSTASH_REDIS_REST_URL`   | URL REST de Upstash                                               |
   | `UPSTASH_REDIS_REST_TOKEN` | Token REST de Upstash                                             |

3. Despliega y anota tu dominio de producción (por ejemplo `https://alertalush.vercel.app`).

> **Protección de despliegue:** si activas la protección con contraseña o la autenticación de Vercel, las llamadas del webhook de Telegram se bloquean y el bot no responderá. Añade una excepción para `/api/telegram/webhook` o mantén esa ruta accesible públicamente.

### 5. Registrar el webhook de Telegram (una sola vez)

Apunta Telegram a tu endpoint desplegado. Sustituye `<TOKEN>` y `<WEBHOOK_SECRET>` (el mismo valor que configuraste en Vercel) y usa tu dominio de producción:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<tu-dominio-vercel>/api/telegram/webhook",
    "secret_token": "<WEBHOOK_SECRET>",
    "allowed_updates": ["message"]
  }'
```

Confirma que quedó registrado con:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

El worker programado solo usa `sendMessage`, así que el webhook no interfiere con la monitorización.

### 6. Obtener tu chat_id

1. Abre Telegram y envía a tu bot cualquier mensaje (por ejemplo `hola`).
2. El bot te responde con tu **chat_id**. Cópialo; lo pegarás en el formulario.

Un `chat_id` es por chat. Para avisar a varias personas o chats, repite este paso con cada una y registra cada `chat_id` con su propio producto.

<details>
<summary>Alternativa: leer el chat_id manualmente</summary>

Los webhooks y `getUpdates` son mutuamente excluyentes, así que primero elimina el webhook, envía un mensaje a tu bot y luego lee las actualizaciones:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

Después abre `https://api.telegram.org/bot<TOKEN>/getUpdates` en el navegador y busca `"chat":{"id":123456789,...}`. Ese número es tu `chat_id`.

Si eliminaste el webhook, vuelve a registrarlo con el paso 5 cuando termines.

</details>

### 7. Usarlo

1. Abre tu URL de Vercel.
2. Pega la URL del producto de Lush (p. ej. `https://www.lush.com/es/es/p/silvery-moon-soap`), tu `chat_id` y una etiqueta opcional.
3. Añádelo. La siguiente ejecución programada (en ~15 minutos) registrará su estado; cuando se reponga recibirás un mensaje de Telegram.

Para dejar de vigilar un producto, elimínalo desde la lista de la propia aplicación.

---

## Desarrollo local

Requisitos: Node.js 20+.

```bash
npm install
cp .env.example .env.local   # rellena los valores (o usa el backend en memoria)
npm run dev                  # http://localhost:3000
```

Para trabajar en local sin Upstash, usa el backend en memoria:

```bash
# PowerShell
$env:ALERTA_STORE_BACKEND = "memory"
$env:TELEGRAM_BOT_TOKEN = "dummy"
npm run worker
```

```bash
# Bash (Linux/macOS)
ALERTA_STORE_BACKEND=memory TELEGRAM_BOT_TOKEN=dummy npm run worker
```

> La variable antigua `STOCKALERT_STORE_BACKEND` sigue funcionando como alternativa. El backend en memoria no persiste entre peticiones serverless; solo sirve para desarrollo local y pruebas.

Copia `.env.example` a `.env.local` y nunca subas valores reales: `.env`, `.env.local` y `.env.*.local` ya están ignorados en `.gitignore`. Los valores reales solo viven en los secrets de GitHub y en las variables de entorno de Vercel.

---

## Scripts disponibles

| Comando             | Para qué sirve                                                |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | Inicia el servidor de desarrollo de Next.js.                  |
| `npm run build`     | Genera la compilación de producción.                          |
| `npm test`          | Ejecuta la suite de pruebas (Vitest).                         |
| `npm run typecheck` | Comprobación de tipos con TypeScript.                         |
| `npm run lint`      | Linter (ESLint).                                              |
| `npm run worker`    | Ejecuta una pasada de monitorización (lo usa GitHub Actions). |

Antes de abrir un PR, se recomienda ejecutar `npm test`, `npm run typecheck` y `npm run lint`.

---

## Estructura del proyecto

```text
src/
  app/            # App Next.js (formulario, API, webhook de Telegram)
  components/     # Componentes React
  lib/            # Utilidades compartidas
  worker/         # Pasada de monitorización (la ejecuta GitHub Actions)
core/
  detectors/      # Detección de disponibilidad (JSON-LD + botón, fijos para Lush)
  lush-detector.ts# Constantes Lush: dominio, textos y cadena de detección
  monitor/        # Lógica de comparación de estados
  storage/        # Backend Upstash / en memoria
tests/            # Pruebas (Vitest)
.github/
  workflows/      # Workflow programado cada 15 min
```

---

## Solo Lush

Alerta Lush vigila exclusivamente productos de `lush.com` (incluidos subdominios como `www.lush.com`). Las URLs de cualquier otra tienda se rechazan en el formulario y en la API con un error del tipo «Solo se vigilan URLs de lush.com» y no se guardan.

Si usaste una versión anterior que aceptaba otras tiendas, los productos antiguos de esas tiendas se conservan en tu Redis sin borrarse, pero ya no generan avisos. Puedes eliminarlos desde la lista de la propia aplicación.

---

## Seguridad y privacidad

- **Secretos** (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, credenciales de Upstash) solo viven en los secrets de GitHub y en las variables de entorno de Vercel. `.env.example` solo contiene marcadores vacíos; nunca se suben valores reales.
- **Autenticación del webhook:** el webhook de Telegram solo actúa ante peticiones que traen el `TELEGRAM_WEBHOOK_SECRET` configurado, así que terceros no pueden usarlo para enviar mensajes con tu bot.
- **Datos vigilados** (URLs de productos y `chat_id`s) viven en tu base de datos Redis de Upstash, **no** en el repositorio. Que el repositorio sea público no expone qué vigila quién.
- **Limitación del formulario público:** el formulario web no está autenticado. Quien encuentre tu URL de Vercel podría registrar productos (el bot solo puede escribir a chats que lo hayan iniciado, lo que limita el abuso). Además, la lista de productos muestra el `chat_id` de cada alerta a cualquiera que abra la página, para que varios usuarios distingan sus avisos. Para un despliegue personal, activa la **protección con contraseña de Vercel** o mantén privada la URL del despliegue. Si necesitas una garantía estricta, añade un secreto compartido a las rutas de la API.
- **Avisos de seguridad:** consulta [SECURITY.md](SECURITY.md). No abras issues públicas con secretos o datos sensibles.

---

## Robustez y limitaciones

- Se envía un `User-Agent` identificable de tipo navegador, con una petición por producto y ejecución (más reintentos acotados ante `403`/`429`/`5xx`).
- Los `403`/`429`/timeouts se registran como `desconocido` y nunca como un falso «en stock».
- Las notificaciones son **como máximo una vez**: un fallo de Telegram se registra y no se reintenta, para no enviar duplicados.
- Matiz del planificador de GitHub: el cron es de mejor esfuerzo y se pausa tras ~60 días de inactividad del repositorio (ver el comentario en `.github/workflows/monitor.yml`). Si la monitorización se detiene, haz cualquier push o ejecuta el workflow manualmente para reactivar la programación.

---

## Solución de problemas

| Síntoma                             | Causa probable                                            | Qué hacer                                                                                                   |
| ----------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| El bot no responde con el `chat_id` | Webhook no registrado o protección de Vercel bloqueándolo | Revisa el paso 5 con `getWebhookInfo`; excluye `/api/telegram/webhook` de la protección                     |
| El workflow de Actions falla        | Faltan secrets                                            | Comprueba `TELEGRAM_BOT_TOKEN`, `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` en Settings → Secrets |
| Nunca llega ninguna alerta          | El producto sigue agotado o el estado es `desconocido`    | Espera un ciclo completo (~15 min); revisa los logs del workflow                                            |
| La monitorización se detuvo sola    | GitHub pausó el cron por inactividad                      | Haz un push o lanza el workflow manualmente con `workflow_dispatch`                                         |
| `403`/`429` frecuentes              | Anti-bots de la tienda                                    | No es un error de configuración: queda como `desconocido` y se reintenta en el siguiente ciclo              |
| Error «Solo se vigilan URLs…»       | URL que no es de `lush.com`                               | Pega la URL del producto en `lush.com`; otras tiendas no están soportadas                                   |

¿Encontraste otro error? Abre una issue con los pasos para reproducirlo, lo esperado frente a lo obtenido y los logs relevantes **sin secretos** (consulta las [plantillas de issues](.github/ISSUE_TEMPLATE/)).

---

## Contribuir

¡Las contribuciones son bienvenidas! Lee [CONTRIBUTING.md](CONTRIBUTING.md) para el flujo de trabajo (fork, rama, pruebas, PR). Al participar se espera un trato respetuoso; consulta el [código de conducta](CODE_OF_CONDUCT.md).

---

## Licencia

[MIT](LICENSE) — úsalo, modifícalo y compártelo libremente.
