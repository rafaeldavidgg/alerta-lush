# cron-trigger Specification

## Purpose

Provides an authenticated HTTP entry point so an external scheduler can run the stock monitoring pass on time without relying on CI queues.

## Requirements

### Requirement: Authenticated cron trigger

The system SHALL expose an HTTP endpoint that runs a monitoring pass only when the caller presents valid scheduler credentials, and SHALL perform no monitoring side effects on invalid credentials.

#### Scenario: Valid scheduled call

- **WHEN** QStash calls the endpoint with a valid signature or bearer secret
- **THEN** the system runs a full monitoring pass over all tracked products

#### Scenario: Missing or invalid credentials

- **WHEN** a request arrives without valid scheduler credentials
- **THEN** the system responds `401` and evaluates no products, updates no state, and sends no notifications

#### Scenario: Wrong method or malformed body

- **WHEN** a request uses an unsupported method or carries invalid JSON for a signed call
- **THEN** the system responds `4xx` without running a monitoring pass

### Requirement: Trigger executes full pass with summary

The system SHALL evaluate every tracked product on each authorized trigger using the same transition, dedup, and notification rules as scheduled monitoring, and SHALL return a short machine-readable summary without secret values.

#### Scenario: Successful pass

- **WHEN** an authorized trigger completes
- **THEN** the response includes total, in-stock, out-of-stock, unknown, notified, and error counts, and state in storage reflects the evaluations

#### Scenario: No secrets in response or logs

- **WHEN** an authorized trigger completes
- **THEN** neither the response body nor the emitted logs contain bot tokens, webhook secrets, scheduler secrets, or Redis tokens

### Requirement: No duplicate notifications on overlap

The system SHALL ensure overlapping trigger deliveries do not produce duplicate restock notifications for the same product transition.

#### Scenario: Concurrent deliveries

- **WHEN** two authorized triggers overlap in time
- **THEN** at most one restock notification is sent per product transition and both deliveries complete without corrupting stored state
