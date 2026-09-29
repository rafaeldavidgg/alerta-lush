# availability-detection Specification

## Purpose

Determines whether a product on a given online store is in stock or out of stock using a common detector contract and reusable strategies selected per store through configuration, so new stores can be added without changing core monitoring logic.

## Requirements

### Requirement: Detector contract

The system SHALL expose a common availability detector contract that, given the fetched content for a product URL, returns exactly one of `in_stock`, `out_of_stock`, or `unknown`. A detector SHALL return `unknown` when it cannot determine the state with confidence and SHALL NOT default to `in_stock`.

#### Scenario: Determinable state

- **WHEN** a detector recognizes a supported availability signal in the page content
- **THEN** it returns `in_stock` or `out_of_stock` accordingly

#### Scenario: Indeterminate state

- **WHEN** no supported signal is present or the signal is ambiguous
- **THEN** the detector returns `unknown`

### Requirement: Per-store detector configuration

The system SHALL map each store, identified by domain, to a detector strategy and its parameters through data configuration, so adding or changing a store does not require modifying monitoring core code.

#### Scenario: Configured store

- **WHEN** a product URL host matches a configured store entry
- **THEN** the system uses that store's configured strategy and parameters

#### Scenario: Unconfigured store

- **WHEN** a product URL host matches no configured store entry
- **THEN** the evaluation yields `unknown` and no notification is triggered

### Requirement: Schema.org JSON-LD detection strategy

The system SHALL provide a reusable detector strategy that extracts `application/ld+json` blocks, reads the Schema.org `Product` offer availability, maps in-stock values to `in_stock` and out-of-stock values to `out_of_stock`, and accepts both the short (`InStock`) and URL (`https://schema.org/InStock`) value forms.

#### Scenario: In stock via JSON-LD

- **WHEN** page content contains a Product JSON-LD with `offers.availability` of `https://schema.org/InStock`
- **THEN** the strategy returns `in_stock`

#### Scenario: Out of stock via JSON-LD

- **WHEN** page content contains a Product JSON-LD with an out-of-stock availability value
- **THEN** the strategy returns `out_of_stock`

#### Scenario: No usable JSON-LD

- **WHEN** page content contains no usable Product JSON-LD
- **THEN** the strategy returns `unknown` so that the configured fallback strategy can be evaluated

### Requirement: HTML selector detection strategy

The system SHALL provide a reusable detector strategy that locates an element by a configured selector and compares its text against configured expected values for in-stock and out-of-stock, returning `unknown` when the element is absent or its text matches neither expected value.

#### Scenario: Expected in-stock text

- **WHEN** the configured selector matches an element whose text equals the configured in-stock text (for example `Añadir a la cesta`)
- **THEN** the strategy returns `in_stock`

#### Scenario: Expected out-of-stock text

- **WHEN** the configured selector matches an element whose text equals the configured out-of-stock text (for example `No disponible`)
- **THEN** the strategy returns `out_of_stock`

#### Scenario: Element absent

- **WHEN** the configured selector matches no element
- **THEN** the strategy returns `unknown`

### Requirement: Optional JavaScript-rendered detection strategy

The system SHALL provide an optional detector strategy that renders a page with a headless browser for stores that require JavaScript execution before availability is present, usable only when configured for that store.

#### Scenario: JS-rendered store configured

- **WHEN** a store is configured to use the headless-browser strategy
- **THEN** availability is evaluated against the rendered DOM rather than the raw HTTP response body

### Requirement: Strategy fallback chain

A store configuration SHALL be able to declare an ordered list of strategies, and the system SHALL evaluate them in order and stop at the first that returns a determined state, so an unresolved primary strategy falls through to the next one.

#### Scenario: Primary unresolved, fallback resolves

- **WHEN** the first strategy returns `unknown` and a later configured strategy returns `in_stock`
- **THEN** the store evaluation yields `in_stock`

### Requirement: Built-in Lush store definition

The system SHALL ship a working configuration for the Lush store so that a Lush product URL is evaluated without further user configuration. The Lush definition SHALL use Schema.org JSON-LD `Product` offer availability as the primary strategy, with a fallback to the product button text using in-stock text `Añadir a la cesta` and out-of-stock text `No disponible`.

#### Scenario: Lush product in stock

- **WHEN** a Lush product page reports `offers.availability` of `https://schema.org/InStock`
- **THEN** the Lush configuration yields `in_stock`

#### Scenario: Lush product out of stock

- **WHEN** a Lush product page reports an out-of-stock availability or shows the `No disponible` button text with no in-stock JSON-LD
- **THEN** the Lush configuration yields `out_of_stock`

#### Scenario: Lush JSON-LD missing

- **WHEN** a Lush product page has no usable Product JSON-LD
- **THEN** the configuration falls back to the button-text strategy

### Requirement: Extensible store registration

The system SHALL allow a new store to be supported by adding a configuration entry that reuses existing strategies, without modifying the detector contract or the monitoring core. A new real (non-demo) store entry SHALL automatically appear in the user-facing store catalog without UI changes.

#### Scenario: Adding a store

- **WHEN** a maintainer adds a new store entry selecting an existing strategy and its parameters
- **THEN** products on that store are evaluated using the new entry and no core monitoring code changes are required

#### Scenario: Demo store does not surface in the catalog

- **WHEN** a maintainer adds a store entry marked as demo or fixture
- **THEN** its products are still evaluated by the monitor but the store does not appear in the user-facing catalog

### Requirement: User-facing store catalog

The system SHALL distinguish demo or fixture store entries from real user-facing stores through an explicit marker on the store configuration, and SHALL expose the list of user-facing stores with at least their domain and display name for rendering in the web interface.

#### Scenario: Demo store excluded from the catalog

- **WHEN** a consumer reads the user-facing store catalog
- **THEN** `lush.com` is included and the `example-shop.test` fixture store is excluded

#### Scenario: Catalog entries carry display data

- **WHEN** a consumer reads the user-facing store catalog
- **THEN** each entry carries at least the store domain and its display name
