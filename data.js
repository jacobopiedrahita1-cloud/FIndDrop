/* ==========================================================================
   FindDrop · CONTENIDO EDITABLE
   --------------------------------------------------------------------------
   Todo el texto, precios y enlaces del sitio viven en este archivo.
   - Los textos con [DATO ...] se ven resaltados en la página: reemplázalos.
   - Para el hallazgo de una nueva semana: copia el objeto de un producto
     dentro de `products`, cambia `slug`, textos e imágenes, y pon su `slug`
     en `featured`. La página del producto se arma sola en #/<slug>.

   IMPORTANTE (antes de publicar): verifica el registro sanitario del
   producto en cada país donde vendas (ej. INVIMA en Colombia, COFEPRIS en
   México, ANMAT en Argentina) y escribe el número en `details` del producto.
   ========================================================================== */

window.FINDDROP = {
  brand: {
    name: 'FindDrop',
    idea: 'Encuentra algo bueno cada semana',
    slogan: 'Un hallazgo por semana',
    contact: {
      email: '[DATO: correo de contacto]',
      // Solo números, con código de país. Ej: 573001234567
      whatsapp: '[DATO: número de WhatsApp]'
    },
    social: [
      { label: 'Instagram', url: '[DATO: enlace de Instagram]' },
      { label: 'TikTok', url: '[DATO: enlace de TikTok]' }
    ]
  },

  /* Shopify Storefront API (token público de solo lectura + carrito).
     Con `shopifyHandle` completo en el producto, el sitio trae el precio real
     y el botón de compra abre el checkout de Shopify.
     NUNCA pongas aquí el Admin API token (shpat_...): da control total de la
     tienda y cualquiera podría verlo en el código del navegador. */
  shopify: {
    domain: '6q1s4t-rx.myshopify.com',
    storefrontToken: 'd3bb76d7bd87c86e79d5d7d5cff389e3',
    apiVersion: '2026-07'
  },

  /* Producto que lleva la etiqueta "Hallazgo de la semana". */
  featured: 'lullabites',

  /* Textos de la página principal. */
  home: {
    hero: {
      eyebrow: 'Encuentra algo bueno cada semana',
      titleThin: 'Un hallazgo',
      titleBold: 'por semana',
      text: 'Buscamos, probamos y te mostramos una sola cosa que vale la pena. Sin relleno.',
      cta: 'Ver el hallazgo'
    },
    products: {
      eyebrow: 'Esta semana',
      title: 'Hallazgos',
      nextTitle: 'Próximo hallazgo',
      nextText: 'Llega pronto. Cada semana, uno nuevo.'
    },
    how: {
      title: 'Cómo funciona FindDrop',
      steps: [
        { title: 'Elegimos uno', text: 'Entre muchas cosas, nos quedamos con una sola.' },
        { title: 'Lo probamos', text: 'Lo usamos antes de mostrártelo.' },
        { title: 'Te lo mostramos', text: 'Una página, la información clara y el botón para pedirlo.' }
      ]
    }
  },

  products: [
    {
      slug: 'lullabites',
      name: 'LullaBites',
      short: 'Gomitas de fresa sin melatonina para tu ritual de noche.',
      // Se reemplaza solo con el precio de Shopify si `shopifyHandle` está completo.
      price: '[DATO: precio]',
      shopifyHandle: '[DATO: handle del producto en Shopify, ej. lullabites]',
      // Respaldo si no usas Shopify: enlace de pago o WhatsApp,
      // ej. https://wa.me/573001234567?text=Hola,%20quiero%20LullaBites
      buyUrl: '[DATO: enlace de compra o WhatsApp]',
      cta: 'Pídelo aquí',

      images: {
        jar: { src: 'assets/lullabites-frasco.webp', w: 1026, h: 796, alt: 'Frasco azul noche de LullaBites, gomitas naturales para dormir sabor fresa, con una luna y estrellas en la etiqueta' },
        gummy: { src: 'assets/lullabites-gomita.webp', w: 462, h: 437, alt: 'Gomita roja de LullaBites con forma de estrella' },
        duo: { src: 'assets/lullabites-duo.webp', w: 1400, h: 726, alt: 'Una gomita de estrella junto al frasco de LullaBites: 60 gomitas, 30 porciones, sin melatonina' }
      },

      page: {
        hero: {
          eyebrow: 'Hallazgo de la semana',
          hook: '¿Duermes 8 horas y aun así te levantas sin energía?',
          text: 'Gomitas de fresa sin melatonina para cerrar el día con calma. Un ritual pequeño, todas las noches.'
        },
        problem: {
          eyebrow: 'Te suena',
          title: 'Dormir no siempre es descansar.',
          items: [
            'Te acuestas a las 11 y a la 1 sigues viendo videos.',
            'Apagas la luz y la cabeza prende la lista de pendientes.',
            'Suena la alarma y la noche se sintió como un parpadeo.'
          ],
          closing: 'A veces no faltan horas. Falta un final claro para el día.'
        },
        concept: {
          eyebrow: 'El giro',
          titleThin: 'Una nana',
          titleBold: 'que se mastica',
          text: 'Lullaby significa nana: la canción que le avisa al cuerpo que ya es hora. LullaBites toma esa idea y la vuelve un ritual de noche, sin melatonina.',
          ritual: [
            { title: 'Baja la luz', text: 'La señal de que el día terminó.' },
            { title: 'Una porción', text: 'Sabor suave a fresa.' },
            { title: 'Haz una pausa', text: 'Respira. El celular, lejos.' }
          ]
        },
        contents: {
          eyebrow: 'Qué trae',
          title: 'Un frasco, un mes de noches.',
          stats: [
            { value: 60, label: 'gomitas' },
            { value: 30, label: 'porciones' }
          ],
          facts: [
            { label: 'Sabor', value: 'Fresa suave (Sweet Strawberry Stars)' },
            { label: 'Forma', value: 'Estrellitas' },
            { label: 'Presentación', value: 'Frasco de 60 gomitas' },
            { label: 'Contenido neto', value: '[DATO: peso neto]' }
          ]
        },
        usage: {
          eyebrow: 'Cómo se usa',
          title: 'Fácil de volver costumbre.',
          steps: [
            { title: 'Cuánto', text: '2 gomitas por porción (60 gomitas = 30 porciones). [DATO: confirma la dosis exacta en la etiqueta]' },
            { title: 'Cuándo', text: '[DATO: momento recomendado, ej. 30 minutos antes de dormir]' },
            { title: 'Cómo', text: 'Súmalo a tu rutina: luz baja y pantallas fuera de la cama.' }
          ],
          changesTitle: 'Qué puede cambiar en tus noches',
          changes: [
            'Un momento fijo para cerrar el día.',
            'Apoyo para relajar el cuerpo antes de dormir.',
            'Una opción sin melatonina para tu rutina nocturna.',
            'Un sabor rico que te ayuda a sostener el hábito.'
          ],
          note: 'Es un apoyo para tu rutina nocturna. Cada cuerpo responde distinto.'
        },
        ingredients: {
          eyebrow: 'Lo que lleva',
          title: 'Ingredientes y detalles.',
          items: [
            { name: '5-HTP', amount: '[DATO: cantidad por porción]' },
            { name: 'L-teanina', amount: '[DATO: cantidad por porción]' },
            { name: 'Magnesio', amount: '[DATO: cantidad por porción]' },
            { name: 'Raíz de valeriana', amount: '[DATO: cantidad por porción]' },
            { name: 'Pasiflora', amount: '[DATO: cantidad por porción]' }
          ],
          badges: ['Sin melatonina', 'Vegana', 'Sin azúcar', 'Sin gluten', 'Apta halal'],
          details: [
            { label: 'Registro sanitario', value: '[DATO: número de registro sanitario]' },
            { label: 'Fabricante / origen', value: '[DATO: fabricante y país de origen]' },
            { label: 'Advertencias de la etiqueta', value: '[DATO: advertencias tal como aparecen en la etiqueta]' }
          ]
        },
        offer: {
          eyebrow: 'Esta semana',
          title: 'El hallazgo de la semana',
          text: 'Lo elegimos, lo probamos y te lo mostramos. Si te late, este es el momento.',
          rows: [
            { label: 'Disponibilidad', value: '[DATO: disponibilidad, ej. unidades o fecha límite]' },
            { label: 'Envío', value: '[DATO: países, tiempos y costo de envío]' }
          ]
        },
        faq: {
          title: 'Preguntas frecuentes',
          items: [
            {
              q: '¿Tiene melatonina?',
              a: 'No. La fórmula es sin melatonina. Lleva 5-HTP, L-teanina, magnesio, raíz de valeriana y pasiflora.'
            },
            {
              q: '¿Cuántas tomo y a qué hora?',
              a: 'El frasco trae 60 gomitas en 30 porciones, es decir, 2 gomitas por porción. [DATO: momento recomendado según la etiqueta]'
            },
            {
              q: '¿Sirve para el insomnio?',
              a: 'No es un tratamiento. Es un suplemento alimenticio pensado como apoyo para tu rutina nocturna. Si te cuesta dormir de forma frecuente, habla con un profesional de la salud.'
            },
            {
              q: '¿Lo puede tomar cualquier persona?',
              a: 'Si estás en embarazo o lactancia, tomas medicamentos (en especial antidepresivos) o tienes alguna condición de salud, consulta antes con un profesional.'
            },
            {
              q: '¿Cuánto tarda en llegar?',
              a: '[DATO: tiempos y zonas de envío]'
            }
          ]
        },
        final: {
          title: 'Esta noche puede empezar distinto.',
          text: 'Un frasco, 30 porciones y un ritual que es solo tuyo.'
        }
      }
    }
  ],

  legal: 'Suplemento alimenticio. No es un medicamento y no sustituye una dieta equilibrada ni el consejo de un profesional de la salud.'
};
