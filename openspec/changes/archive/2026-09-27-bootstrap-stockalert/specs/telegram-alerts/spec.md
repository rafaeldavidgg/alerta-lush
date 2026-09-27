# Spec Delta

## Purpose

Delivers restock notifications to the user's Telegram chat through the Telegram Bot API, using credentials supplied only as secrets.

## ADDED Requirements

### Requirement: Restock message content

The system SHALL send a Telegram message for a restock that contains at least the product label (or the product URL when no label is set) and the product URL, so the recipient can identify the product and open its page.

#### Scenario: Message on restock

- **WHEN** a restock is detected for a product
- **THEN** a Telegram message is sent to that product's chat_id including the product label/URL and the product URL

### Requirement: Credentials from secrets

The system SHALL read the Telegram bot token from an environment variable or platform secret and SHALL NOT include the token value in source code, logs, or committed files.

#### Scenario: Token not committed

- **WHEN** the committed repository is inspected
- **THEN** no Telegram bot token value is present; only a placeholder exists in `.env.example`

### Requirement: Per-product chat targeting

The system SHALL send each notification to the chat_id associated with that product and SHALL NOT route all notifications to a single global chat.

#### Scenario: Different chats

- **WHEN** two products have different chat_ids and both restock
- **THEN** each notification is delivered to its own chat_id

### Requirement: Delivery failure handling

When Telegram delivery fails, the system SHALL log the failure without crashing the run, SHALL NOT stop evaluating remaining products, and SHALL NOT cause the same restock to be re-notified on the next run.

#### Scenario: Telegram API error

- **WHEN** the Telegram API returns an error for a message
- **THEN** the error is logged, the run continues, and the product is not re-notified on the next run
