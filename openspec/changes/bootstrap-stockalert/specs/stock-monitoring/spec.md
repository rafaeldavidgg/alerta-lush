# Spec Delta

## Purpose

Periodically evaluates every tracked product, applies the in-stock transition and deduplication rules, triggers notifications, and records results, running unattended on a free scheduler.

## ADDED Requirements

### Requirement: Scheduled execution

The system SHALL run the monitoring pass on a schedule of at most every 15 minutes, and SHALL also support manual triggering. Each run SHALL evaluate every tracked product.

#### Scenario: Scheduled run

- **WHEN** the scheduler fires
- **THEN** the monitoring pass evaluates all currently tracked products

#### Scenario: Manual run

- **WHEN** a maintainer triggers the workflow manually
- **THEN** a monitoring pass runs immediately

### Requirement: First-evaluation baseline

On the first evaluation of a product, when no previous state exists, the system SHALL record the observed determined state as the baseline and SHALL NOT send a notification for that first observation.

#### Scenario: Product already in stock at registration

- **WHEN** a product that is already in stock is evaluated for the first time
- **THEN** its state is recorded and no notification is sent

### Requirement: Restock transition notification

The system SHALL send a notification only when a product transitions from `out_of_stock` to `in_stock`. The system SHALL NOT send a notification for repeated `in_stock` observations, for an `in_stock` to `out_of_stock` transition, or for any transition involving `unknown`.

#### Scenario: Restock

- **WHEN** a product's last determined state is `out_of_stock` and the current evaluation is `in_stock`
- **THEN** a notification is sent and the product's current state becomes `in_stock`

#### Scenario: Still in stock

- **WHEN** a product's last determined state is `in_stock` and the current evaluation is `in_stock`
- **THEN** no notification is sent

#### Scenario: Went out of stock

- **WHEN** a product's last determined state is `in_stock` and the current evaluation is `out_of_stock`
- **THEN** no notification is sent and the recorded state becomes `out_of_stock`

### Requirement: Unknown state handling

When availability cannot be determined, the system SHALL record `unknown` for that run, SHALL NOT send a notification, and SHALL retry the product on the next run. An `unknown` observation SHALL NOT overwrite the last determined state used for transition detection.

#### Scenario: Unreachable product

- **WHEN** a product page cannot be fetched or evaluated
- **THEN** the run records `unknown`, sends no notification, and the next run evaluates the product again

#### Scenario: Recovery from unknown

- **WHEN** a product last determined `out_of_stock` becomes `unknown` and later evaluates to `in_stock`
- **THEN** a restock notification is sent

### Requirement: One request per product per run

The system SHALL issue at most one HTTP request per tracked product per run, except for an explicitly configured fallback strategy or a retry required by HTTP failure handling.

#### Scenario: Single fetch

- **WHEN** a product is evaluated in a run
- **THEN** no more than one request is sent to the product URL unless a configured fallback or a failure retry requires otherwise

### Requirement: Request robustness

The system SHALL use an identifiable User-Agent, apply a bounded request timeout, and handle HTTP failures without aborting the whole run. On rate limiting (`429`) or forbidden (`403`) responses the system SHALL apply bounded backoff and/or skip the product for that run, and SHALL continue evaluating the remaining products.

#### Scenario: Rate limited or forbidden

- **WHEN** a store responds with `429` or `403`
- **THEN** the system backs off and/or skips that product for the run, records `unknown` for it, continues with the remaining products, and does not crash

#### Scenario: Timeout

- **WHEN** a store does not respond within the configured timeout
- **THEN** the request is abandoned, the product is recorded as `unknown`, and other products continue

### Requirement: Run logging

The system SHALL emit a concise run summary and per-product outcome suitable for reading in GitHub Actions logs, including the product identifier, the evaluated state, and whether a notification was sent, and SHALL NOT log secret values.

#### Scenario: Debugging a run

- **WHEN** a monitoring run completes
- **THEN** the logs show each product's outcome and a run summary, and contain no secret values

### Requirement: Bounded and resilient runs

The system SHALL complete a run without any single product failure preventing the remaining products from being evaluated.

#### Scenario: One product fails unexpectedly

- **WHEN** evaluating one product throws an unexpected error
- **THEN** the error is caught and logged, and the remaining products are still evaluated
