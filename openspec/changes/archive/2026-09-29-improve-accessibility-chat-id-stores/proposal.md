# Proposal

## Why

La página principal es hoy un formulario ciego: el campo `chat_id` solo muestra un placeholder (`123456789`) sin explicar cómo obtenerlo, y nada indica qué tiendas están soportadas, así que el usuario puede registrar URLs que el sistema nunca podrá evaluar (quedan en `unknown` para siempre). Además, el formulario y la lista tienen carencias básicas de accesibilidad (errores y estados no anunciados a lectores de pantalla, sin asociación programática entre campos y mensajes). Resolverlo ahora reduce registros inútiles, carga del worker y fricción de onboarding, todo en español como el resto de la interfaz.

## What Changes

- La vista de registro muestra una ayuda visible y permanente para obtener el `chat_id` (pasos: hablar al bot → copiar el número → pegarlo), enlazada programáticamente al campo.
- La vista muestra la lista de tiendas soportadas actualmente, generada desde el registro de tiendas (única fuente de verdad), no hardcodeada en la UI.
- Las tiendas de demostración/fixture (p. ej. `example-shop.test`) quedan excluidas del catálogo visible al usuario; las tiendas reales añadidas en el futuro aparecen automáticamente.
- El formulario asocia cada campo con sus errores y ayudas (`aria-describedby`), anuncia errores y confirmaciones mediante regiones live (`role="alert"` / `role="status"`), y mantiene una gestión de foco predecible tras el envío.
- La lista de productos deja de comunicar el estado solo por color (texto + indicador no cromático) y anuncia cargas, errores y eliminaciones a tecnologías de asistencia.
- Sin cambios en la API, el worker, el webhook de Telegram ni el coste cero; sin nuevas dependencias.

## Capabilities

### New Capabilities

- `web-accessibility`: requisitos de accesibilidad de la interfaz web (formulario de registro y lista de productos): asociación campo/error/ayuda, regiones live, foco, operabilidad por teclado, estado no solo por color y respeto a `prefers-reduced-motion`.

### Modified Capabilities

- `product-tracking`: la vista de registro SHALL mostrar la ayuda de obtención del `chat_id` y el catálogo de tiendas soportadas derivado del registro; el registro de URLs de tiendas no soportadas sigue aceptándose pero la UI lo advierte (o lo documenta como `unknown` permanente). Cambia el comportamiento observable de la vista, no solo implementación.
- `availability-detection`: el registro de tiendas SHALL distinguir tiendas visibles al usuario de tiendas demo/fixture, y SHALL exponer el catálogo visible como datos para que la web lo renderice; añadir una tienda real en el futuro la publica automáticamente sin tocar la UI.

## Impact

- Afectado: `src/app/page.tsx`, `src/components/ProductForm.tsx`, `src/components/ProductList.tsx`, estilos asociados (`src/app/globals.css`), `stores/index.ts` (+ tipos en `stores/types.ts` si se añade el marcador demo/visible), y pruebas en `tests/` (+ posible fixture de catálogo).
- No afectado: `src/worker/`, `core/monitor/`, `core/detectors/`, webhook de Telegram (`src/app/api/telegram/`), workflow de GitHub Actions, Upstash, secretos.
- Riesgo principal: decidir el criterio de exclusión de tiendas demo (marcador explícito `demo: true` frente a filtrar dominios `.test`); se propone marcador explícito y se detalla en `design.md`.
