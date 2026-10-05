# FindDrop · tienda

Sitio estático de dos vistas: tienda (`#/`) y página de producto (`#/lullabites`).
Sin dependencias: abre `index.html` en el navegador o súbelo tal cual a cualquier hosting estático.

- `data.js`: todo el contenido editable (textos, precios, enlaces, productos). Los `[DATO ...]` se ven resaltados en la página hasta que los completes.
- `app.js`: router por hash, render de vistas, animaciones y compra con Shopify.
- `styles.css`: estilos mobile-first con la paleta de marca.
- `assets/`: imágenes del producto recortadas sin fondo (WebP), favicon e imagen para redes.

## Compra con Shopify
Completa `shopifyHandle` del producto en `data.js` (el handle es la última parte de la URL del producto en tu tienda).
Con eso el sitio muestra el precio real y el botón abre el checkout de Shopify.
Si no usas Shopify, completa `buyUrl` con un enlace de pago o de WhatsApp.

El Admin API token (`shpat_...`) **no** debe ir nunca en este código.

## Subir a Shopify como tema
`dist/finddrop-theme.zip` es el mismo sitio empaquetado como tema de Shopify.
En Shopify: Tienda online > Temas > Agregar tema > Subir archivo .zip. Queda sin publicar:
usa "Vista previa" y, si todo se ve bien, "Publicar".
Si cambias `data.js`, `app.js`, `styles.css`, `index.html` o las imágenes, vuelve a generar el ZIP con:

    python3 shopify/build_theme.py

La página de inicio del tema es la tienda FindDrop. Carrito, búsqueda, colecciones y la página de cada
producto de Shopify usan plantillas simples con la misma marca (`shopify/theme/templates`).

## Nuevo hallazgo cada semana
1. Agrega las imágenes en `assets/`.
2. Copia el objeto de LullaBites en `products`, cambia `slug`, textos e imágenes.
3. Pon el nuevo `slug` en `featured`.

Antes de publicar: verifica el registro sanitario del producto según el país.
