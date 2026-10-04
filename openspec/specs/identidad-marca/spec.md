# identidad-marca Specification

## Purpose

Da al proyecto un nombre en español, una identidad visual reconocible como vigilante de Lush y textos coherentes en la web y en Telegram, para que quien lo despliega no tenga que retocar nada después.

## Requirements

### Requirement: Nombre del proyecto en español

The system SHALL presentarse con el nombre `Alerta Lush` de forma consistente en el título de la web, los metadatos (`layout.tsx`, `manifest.ts`), el `package.json`, el README y la documentación. The system SHALL NOT mostrar `StockAlert` ni `stockalert-telegram` en ninguna superficie visible por el usuario tras el cambio.

#### Scenario: Nombre consistente en la web

- **WHEN** el usuario abre la página principal o lee los metadatos de la app
- **THEN** ve el nuevo nombre en español en el `<h1>`, el `<title>` y el manifiesto, sin menciones a `StockAlert`

#### Scenario: Nombre consistente en docs y paquete

- **WHEN** un visitante lee el README o el `package.json`
- **THEN** encuentra el nuevo nombre en español y la descripción orientada a Lush

### Requirement: Identidad visual Lush

The system SHALL usar una identidad visual propia de Lush en la web: paleta oscura con acento verde artesanal, favicon/logo e iconos nuevos (`favicon.svg`, PNGs, `apple-icon.png`), cabecera con marca y estilos en `globals.css`. The system SHALL mantener accesibilidad (contraste, foco visible, `prefers-reduced-motion`) según `web-accessibility`.

#### Scenario: Marca visible al abrir la app

- **WHEN** el usuario abre la app en claro u oscuro
- **THEN** ve los colores, logo y cabecera de la nueva marca Lush en español con contraste legible

#### Scenario: Iconos actualizados

- **WHEN** el usuario añade la app a favoritos o a pantalla de inicio
- **THEN** ve el nuevo icono de la marca y no el anterior de StockAlert

### Requirement: Copy en español orientado a Lush

The system SHALL mostrar todos los textos de la web en español orientados a Lush: subtítulo ("Pega tu URL de lush.com…"), placeholder con ejemplo `lush.com`, ayuda de `chat_id`, etiquetas de estado y mensajes de éxito/error. Los mensajes de Telegram (alerta de reposición y respuesta del bot con el `chat_id`) SHALL incluir la nueva marca y seguir conteniendo el identificador del producto y su URL en el caso de la alerta.

#### Scenario: Formulario orientado a Lush

- **WHEN** el usuario abre el formulario de registro
- **THEN** el placeholder sugiere una URL `https://www.lush.com/es/es/p/…` y la ayuda explica que solo se vigila Lush

#### Scenario: Alerta Telegram con marca

- **WHEN** un producto Lush vuelve a estar en stock
- **THEN** el mensaje de Telegram contiene la nueva marca, la etiqueta (o URL) y la URL del producto
