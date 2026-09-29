# Spec Delta

## ADDED Requirements

### Requirement: User-facing store catalog

The system SHALL distinguish demo or fixture store entries from real user-facing stores through an explicit marker on the store configuration, and SHALL expose the list of user-facing stores with at least their domain and display name for rendering in the web interface.

#### Scenario: Demo store excluded from the catalog

- **WHEN** a consumer reads the user-facing store catalog
- **THEN** `lush.com` is included and the `example-shop.test` fixture store is excluded

#### Scenario: Catalog entries carry display data

- **WHEN** a consumer reads the user-facing store catalog
- **THEN** each entry carries at least the store domain and its display name

## MODIFIED Requirements

### Requirement: Extensible store registration

The system SHALL allow a new store to be supported by adding a configuration entry that reuses existing strategies, without modifying the detector contract or the monitoring core. A new real (non-demo) store entry SHALL automatically appear in the user-facing store catalog without UI changes.

#### Scenario: Adding a store

- **WHEN** a maintainer adds a new store entry selecting an existing strategy and its parameters
- **THEN** products on that store are evaluated using the new entry and no core monitoring code changes are required

#### Scenario: Demo store does not surface in the catalog

- **WHEN** a maintainer adds a store entry marked as demo or fixture
- **THEN** its products are still evaluated by the monitor but the store does not appear in the user-facing catalog
