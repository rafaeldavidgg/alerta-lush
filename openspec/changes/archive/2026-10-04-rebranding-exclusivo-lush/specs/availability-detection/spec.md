# Spec Delta

## MODIFIED Requirements

### Requirement: Built-in Lush store definition

The system SHALL evaluate availability exclusively for Lush (`lush.com` y subdominios) without any per-store configuration. The system SHALL apply siempre la misma cadena fija: primero disponibilidad Schema.org JSON-LD `Product`/`Offer` (aceptando forma corta `InStock` y URL `https://schema.org/InStock`), y como respaldo el texto del botón de producto con texto en stock `Añadir a la cesta` y texto agotado `No disponible`. Toda URL que no sea `lush.com` SHALL evaluarse como `unknown` y nunca notificará.

#### Scenario: Lush product in stock

- **WHEN** a Lush product page reports `offers.availability` of `https://schema.org/InStock`
- **THEN** the evaluation yields `in_stock`

#### Scenario: Lush product out of stock

- **WHEN** a Lush product page reports an out-of-stock availability or shows the `No disponible` button text with no in-stock JSON-LD
- **THEN** the evaluation yields `out_of_stock`

#### Scenario: Lush JSON-LD missing

- **WHEN** a Lush product page has no usable Product JSON-LD
- **THEN** the evaluation falls back to the button-text check (`Añadir a la cesta` / `No disponible`)

#### Scenario: Non-Lush URL never notifies

- **WHEN** the evaluated URL is not under `lush.com`
- **THEN** the evaluation yields `unknown` and no notification is triggered

### Requirement: HTML selector detection strategy

The system SHALL detect Lush availability by inspecting the product button text with the fixed values in-stock `Añadir a la cesta` and out-of-stock `No disponible`, returning `unknown` when the button is absent or its text matches neither value. No selector ni texto SHALL ser configurable.

#### Scenario: Expected in-stock text

- **WHEN** the Lush product button text equals `Añadir a la cesta`
- **THEN** the evaluation returns `in_stock`

#### Scenario: Expected out-of-stock text

- **WHEN** the Lush product button text equals `No disponible`
- **THEN** the evaluation returns `out_of_stock`

#### Scenario: Element absent

- **WHEN** no product button is found or its text matches neither fixed value
- **THEN** the evaluation returns `unknown`

### Requirement: Strategy fallback chain

The system SHALL evaluate Lush availability in a fixed order — first Schema.org JSON-LD, then the Lush button-text check — and SHALL stop at the first strategy that returns a determined state (`in_stock` / `out_of_stock`), so an unresolved JSON-LD falls through to the button check.

#### Scenario: Primary unresolved, fallback resolves

- **WHEN** the JSON-LD strategy returns `unknown` and the button-text check returns `in_stock`
- **THEN** the Lush evaluation yields `in_stock`

## REMOVED Requirements

### Requirement: Per-store detector configuration

**Reason**: El sistema es exclusivamente Lush; ya no existe mapeo por dominio ni configuración por tienda.
**Migration**: Toda la detección usa la cadena fija Lush. Las URLs no `lush.com` se rechazan en registro y se evalúan como `unknown` sin notificar.

### Requirement: Extensible store registration

**Reason**: Ya no se añadirán tiendas; el registry y el ejemplo dejan de existir.
**Migration**: Eliminar `stores/index.ts`, `stores/types.ts`, `example-shop.*` y `registry.test.ts`; no se añade ninguna tienda nueva.

### Requirement: User-facing store catalog

**Reason**: Con una sola tienda fija no hay catálogo que mostrar.
**Migration**: Eliminar `GET /api/stores`, `SupportedStores.tsx` y `listVisibleStores`; la UI muestra "Solo Lush (lush.com)" como texto fijo.

### Requirement: Optional JavaScript-rendered detection strategy

**Reason**: Lush se evalúa con HTTP simple + JSON-LD/botón; no se necesita navegador headless y añade dependencia y coste.
**Migration**: Eliminar la estrategia headless y su configuración; si una página Lush futura lo exigiera se reevaluaría como cambio nuevo.
