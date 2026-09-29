# Spec Delta

## Purpose

Hace que la interfaz web de StockAlert sea usable con lector de pantalla, teclado y preferencia de movimiento reducido, anunciando errores, estados y cambios de forma programática y sin depender solo del color.

## ADDED Requirements

### Requirement: Form fields expose errors and help programmatically

The system SHALL link each registration input to its error message and help text through `aria-describedby`, SHALL set `aria-invalid="true"` on fields with validation errors, and SHALL expose field errors in an assertive live region (`role="alert"`) so they are announced when they appear.

#### Scenario: Invalid submission is announced

- **WHEN** the user submits the form with an empty or non-numeric `chat_id`
- **THEN** the `chat_id` error is linked to the input, the input is marked invalid, and the error is announced through the alert region

#### Scenario: Help text is exposed to assistive technology

- **WHEN** the user focuses the `chat_id` field
- **THEN** assistive technology exposes the referenced help with the steps to obtain the `chat_id`

### Requirement: Form outcome is announced and focus is managed

After a registration attempt, the system SHALL expose the success or failure message in a polite live region (`role="status"`) and SHALL move keyboard focus to that message (or to the first invalid field when validation fails), so keyboard and screen-reader users are not left at an unchanged form.

#### Scenario: Successful registration

- **WHEN** a registration succeeds
- **THEN** a success message appears in the status region and focus moves to it

#### Scenario: Failed registration

- **WHEN** a registration fails (validation error or server error)
- **THEN** the failure message appears in the status region, is announced, and focus moves to the message or the first invalid field

### Requirement: Product list state is perceivable beyond color

The system SHALL communicate each product's availability state with a text label in addition to any color badge, SHALL keep an accessible name on every delete button identifying its product, and SHALL announce list loading failures, empty states, and removals through a live region instead of silent visual-only updates.

#### Scenario: State without color

- **WHEN** a user perceives the product list without color (grayscale, high contrast, or screen reader)
- **THEN** every product still shows its state as text and each delete button is identifiable by product

#### Scenario: Removal is announced

- **WHEN** the user deletes a tracked product
- **THEN** the list updates and the removal is exposed through the live region

### Requirement: Motion, keyboard, and focus basics

All interactive elements of the registration view SHALL be reachable and operable by keyboard with a visible focus indicator, and the interface SHALL honor `prefers-reduced-motion` by disabling non-essential animation and transitions.

#### Scenario: Keyboard-only use

- **WHEN** a user tabs through the registration view
- **THEN** every field, button, and delete control is reachable, shows focus, and activates via keyboard

#### Scenario: Reduced motion preferred

- **WHEN** the user has `prefers-reduced-motion` enabled
- **THEN** no non-essential animation or transition plays in the registration view
