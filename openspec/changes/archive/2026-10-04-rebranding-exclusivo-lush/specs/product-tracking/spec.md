# Spec Delta

## MODIFIED Requirements

### Requirement: Register a tracked product

The system SHALL accept a product registration containing a product URL, a Telegram `chat_id`, and an optional label, and SHALL persist it as a tracked product ONLY when the URL is an absolute `http(s)` URL under `lush.com` (dominio exacto o subdominio). The system SHALL reject a registration whose URL is missing, malformed, not absolute `http(s)`, or not under `lush.com`, and SHALL reject a missing or non-numeric `chat_id`, without persisting anything. The system SHALL fijar `tienda` a `Lush` (`lush.com`) y SHALL assign the new product a unique `id`.

#### Scenario: Valid registration

- **WHEN** a user submits `https://www.lush.com/es/es/p/silvery-moon-soap` with a chat_id and an optional label
- **THEN** a tracked product is persisted with a unique id, `tienda` Lush, and the submitted URL, chat_id, and label

#### Scenario: Invalid URL

- **WHEN** a user submits `not-a-url`
- **THEN** the registration is rejected with a validation message and no product is persisted

#### Scenario: Invalid chat_id

- **WHEN** a user submits a registration with an empty or non-numeric chat_id
- **THEN** the registration is rejected with a validation message and no product is persisted

#### Scenario: Non-Lush URL is rejected

- **WHEN** a user submits `https://www.otra-tienda.com/producto/123` with an otherwise valid chat_id
- **THEN** the registration is rejected with a validation message stating that only `lush.com` URLs are supported and no product is persisted

### Requirement: Tracked product record

The system SHALL persist each tracked product with at least `id`, `url`, `chat_id`, `etiqueta` (optional label), `tienda` (siempre `Lush`), `estado_actual`, `estado_anterior`, `ultima_verificacion`, and `creado_en`. The state fields SHALL each hold exactly one of `in_stock`, `out_of_stock`, or `unknown`. A newly registered product SHALL start with no determined state until its first evaluation. Los productos históricos de otras tiendas ya guardados SHALL conservarse sin migrar y quedan fuera del flujo de avisos.

#### Scenario: Record shape

- **WHEN** a tracked product is persisted and later read back
- **THEN** all required fields are present, `tienda` is Lush, timestamps are ISO-8601, and the state fields use only the allowed values

### Requirement: List tracked products

The system SHALL provide a view that lists all tracked products, showing at least the label (or the URL when no label is set), the store (siempre Lush), the current state, and the last verification time.

#### Scenario: Listing products

- **WHEN** the user opens the product list
- **THEN** every tracked product is shown with its label/URL, Lush as store, current state, and last verification time

## REMOVED Requirements

### Requirement: Registration view lists supported stores

**Reason**: Con una sola tienda fija no hay catálogo que listar ni que actualizar automáticamente.
**Migration**: Sustituir el componente de catálogo por un texto fijo ("Solo Lush — lush.com") y eliminar `GET /api/stores`.

### Requirement: Unsupported store URLs warn without blocking

**Reason**: El aviso no-bloqueante permitía guardar productos que nunca notificarían; ahora el rechazo es bloqueante.
**Migration**: Las URLs no `lush.com` se rechazan en cliente y servidor con error ("Solo se vigilan URLs de lush.com") y no se persisten. Los productos históricos no-Lush se conservan sin notificar.
