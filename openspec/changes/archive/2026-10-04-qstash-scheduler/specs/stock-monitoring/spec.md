# Spec Delta

## MODIFIED Requirements

### Requirement: Scheduled execution

The system SHALL run the monitoring pass on a QStash schedule of at most every 15 minutes, and SHALL also support manual triggering. Each run SHALL evaluate every tracked product.

#### Scenario: Scheduled run

- **WHEN** the QStash schedule fires
- **THEN** the monitoring pass evaluates all currently tracked products

#### Scenario: Manual run

- **WHEN** a maintainer triggers a run manually from the QStash console or via an authenticated manual publish
- **THEN** a monitoring pass runs immediately

#### Scenario: Scheduler retry

- **WHEN** a scheduled delivery fails or times out
- **THEN** QStash retries with backoff and at most one restock notification is sent per product transition

### Requirement: Run logging

The system SHALL emit a concise run summary and per-product outcome suitable for reading in Vercel logs and QStash delivery logs, including the product identifier, the evaluated state, and whether a notification was sent, and SHALL NOT log secret values.

#### Scenario: Debugging a run

- **WHEN** a monitoring run completes
- **THEN** the logs show each product's outcome and a run summary, and contain no secret values
