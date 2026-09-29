# Tasks

## 1. Catálogo de tiendas visible desde el registro

- [x] 1.1 Añadir el marcador `demo?: true` a `StoreConfig` y marcar `example-shop` como demo; verificar con `npm run typecheck` que el tipado es correcto.
- [x] 1.2 Exponer el catálogo visible (dominio + nombre, sin demos) desde el registro de tiendas y verificar con un test en `stores/` que incluye `lush.com` y excluye `example-shop.test`.
- [x] 1.3 Crear `GET /api/stores` que devuelva el catálogo visible y verificar con un test de ruta que la respuesta trae dominio y nombre por tienda y excluye las demos.

## 2. Guía de `chat_id` y tiendas en la vista de registro

- [x] 2.1 Mostrar la ayuda permanente de obtención del `chat_id` (pasos en español) junto al formulario y vinculada al campo con `aria-describedby`; verificar con un test de `ProductForm` que la ayuda es visible y está referenciada por el input.
- [x] 2.2 Mostrar la lista de tiendas soportadas en la página consumiendo `/api/stores`; verificar con un test que Lush aparece y `example-shop.test` no.
- [x] 2.3 Mostrar un aviso no bloqueante cuando la URL es de una tienda no soportada, aceptando igualmente el envío; verificar con tests que el aviso aparece y que el producto se persiste.

## 3. Accesibilidad de formulario, lista y estilos

- [x] 3.1 Asociar errores a campos (`aria-describedby` + `aria-invalid`, `role="alert"`) y exponer el resultado del envío con `role="status"` moviendo el foco al mensaje; verificar con tests de Testing Library que los errores se anuncian y el foco se mueve tras el envío.
- [x] 3.2 Anunciar en la lista los estados de carga, error y eliminación mediante regiones live, manteniendo el estado como texto y nombres accesibles en los botones de eliminar; verificar con tests de `ProductList`.
- [x] 3.3 Respetar `prefers-reduced-motion` en `globals.css` y auditar el contraste de los badges de estado (ajustar la paleta si no llega a 4.5:1); verificar revisando los valores de contraste resultantes y que `npm run lint` pasa.
- [x] 3.4 Actualizar `docs/stores.md` para documentar que una tienda real aparece automáticamente en la web y cómo marcar una entrada como demo; verificar que los pasos documentados coinciden con el código implementado.

## 4. Verificación integrada

- [x] 4.1 Ejecutar `npm test`, `npm run typecheck` y `npm run lint` y verificar que todo pasa sin regresiones respecto a `main`.
