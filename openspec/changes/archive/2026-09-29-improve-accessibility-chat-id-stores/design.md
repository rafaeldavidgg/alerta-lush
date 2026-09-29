# Design

## Context

La página actual (`src/app/page.tsx`) compone `ProductForm` y `ProductList` sin ayuda contextual: el campo `chat_id` solo tiene un placeholder y no hay catálogo de tiendas. Ver `proposal.md` para la motivación. Restricciones: interfaz en español, coste cero (sin dependencias nuevas), sin cambios en API de registro, worker, webhook ni workflow; el registro de tiendas vive en `stores/index.ts` con `StoreConfig` (`domain`, `name`, `strategies`) y la entrada `example-shop.test` es solo un fixture de pruebas que no debe mostrarse al usuario.

## Goals / Non-Goals

**Goals:**

- Ayuda de `chat_id` visible y vinculada al campo, y catálogo de tiendas derivado del registro (única fuente de verdad).
- Accesibilidad base del formulario y la lista verificable con Testing Library.
- Añadir una tienda real en el futuro la publica en la web sin tocar la UI.

**Non-Goals:**

- Auditoría WCAG completa, otros idiomas, modo oscuro o rediseño visual.
- Rechazar URLs de tiendas no soportadas (seguirían aceptándose con aviso).
- Cambiar el texto de respuesta del bot de Telegram o el flujo de webhook.
- Nuevas dependencias o servicios.

## Decisions

1. **Marcador explícito `demo?: true` en `StoreConfig`, y `example-shop` marcado como demo.** Alternativa descartada: filtrar por TLD `.test`. El marcador es explícito, no depende de convenciones de dominio y documenta la intención en cada entrada; el filtro `.test` es implícito y se rompería con fixtures bajo otros dominios.
2. **Nueva ruta `GET /api/stores` que devuelve el catálogo visible (`[{ domain, name }]`) filtrando demos, en lugar de importar el registro en el cliente.** La página ya obtiene `/api/products` con `fetch`; reutiliza el mismo patrón, evita acoplar el bundle del cliente al módulo de tiendas (que puede crecer con imports solo-servidor) y es trivialmente testeable. Alternativa descartada: `listStores()` directo en el componente cliente.
3. **Ayuda de `chat_id` como `<ol>` estática y siempre visible junto al formulario, con pasos genéricos (sin enlace `t.me` hardcodeado).** El nombre de usuario del bot varía por despliegue y no se conoce en build; los pasos genéricos ("abre tu bot, envíale cualquier mensaje, copia el número") valen para cualquier instancia. Se vincula al input con `aria-describedby`.
4. **Aviso de tienda no soportada no bloqueante, evaluado en cliente contra el catálogo de `/api/stores` al enviar (y al perder el foco de la URL).** Rechazar sería **BREAKING** y contradice que el núcleo trate tiendas desconocidas como `unknown`; el aviso usa `role="alert"` pero permite el envío.
5. **Accesibilidad con primitivas HTML/ARIA, sin librerías:** `aria-describedby` + `aria-invalid` en inputs, errores con `role="alert"`, resultado del envío con `role="status"` + movimiento de foco vía `ref`, badges de estado que ya tienen texto (`stateLabel`) verificados por contraste, y `prefers-reduced-motion` en `globals.css`. Todo es testeable con los Testing Library ya instalados.

## Risks / Trade-offs

- [Riesgo] La auditoría de contraste de los badges (`.badge.in_stock`, etc.) puede exigir cambiar la paleta → Mitigación: la tarea de contraste va primera y solo toca valores CSS, sin cambios de marcado.
- [Riesgo] Mover el foco tras el envío puede sorprender si se hace en cada render → Mitigación: moverlo solo en el manejador de submit, a un nodo con `tabIndex={-1}`, cubierto con test.
- [Riesgo] `/api/stores` añade una ruta que hay que mantener → Mitigación: es una lectura pura del registro existente, sin estado ni secretos; su test es un snapshot del catálogo filtrado.
- [Trade-off] El aviso de tienda no soportada duplica en cliente el conocimiento del catálogo → se acepta porque el catálogo viene del servidor en cada carga y el formulario nunca decide aceptación (solo avisa); la validación real sigue en la API.
