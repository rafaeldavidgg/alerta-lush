# availability-detection Specification

## Purpose

Evaluates whether a Lush product is in stock or out of stock using a fixed detection chain (Schema.org JSON-LD first, product button text as fallback), so availability is determined without any per-store configuration.

## Requirements

### Requirement: Detector contract

The system SHALL expose a common availability detector contract that, given the fetched content for a product URL, returns exactly one of `in_stock`, `out_of_stock`, or `unknown`. A detector SHALL return `unknown` when it cannot determine the state with confidence and SHALL NOT default to `in_stock`.

#### Scenario: Determinable state

- **WHEN** a detector recognizes a supported availability signal in the page content
- **THEN** it returns `in_stock` or `out_of_stock` accordingly

#### Scenario: Indeterminate state

- **WHEN** no supported signal is present or the signal is ambiguous
- **THEN** the detector returns `unknown`

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
