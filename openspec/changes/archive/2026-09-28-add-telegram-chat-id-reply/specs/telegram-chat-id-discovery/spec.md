# Spec Delta

## Purpose

Lets a user discover their own Telegram `chat_id` by messaging the bot, so they can complete the StockAlert registration form without manually inspecting raw Telegram API output.

## ADDED Requirements

### Requirement: Receive inbound Telegram updates

The system SHALL expose an HTTPS endpoint that accepts Telegram Bot API update payloads over POST and responds with HTTP 200 once an update is handled. The endpoint SHALL accept updates that are not messages without producing a reply.

#### Scenario: Message update received

- **WHEN** Telegram delivers a message update to the endpoint
- **THEN** the endpoint accepts it and responds with HTTP 200

#### Scenario: Non-message update received

- **WHEN** Telegram delivers an update that is not a plain message (for example an edited message, callback query, or channel post)
- **THEN** the endpoint responds with HTTP 200 and sends no reply

### Requirement: Reply with the sender's chat_id

For every incoming message, the system SHALL send a Telegram reply to that same chat containing the chat's id, so the user can copy it into the registration form. The system SHALL reply on every incoming message, not only the first, and SHALL NOT require the chat to be registered beforehand.

#### Scenario: First message from a user

- **WHEN** a user sends the bot any message for the first time
- **THEN** the bot replies in that chat with that chat's numeric id

#### Scenario: Later messages from the same user

- **WHEN** the user sends another message after the first reply
- **THEN** the bot replies again with the same chat id

#### Scenario: Reply identifies the value

- **WHEN** the reply is delivered
- **THEN** its text makes clear that the included number is the `chat_id` to enter in the StockAlert form

### Requirement: Inbound requests are authenticated

The system SHALL reject webhook requests that do not carry the configured Telegram webhook secret token, and SHALL NOT send a Telegram message for rejected requests. The secret SHALL be supplied through environment configuration or platform secrets and SHALL NOT be committed to the repository.

#### Scenario: Missing or invalid secret

- **WHEN** a request reaches the endpoint without the valid secret token
- **THEN** the request is rejected and no Telegram message is sent

#### Scenario: Secret not committed

- **WHEN** the committed repository is inspected
- **THEN** no webhook secret value is present; only a placeholder exists in `.env.example`

### Requirement: Reply failures do not break the endpoint

When sending a reply fails, the system SHALL treat the failure as non-fatal, SHALL still acknowledge the update so Telegram stops retrying, and SHALL log the failure without exposing the bot token.

#### Scenario: Reply delivery fails

- **WHEN** the Telegram `sendMessage` call for a reply fails
- **THEN** the failure is logged with the token redacted and the endpoint still responds with HTTP 200

### Requirement: Webhook does not disrupt existing alerts

The system SHALL preserve existing restock-alert delivery and SHALL operate in webhook mode rather than polling `getUpdates`, so configuring the endpoint does not conflict with the scheduled monitoring job.

#### Scenario: Webhook enabled alongside the monitoring job

- **WHEN** the webhook is configured while the scheduled monitoring job continues to run
- **THEN** restock alerts are still delivered and no `getUpdates`/webhook conflict occurs
