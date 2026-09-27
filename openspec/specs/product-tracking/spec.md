# product-tracking Specification

## Purpose

Lets a user register, view, and remove the online products StockAlert watches, and persists those records in a shared store that both the Vercel-hosted web app and the scheduled monitoring job can read and write.

## Requirements

### Requirement: Register a tracked product

The system SHALL accept a product registration containing a product URL, a Telegram `chat_id`, and an optional label, and SHALL persist it as a tracked product. The system SHALL reject a registration whose URL is missing, malformed, or not an absolute `http(s)` URL, and SHALL reject a missing or non-numeric `chat_id`, without persisting anything. The system SHALL derive the store identifier from the URL host and SHALL assign the new product a unique `id`.

#### Scenario: Valid registration

- **WHEN** a user submits `https://www.lush.com/es/es/p/silvery-moon-soap` with a chat_id and an optional label
- **THEN** a tracked product is persisted with a unique id, the derived store `lush.com`, and the submitted URL, chat_id, and label

#### Scenario: Invalid URL

- **WHEN** a user submits `not-a-url`
- **THEN** the registration is rejected with a validation message and no product is persisted

#### Scenario: Invalid chat_id

- **WHEN** a user submits a registration with an empty or non-numeric chat_id
- **THEN** the registration is rejected with a validation message and no product is persisted

### Requirement: Tracked product record

The system SHALL persist each tracked product with at least `id`, `url`, `chat_id`, `etiqueta` (optional label), `tienda` (derived store/domain), `estado_actual`, `estado_anterior`, `ultima_verificacion`, and `creado_en`. The state fields SHALL each hold exactly one of `in_stock`, `out_of_stock`, or `unknown`. A newly registered product SHALL start with no determined state until its first evaluation.

#### Scenario: Record shape

- **WHEN** a tracked product is persisted and later read back
- **THEN** all required fields are present, timestamps are ISO-8601, and the state fields use only the allowed values

### Requirement: List tracked products

The system SHALL provide a view that lists all tracked products, showing at least the label (or the URL when no label is set), the store, the current state, and the last verification time.

#### Scenario: Listing products

- **WHEN** the user opens the product list
- **THEN** every tracked product is shown with its label/URL, store, current state, and last verification time

### Requirement: Remove a tracked product

The system SHALL allow a user to remove a tracked product by id, after which that product SHALL no longer be evaluated or notified.

#### Scenario: Remove product

- **WHEN** the user deletes a tracked product
- **THEN** it no longer appears in the list and is not evaluated on subsequent runs

### Requirement: Shared store across web app and monitoring job

The system SHALL persist tracked products and their state in a shared, persistent store reachable from both the Vercel-hosted web app and the GitHub Actions monitoring job. The store credentials SHALL be supplied only through environment variables or platform secrets and SHALL NOT be committed to the repository.

#### Scenario: Cross-environment access

- **WHEN** a product is registered through the web app
- **THEN** the monitoring job reads that same product on its next run and can update its state

#### Scenario: No credentials in the repository

- **WHEN** the committed repository is inspected
- **THEN** no store credential value is present; only placeholder entries exist in `.env.example`

### Requirement: Tracked data is not publicly exposed

The system SHALL NOT store tracked products, their URLs, or their chat_ids in a form that is publicly readable from the repository.

#### Scenario: Public repository

- **WHEN** a visitor reads the public GitHub repository
- **THEN** they cannot obtain the registered product URLs or chat_ids
