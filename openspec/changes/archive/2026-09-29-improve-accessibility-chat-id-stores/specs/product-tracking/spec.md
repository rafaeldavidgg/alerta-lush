# Spec Delta

## ADDED Requirements

### Requirement: Registration view guides chat_id discovery

The system SHALL display, next to the registration form and permanently visible (no dialog, no external page required), the steps to obtain the Telegram `chat_id` in Spanish: message the bot, copy the number it replies with, and paste it into the form. The help SHALL be linked to the `chat_id` field as described in `web-accessibility`.

#### Scenario: Help is visible on the registration view

- **WHEN** the user opens the registration view
- **THEN** the `chat_id` steps are visible alongside the form without any extra interaction

### Requirement: Registration view lists supported stores

The system SHALL display the user-facing store catalog (store names and domains) on the registration view, derived from the store registry as defined in `availability-detection`. The list SHALL update automatically when a real store is added, with no UI change required, and demo or fixture stores SHALL NOT appear.

#### Scenario: Supported stores are shown, demo stores are not

- **WHEN** the user opens the registration view
- **THEN** Lush (`lush.com`) is listed and the `example-shop.test` fixture store is not

#### Scenario: New real store appears automatically

- **WHEN** a maintainer adds a new real store entry to the registry
- **THEN** it appears in the registration view without modifying UI code

### Requirement: Unsupported store URLs warn without blocking

When the pasted product URL belongs to a store that is not in the user-facing catalog, the form SHALL show a non-blocking warning stating that the store is not supported and the product will remain in `unknown` state without notifications. Submission SHALL still be accepted, preserving the current acceptance behavior.

#### Scenario: Unsupported URL shows a warning

- **WHEN** the user enters a URL whose store is not in the supported catalog
- **THEN** a warning is shown explaining that no availability detection exists for that store

#### Scenario: Warning does not block submission

- **WHEN** the user submits a registration with an unsupported-store URL that is otherwise valid
- **THEN** the product is still persisted and the warning remains visible
