# Cómo contribuir

¡Gracias por querer mejorar Alerta Lush! Este proyecto es pequeño y sencillo a propósito: se prefieren cambios cortos, probados y documentados.

## Formas de ayudar

- Reportar errores con pasos de reproducción.
- Mejorar la documentación (especialmente ejemplos y solución de problemas).
- Pequeñas mejoras de accesibilidad, rendimiento o robustez.

## Flujo de trabajo

1. Haz un **fork** del repositorio y crea una rama desde `main` (`feat/...`, `fix/...` o `docs/...`).
2. Instala dependencias con `npm install` (Node.js 20+).
3. Copia `.env.example` a `.env.local` si lo necesitas. Para trabajar sin Upstash usa `ALERTA_STORE_BACKEND=memory`.
4. Haz tus cambios con pruebas cuando aplique (Vitest).
5. Antes de abrir el PR, ejecuta:
   ```bash
   npm test
   npm run typecheck
   npm run lint
   ```
6. Abre el **pull request** contra `main` usando la plantilla. Describe el qué, el porqué y cómo lo probaste. Un PR por tema.

## Normas básicas

- No subas secretos ni datos reales (tokens, `chat_id`s, URLs personales). Revisa `git diff` antes de hacer push.
- Mantén el coste cero: evita dependencias pesadas o servicios de pago.
- Sigue el estilo existente (Prettier + ESLint). Evita reformateos masivos sin relación con el cambio.
- Actualiza `README.md` o `docs/` si cambias comportamiento visible o configuración.

## Reportar errores

Usa las plantillas de issue (`.github/ISSUE_TEMPLATE/`). Incluye: pasos para reproducir, comportamiento esperado y obtenido, entorno (Node, SO, commit) y logs **sin secretos**.

## Código de conducta

Al participar aceptas el [código de conducta](CODE_OF_CONDUCT.md). Sé amable y directo: critica el código, no a las personas.
