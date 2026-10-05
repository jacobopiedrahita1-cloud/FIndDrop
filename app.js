/* FindDrop · lógica del sitio (sin dependencias).
   El contenido se edita en data.js; aquí solo se arma y anima. */
(function () {
  'use strict';

  var DATA = window.FINDDROP;
  var app = document.getElementById('app');
  var nav = document.getElementById('nav');
  var footer = document.getElementById('footer');
  var buybar = document.getElementById('buybar');
  var toastEl = document.getElementById('toast');
  var progressBar = document.getElementById('progress-bar');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var state = { view: null, homeScroll: 0, shop: {} };
  var cleanups = [];

  /* ---------- utilidades ---------- */

  function isDato(v) { return typeof v === 'string' && v.indexOf('[DATO') !== -1; }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Escapa texto y resalta los marcadores [DATO ...] para que se vean.
  function t(s) {
    return esc(s).replace(/\[DATO[^\]]*\]/g, function (m) { return '<mark class="dato">' + m + '</mark>'; });
  }

  function icon(id, cls) {
    return '<svg class="icon ' + (cls || '') + '" aria-hidden="true" focusable="false"><use href="#' + id + '"/></svg>';
  }

  function findProduct(slug) {
    for (var i = 0; i < DATA.products.length; i++) if (DATA.products[i].slug === slug) return DATA.products[i];
    return null;
  }

  function safeUrl(url) {
    return !isDato(url) && /^(https?:|mailto:|tel:)/.test(url) ? url : null;
  }

  // En el tema de Shopify los archivos viven en el CDN: la plantilla define FINDDROP_ASSET_BASE.
  function assetUrl(src) {
    var base = window.FINDDROP_ASSET_BASE;
    return base && src.indexOf('assets/') === 0 ? base + src.slice(7) : src;
  }

  function img(im, opts) {
    opts = opts || {};
    return '<img src="' + assetUrl(im.src) + '" width="' + im.w + '" height="' + im.h + '" alt="' + esc(opts.alt === '' ? '' : im.alt) + '"' +
      (opts.eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async"' +
      (opts.cls ? ' class="' + opts.cls + '"' : '') +
      (opts.vt ? ' style="view-transition-name:' + opts.vt + '"' : '') + '>';
  }

  function money(n, currency) {
    if (isDato(n)) return t(n);
    try {
      return esc(new Intl.NumberFormat('es-CO', { style: 'currency', currency: currency || 'COP', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n));
    } catch (e) { return esc(n + ' ' + currency); }
  }

  // Precio actual, precio anterior tachado y ahorro. Usa los de Shopify cuando ya llegaron.
  function priceHtml(p, compact) {
    var shop = state.shop[p.slug] || {};
    var amount = shop.amount != null ? shop.amount : p.price;
    var before = shop.amount != null ? shop.compareAt : p.compareAt;
    var cur = shop.currency || p.currency;
    var sale = typeof amount === 'number' && typeof before === 'number' && before > amount;
    return '<span class="price-block' + (compact ? ' price-block--compact' : '') + '" data-price="' + p.slug + '"' + (compact ? ' data-compact' : '') + '>' +
      (sale ? '<s class="price-old"><span class="visually-hidden">Antes </span>' + money(before, cur) + '</s>' : '') +
      '<span class="price"><span class="visually-hidden">' + (sale ? 'Ahora ' : 'Precio ') + '</span>' + money(amount, cur) + '</span>' +
      (sale && !compact ? '<span class="save">Ahorra ' + money(before - amount, cur) + '</span>' : '') +
    '</span>';
  }

  function refreshPrices(slug) {
    var p = findProduct(slug);
    document.querySelectorAll('[data-price="' + slug + '"]').forEach(function (el) {
      el.outerHTML = priceHtml(p, el.hasAttribute('data-compact'));
    });
  }

  /* ---------- escenario del producto: frasco con gomitas flotando ----------
     Capa de atrás: gomitas pequeñas y difuminadas. Capa de adelante: nítidas.
     [x %, y %, ancho %, rotación, profundidad] — la profundidad negativa se mueve al revés. */
  var GUMMIES = {
    back: [[10, 14, 14, -18, -0.5], [76, 6, 11, 24, -0.6], [84, 58, 13, -8, -0.45], [4, 62, 10, 32, -0.55]],
    front: [[-3, 56, 21, 14, 1.3], [80, 76, 17, -22, 1.5], [68, -2, 12, 8, 1.1]]
  };

  function stage(p, opts) {
    var g = p.images.gummy;
    function layer(list, name) {
      return '<div class="stage__layer stage__layer--' + name + '" aria-hidden="true">' + list.map(function (v, i) {
        return '<span class="stage__g" data-g="' + v[4] + '" style="left:' + v[0] + '%;top:' + v[1] + '%;width:' + v[2] + '%">' +
          '<span class="stage__float" style="--r:' + v[3] + 'deg;--d:' + (5.5 + i * 1.4).toFixed(1) + 's;--delay:-' + (i * 1.9).toFixed(1) + 's">' +
          '<img src="' + assetUrl(g.src) + '" width="' + g.w + '" height="' + g.h + '" alt=""' + (opts.eager ? '' : ' loading="lazy"') + ' decoding="async">' +
          '</span></span>';
      }).join('') + '</div>';
    }
    return '<div class="stage stage--' + opts.size + '" data-stage>' +
      layer(GUMMIES.back, 'back') +
      '<div class="stage__jar">' + img(p.images.jar, { eager: opts.eager, cls: opts.cls, vt: 'product-' + p.slug }) + '</div>' +
      layer(GUMMIES.front, 'front') +
    '</div>';
  }

  function buyBtn(p, label, extra) {
    return '<button type="button" class="btn btn--pink ' + (extra || '') + '" data-buy="' + p.slug + '">' +
      '<span class="btn__label">' + esc(label || p.cta) + '</span>' + icon('i-arrow') + '</button>';
  }

  function toast(msg) {
    toastEl.innerHTML = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3600);
  }

  function scrollToEl(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- cabecera y pie ---------- */

  function renderNav(view, p) {
    if (view === 'home') {
      nav.innerHTML =
        '<a href="#/" data-scroll="productos" class="nav__link">Hallazgos</a>' +
        '<a href="#/" data-scroll="como-funciona" class="nav__link nav__link--hide-sm">Cómo funciona</a>' +
        '<a href="#/" data-scroll="contacto" class="nav__link">Contacto</a>';
    } else {
      nav.innerHTML =
        '<a href="#/" class="back">' + icon('i-back') + '<span>Volver a la tienda</span></a>' +
        buyBtn(p, p.cta, 'btn--sm nav__buy');
    }
  }

  function renderFooter(view) {
    var b = DATA.brand;
    var mail = isDato(b.contact.email) ? null : 'mailto:' + b.contact.email;
    var wa = !isDato(b.contact.whatsapp) ? 'https://wa.me/' + String(b.contact.whatsapp).replace(/\D/g, '') : null;

    function link(url, label, value) {
      var u = safeUrl(url);
      return '<li><span class="footer__k">' + esc(label) + '</span>' +
        (u ? '<a href="' + esc(u) + '"' + (/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : '') + '>' + t(value) + '</a>'
           : '<span>' + t(value) + '</span>') + '</li>';
    }

    footer.innerHTML =
      '<div class="wrap footer__grid" id="contacto">' +
        '<div class="footer__brand">' +
          '<a class="logo logo--lg" href="#/" aria-label="FindDrop, ir a la tienda">' +
            '<svg class="logo__drop" aria-hidden="true"><use href="#i-drop"/></svg>' +
            '<span class="logo__word" aria-hidden="true"><span class="thin">Find</span><b>Drop</b></span></a>' +
          '<p class="footer__slogan">' + esc(b.slogan) + '</p>' +
        '</div>' +
        '<div><h2 class="footer__h">Contacto</h2><ul class="footer__list">' +
          link(mail, 'Correo', b.contact.email) +
          link(wa, 'WhatsApp', b.contact.whatsapp) +
        '</ul></div>' +
        '<div><h2 class="footer__h">Redes</h2><ul class="footer__list">' +
          b.social.map(function (s) { return link(s.url, s.label, isDato(s.url) ? s.url : s.url.replace(/^https?:\/\/(www\.)?/, '')); }).join('') +
        '</ul></div>' +
      '</div>' +
      (view === 'product' ? '<div class="wrap"><p class="footer__legal">' + esc(DATA.legal) + '</p></div>' : '') +
      '<div class="wrap footer__bottom"><span>© ' + new Date().getFullYear() + ' FindDrop</span><span>' + esc(b.idea) + '</span></div>';
  }

  /* ---------- vista: tienda ---------- */

  function sparkles(list) {
    return list.map(function (s) {
      return '<span class="float" data-depth="' + s[3] + '" style="left:' + s[0] + '%;top:' + s[1] + '%">' +
        '<span class="float__in" style="--s:' + s[2] + 'px;--d:' + (6 + (s[0] % 5)) + 's;--delay:-' + (s[1] % 7) + 's">' +
        icon('i-spark', 'spark') + '</span></span>';
    }).join('');
  }

  function stars(n, seed) {
    // Puntos de luz fijos (pseudoaleatorios estables) con parpadeo de opacidad.
    var out = '', x = seed || 7;
    for (var i = 0; i < n; i++) {
      x = (x * 9301 + 49297) % 233280; var l = x / 233280 * 100;
      x = (x * 9301 + 49297) % 233280; var tp = x / 233280 * 100;
      x = (x * 9301 + 49297) % 233280; var d = 2 + x / 233280 * 4;
      out += '<i style="left:' + l.toFixed(1) + '%;top:' + tp.toFixed(1) + '%;--tw:' + d.toFixed(1) + 's;--twd:-' + (d * i % 5).toFixed(1) + 's"></i>';
    }
    return '<div class="stars" aria-hidden="true">' + out + '</div>';
  }

  function homeView() {
    var h = DATA.home, featured = findProduct(DATA.featured) || DATA.products[0];
    var others = DATA.products.filter(function (p) { return p !== featured; });

    function card(p, isFeatured) {
      return '<article class="card ' + (isFeatured ? 'card--featured ' : '') + 'reveal" style="--i:1">' +
        '<a class="card__link" href="#/' + p.slug + '">' +
          '<div class="card__media">' + stars(14, p.slug.length) +
            (isFeatured ? '<span class="tag">Hallazgo de la semana</span>' : '') +
            stage(p, { size: 'card', cls: 'card__img', eager: isFeatured }) +
          '</div>' +
          '<div class="card__body">' +
            '<h3 class="card__title">' + esc(p.name) + '</h3>' +
            '<p class="card__text">' + t(p.short) + '</p>' +
            '<div class="card__foot">' + priceHtml(p) +
              '<span class="card__cta">Ver hallazgo ' + icon('i-arrow') + '</span></div>' +
          '</div>' +
        '</a></article>';
    }

    return '' +
      '<section class="home-hero sec--dark" aria-labelledby="home-title">' +
        stars(40, 3) +
        '<div class="glow glow--a" data-depth="0.12" aria-hidden="true"></div>' +
        '<div class="hero-floats" aria-hidden="true">' +
          sparkles([[8, 22, 18, -0.18], [86, 18, 12, -0.3], [78, 70, 22, -0.12], [14, 76, 10, -0.25], [56, 12, 9, -0.35]]) +
          '<span class="float float--gummy" data-depth="-0.22"><span class="float__in" style="--d:8s">' +
            img(featured.images.gummy, { alt: '', eager: true, cls: 'float__gummy' }) + '</span></span>' +
        '</div>' +
        '<div class="wrap home-hero__inner">' +
          '<p class="eyebrow reveal">' + esc(h.hero.eyebrow) + '</p>' +
          '<h1 class="display reveal" id="home-title" tabindex="-1" style="--i:1"><span class="thin">' + esc(h.hero.titleThin) + '</span> <b>' + esc(h.hero.titleBold) + '</b></h1>' +
          '<p class="lead reveal" style="--i:2">' + esc(h.hero.text) + '</p>' +
          '<a href="#/" class="btn btn--pink reveal" data-scroll="productos" style="--i:3"><span class="btn__label">' + esc(h.hero.cta) + '</span>' + icon('i-down') + '</a>' +
        '</div>' +
      '</section>' +

      '<section class="sec sec--light products" id="productos" aria-labelledby="productos-title">' +
        '<div class="wrap">' +
          '<div class="sec__head reveal"><p class="eyebrow eyebrow--dark">' + esc(h.products.eyebrow) + '</p>' +
          '<h2 class="h2" id="productos-title">' + esc(h.products.title) + '</h2></div>' +
          '<div class="grid-products">' +
            card(featured, true) + others.map(function (p) { return card(p, false); }).join('') +
            '<article class="card card--next reveal" style="--i:2" aria-label="' + esc(h.products.nextTitle) + '">' +
              '<svg class="card--next__drop" aria-hidden="true"><use href="#i-drop"/></svg>' +
              '<h3 class="card__title">' + esc(h.products.nextTitle) + '</h3>' +
              '<p class="card__text">' + esc(h.products.nextText) + '</p>' +
            '</article>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="sec sec--purple how" id="como-funciona" aria-labelledby="how-title">' +
        '<div class="wrap">' +
          '<h2 class="h2 reveal" id="how-title">' + esc(h.how.title) + '</h2>' +
          '<ol class="steps">' + h.how.steps.map(function (s, i) {
            return '<li class="step reveal" style="--i:' + (i + 1) + '"><span class="step__n">0' + (i + 1) + '</span>' +
              '<h3 class="step__title">' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></li>';
          }).join('') + '</ol>' +
        '</div>' +
      '</section>';
  }

  /* ---------- vista: producto ---------- */

  function productView(p) {
    var s = p.page;

    return '' +
      // a. Hero
      '<section class="p-hero sec--dark" id="p-hero" aria-labelledby="p-title">' +
        stars(46, 11) +
        '<div class="glow glow--moon" data-depth="0.1" aria-hidden="true"></div>' +
        '<div class="wrap p-hero__grid">' +
          '<div class="p-hero__head">' +
            '<p class="eyebrow reveal"><span class="dot" aria-hidden="true"></span>' + esc(s.hero.eyebrow) + '</p>' +
            '<p class="p-hero__name reveal" style="--i:1">' + esc(p.name) + '</p>' +
            '<h1 class="display display--hook reveal" id="p-title" tabindex="-1" style="--i:2">' + esc(s.hero.hook) + '</h1>' +
          '</div>' +
          '<div class="p-hero__media">' +
            '<div class="p-hero__halo" aria-hidden="true"></div>' +
            stage(p, { size: 'hero', cls: 'p-hero__jar', eager: true }) +
          '</div>' +
          '<div class="p-hero__body">' +
            '<p class="lead reveal" style="--i:3">' + t(s.hero.text) + '</p>' +
            '<div class="buyrow reveal" style="--i:4">' + priceHtml(p) + buyBtn(p) + '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +

      // b. Problema
      '<section class="sec sec--light" aria-labelledby="problem-title">' +
        '<div class="wrap wrap--narrow">' +
          '<p class="eyebrow eyebrow--dark reveal">' + esc(s.problem.eyebrow) + '</p>' +
          '<h2 class="h2 reveal" id="problem-title" style="--i:1">' + esc(s.problem.title) + '</h2>' +
          '<ul class="nights">' + s.problem.items.map(function (it, i) {
            return '<li class="reveal" style="--i:' + (i + 2) + '">' + esc(it) + '</li>';
          }).join('') + '</ul>' +
          '<p class="closing reveal" style="--i:5">' + esc(s.problem.closing) + '</p>' +
        '</div>' +
      '</section>' +

      // c. Giro / concepto
      '<section class="sec sec--purple concept" aria-labelledby="concept-title">' +
        stars(24, 5) +
        '<div class="wrap concept__grid">' +
          '<div class="concept__moon" aria-hidden="true">' +
            '<svg class="moon"><use href="#i-moon"/></svg>' +
            '<span class="concept__gummy">' + img(p.images.gummy, { alt: '' }) + '</span>' +
          '</div>' +
          '<div>' +
            '<p class="eyebrow reveal">' + esc(s.concept.eyebrow) + '</p>' +
            '<h2 class="h2 h2--xl reveal" id="concept-title" style="--i:1"><span class="thin">' + esc(s.concept.titleThin) + '</span> <b>' + esc(s.concept.titleBold) + '</b></h2>' +
            '<p class="lead reveal" style="--i:2">' + t(s.concept.text) + '</p>' +
            '<ol class="ritual">' + s.concept.ritual.map(function (r, i) {
              return '<li class="reveal" style="--i:' + (i + 3) + '"><span class="ritual__n">' + (i + 1) + '</span>' +
                '<div><h3>' + esc(r.title) + '</h3><p>' + t(r.text) + '</p></div></li>';
            }).join('') + '</ol>' +
          '</div>' +
        '</div>' +
      '</section>' +

      // d. Qué trae
      '<section class="sec sec--dark contents" aria-labelledby="contents-title">' +
        '<div class="wrap contents__grid">' +
          '<div>' +
            '<p class="eyebrow reveal">' + esc(s.contents.eyebrow) + '</p>' +
            '<h2 class="h2 reveal" id="contents-title" style="--i:1">' + esc(s.contents.title) + '</h2>' +
            '<div class="stats">' + s.contents.stats.map(function (st, i) {
              return '<div class="stat reveal" style="--i:' + (i + 2) + '"><span class="stat__n" data-count="' + st.value + '">' + st.value + '</span>' +
                '<span class="stat__l">' + esc(st.label) + '</span></div>';
            }).join('') + '</div>' +
            '<dl class="facts">' + s.contents.facts.map(function (f, i) {
              return '<div class="reveal" style="--i:' + (i + 3) + '"><dt>' + esc(f.label) + '</dt><dd>' + t(f.value) + '</dd></div>';
            }).join('') + '</dl>' +
          '</div>' +
          '<figure class="contents__media reveal" style="--i:2">' + img(p.images.duo) + '</figure>' +
        '</div>' +
      '</section>' +

      // e. Cómo se usa y qué cambia
      '<section class="sec sec--purple usage" aria-labelledby="usage-title">' +
        '<div class="wrap">' +
          '<p class="eyebrow reveal">' + esc(s.usage.eyebrow) + '</p>' +
          '<h2 class="h2 reveal" id="usage-title" style="--i:1">' + esc(s.usage.title) + '</h2>' +
          '<ol class="usage__steps">' + s.usage.steps.map(function (st, i) {
            return '<li class="usage__step reveal" style="--i:' + (i + 2) + '"><h3>' + esc(st.title) + '</h3><p>' + t(st.text) + '</p></li>';
          }).join('') + '</ol>' +
          '<div class="changes">' +
            '<h3 class="h3 reveal">' + esc(s.usage.changesTitle) + '</h3>' +
            '<ul class="checks">' + s.usage.changes.map(function (c, i) {
              return '<li class="reveal" style="--i:' + (i + 1) + '">' + icon('i-check') + '<span>' + t(c) + '</span></li>';
            }).join('') + '</ul>' +
            '<p class="note reveal">' + t(s.usage.note) + '</p>' +
          '</div>' +
        '</div>' +
      '</section>' +

      // f. Ingredientes
      '<section class="sec sec--light" aria-labelledby="ing-title">' +
        '<div class="wrap">' +
          '<p class="eyebrow eyebrow--dark reveal">' + esc(s.ingredients.eyebrow) + '</p>' +
          '<h2 class="h2 reveal" id="ing-title" style="--i:1">' + esc(s.ingredients.title) + '</h2>' +
          '<ul class="badges reveal" style="--i:2">' + s.ingredients.badges.map(function (b) {
            return '<li>' + icon('i-check') + esc(b) + '</li>';
          }).join('') + '</ul>' +
          '<div class="ing__grid">' +
            '<div class="ing__col">' +
              '<div class="nutri reveal" style="--i:2">' +
                '<h3 class="nutri__title">' + esc(s.ingredients.nutritionTitle) + '</h3>' +
                '<p class="nutri__serving">' + esc(s.ingredients.serving) + '</p>' +
                '<dl>' + s.ingredients.nutrition.map(function (n) {
                  return '<div><dt>' + esc(n.label) + (n.note ? '<small>' + esc(n.note) + '</small>' : '') + '</dt><dd>' + t(n.value) + '</dd></div>';
                }).join('') + '</dl>' +
              '</div>' +
              '<div class="blend reveal" style="--i:3">' +
                '<h3 class="nutri__title">' + esc(s.ingredients.blendTitle) + '</h3>' +
                '<ul>' + s.ingredients.blend.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' +
                '<p class="blend__note">' + t(s.ingredients.blendNote) + '</p>' +
              '</div>' +
            '</div>' +
            '<dl class="details">' + s.ingredients.details.map(function (d, i) {
              return '<div class="reveal" style="--i:' + (i + 2) + '"><dt>' + esc(d.label) + '</dt><dd>' + t(d.value) + '</dd></div>';
            }).join('') + '</dl>' +
          '</div>' +
        '</div>' +
      '</section>' +

      // g. Oferta
      '<section class="sec sec--dark offer" id="oferta" aria-labelledby="offer-title">' +
        stars(30, 19) +
        '<div class="wrap">' +
          '<div class="offer__card reveal">' +
            '<div class="offer__img">' + img(p.images.jar, { alt: '' }) + '</div>' +
            '<div class="offer__body">' +
              '<p class="eyebrow">' + esc(s.offer.eyebrow) + '</p>' +
              '<h2 class="h2" id="offer-title">' + esc(s.offer.title) + '</h2>' +
              '<p class="lead">' + t(s.offer.text) + '</p>' +
              '<dl class="offer__rows">' + s.offer.rows.map(function (r) {
                return '<div><dt>' + esc(r.label) + '</dt><dd>' + t(r.value) + '</dd></div>';
              }).join('') + '</dl>' +
              '<div class="buyrow">' + priceHtml(p) + buyBtn(p) + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +

      // h. FAQ
      '<section class="sec sec--light" aria-labelledby="faq-title">' +
        '<div class="wrap wrap--narrow">' +
          '<h2 class="h2 reveal" id="faq-title">' + esc(s.faq.title) + '</h2>' +
          '<div class="faq">' + s.faq.items.map(function (f, i) {
            var id = 'faq-' + i;
            return '<div class="faq__item reveal" style="--i:' + (i + 1) + '">' +
              '<h3><button type="button" class="faq__q" aria-expanded="false" aria-controls="' + id + '" id="' + id + '-q">' +
                '<span>' + esc(f.q) + '</span>' + icon('i-plus', 'faq__icon') + '</button></h3>' +
              '<div class="faq__a" id="' + id + '" role="region" aria-labelledby="' + id + '-q" inert><div><p>' + t(f.a) + '</p></div></div>' +
            '</div>';
          }).join('') + '</div>' +
        '</div>' +
      '</section>' +

      // i. CTA final
      '<section class="sec sec--dark final" id="final" aria-labelledby="final-title">' +
        stars(36, 23) +
        '<div class="wrap final__inner">' +
          '<svg class="final__moon reveal" aria-hidden="true"><use href="#i-moon"/></svg>' +
          '<h2 class="h2 h2--xl reveal" id="final-title" style="--i:1">' + esc(s.final.title) + '</h2>' +
          '<p class="lead reveal" style="--i:2">' + t(s.final.text) + '</p>' +
          '<div class="buyrow buyrow--center reveal" style="--i:3">' + priceHtml(p) + buyBtn(p, 'Pídelo aquí', 'btn--lg') + '</div>' +
          '<a href="#/" class="back back--inline reveal" style="--i:4">' + icon('i-back') + '<span>Volver a la tienda</span></a>' +
        '</div>' +
      '</section>';
  }

  /* ---------- animaciones ---------- */

  function setupReveal() {
    var els = app.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.01 });
    els.forEach(function (e) { io.observe(e); });
    cleanups.push(function () { io.disconnect(); });
  }

  function setupCounters() {
    var els = app.querySelectorAll('[data-count]');
    if (!els.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, end = +el.getAttribute('data-count');
        if (reduceMotion.matches) { el.textContent = end; return; }
        var start = performance.now(), dur = 1100;
        (function tick(now) {
          var k = Math.min(1, (now - start) / dur);
          el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(tick);
        })(start);
      });
    }, { threshold: 0.6 });
    els.forEach(function (e) { e.textContent = '0'; io.observe(e); });
    cleanups.push(function () { io.disconnect(); });
  }

  // Parallax ligero: solo en el hero visible y sin movimiento reducido.
  var parallaxEls = [];
  function setupParallax() {
    parallaxEls = reduceMotion.matches ? [] : Array.prototype.slice.call(app.querySelectorAll('[data-depth]'));
  }

  /* Inclinación 3D del frasco.
     Mouse: sigue el puntero dentro del escenario. Táctil: se inclina un poco con el scroll.
     El valor se suaviza hacia el objetivo cada cuadro, así un cambio a mitad de camino no salta. */
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var stages = [];

  function setupStages() {
    stages = [];
    if (reduceMotion.matches) return;
    app.querySelectorAll('[data-stage]').forEach(function (el) {
      var st = {
        el: el, jar: el.querySelector('.stage__jar'),
        gs: Array.prototype.slice.call(el.querySelectorAll('.stage__g')),
        max: el.classList.contains('stage--hero') ? 13 : 10,
        x: 0, y: 0, tx: 0, ty: 0, raf: 0, last: 0
      };
      if (finePointer.matches) {
        var host = el.closest('.card__link') || el.parentNode;
        host.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          st.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
          st.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
          kick(st);
        });
        host.addEventListener('pointerleave', function () { st.tx = 0; st.ty = 0; kick(st); });
      }
      stages.push(st);
    });
    cleanups.push(function () { stages.forEach(function (st) { cancelAnimationFrame(st.raf); }); stages = []; });
  }

  function kick(st) {
    if (st.raf) return;
    st.last = performance.now();
    st.raf = requestAnimationFrame(function step(now) {
      var k = 1 - Math.exp(-(now - st.last) / 110); // ~110 ms de constante: rápido pero suave
      st.last = now;
      st.x += (st.tx - st.x) * k;
      st.y += (st.ty - st.y) * k;
      var rest = Math.abs(st.tx - st.x) < 0.002 && Math.abs(st.ty - st.y) < 0.002;
      if (rest) { st.x = st.tx; st.y = st.ty; }
      st.jar.style.transform = 'perspective(900px) rotateX(' + (-st.y * st.max).toFixed(2) + 'deg) rotateY(' + (st.x * st.max).toFixed(2) + 'deg)';
      for (var i = 0; i < st.gs.length; i++) {
        var d = +st.gs[i].getAttribute('data-g') * 16;
        st.gs[i].style.transform = 'translate3d(' + (st.x * d).toFixed(1) + 'px,' + (st.y * d).toFixed(1) + 'px,0)';
      }
      st.raf = rest ? 0 : requestAnimationFrame(step);
    });
  }

  function scrollStages(vh) {
    if (finePointer.matches) return;
    for (var i = 0; i < stages.length; i++) {
      var r = stages[i].el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      var pos = Math.max(-1, Math.min(1, ((r.top + r.height / 2) / vh) * 2 - 1));
      stages[i].ty = pos * 0.55;
      stages[i].tx = pos * -0.3;
      kick(stages[i]);
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      var vh = window.innerHeight;
      if (y < vh * 1.2) {
        for (var i = 0; i < parallaxEls.length; i++) {
          parallaxEls[i].style.transform = 'translate3d(0,' + (y * +parallaxEls[i].getAttribute('data-depth')).toFixed(1) + 'px,0)';
        }
      }
      scrollStages(vh);
      if (state.view === 'product') {
        var max = document.documentElement.scrollHeight - vh;
        progressBar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
      }
    });
  }

  // Barra de compra fija: aparece al pasar el hero, se oculta en la oferta y el cierre.
  function setupBuybar(p) {
    buybar.innerHTML = '<div class="buybar__inner"><div class="buybar__info"><span class="buybar__name">' + esc(p.name) + '</span>' +
      priceHtml(p, true) + '</div>' + buyBtn(p, p.cta, 'btn--sm') + '</div>';
    if (!('IntersectionObserver' in window)) return;
    var hero = document.getElementById('p-hero');
    var hiders = [document.getElementById('oferta'), document.getElementById('final')];
    var vis = { hero: true, offer: false, final: false };
    function update() {
      var show = !vis.hero && !vis.offer && !vis.final;
      buybar.classList.toggle('is-on', show);
      buybar.setAttribute('aria-hidden', show ? 'false' : 'true');
      buybar.inert = !show;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var k = en.target === hero ? 'hero' : en.target.id === 'oferta' ? 'offer' : 'final';
        vis[k] = en.isIntersecting;
      });
      update();
    }, { threshold: 0.05 });
    io.observe(hero); hiders.forEach(function (h) { if (h) io.observe(h); });
    cleanups.push(function () { io.disconnect(); buybar.classList.remove('is-on'); buybar.inert = true; });
  }

  /* ---------- Shopify ---------- */

  function storefront(query, variables) {
    var s = DATA.shopify;
    return fetch('https://' + s.domain + '/api/' + s.apiVersion + '/graphql.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': s.storefrontToken },
      body: JSON.stringify({ query: query, variables: variables || {} })
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.errors) throw new Error(j.errors[0].message);
      return j.data;
    });
  }

  function loadShopify() {
    DATA.products.forEach(function (p) {
      if (!p.shopifyHandle || isDato(p.shopifyHandle) || !DATA.shopify.storefrontToken) return;
      storefront(
        'query($h:String!){product(handle:$h){availableForSale variants(first:1){nodes{id availableForSale price{amount currencyCode} compareAtPrice{amount}}}}}',
        { h: p.shopifyHandle }
      ).then(function (d) {
        var v = d.product && d.product.variants.nodes[0];
        if (!v) return;
        state.shop[p.slug] = {
          variantId: v.id, available: v.availableForSale,
          amount: parseFloat(v.price.amount), currency: v.price.currencyCode,
          compareAt: v.compareAtPrice ? parseFloat(v.compareAtPrice.amount) : null
        };
        refreshPrices(p.slug);
        if (!v.availableForSale) markSoldOut(p.slug);
      }).catch(function (e) { console.warn('[FindDrop] Shopify:', e.message); });
    });
  }

  function markSoldOut(slug) {
    document.querySelectorAll('[data-buy="' + slug + '"]').forEach(function (b) {
      b.disabled = true;
      b.querySelector('.btn__label').textContent = 'Agotado por ahora';
    });
  }

  function buy(slug, btn) {
    var p = findProduct(slug), shop = state.shop[slug];
    var label = btn.querySelector('.btn__label'), original = label.textContent;
    var fallback = safeUrl(p.buyUrl);

    if (shop && shop.variantId) {
      btn.disabled = true; label.textContent = 'Abriendo pago…';
      storefront(
        'mutation($l:[CartLineInput!]!){cartCreate(input:{lines:$l}){cart{checkoutUrl} userErrors{message}}}',
        { l: [{ merchandiseId: shop.variantId, quantity: 1 }] }
      ).then(function (d) {
        var c = d.cartCreate;
        if (c.userErrors.length || !c.cart) throw new Error(c.userErrors[0] ? c.userErrors[0].message : 'sin carrito');
        window.location.href = c.cart.checkoutUrl;
      }).catch(function (e) {
        btn.disabled = false; label.textContent = original;
        if (fallback) window.location.href = fallback;
        else toast('No pudimos abrir el pago. Intenta de nuevo en un momento.');
        console.warn('[FindDrop] checkout:', e.message);
      });
      return;
    }
    if (fallback) {
      if (/wa\.me|whatsapp/.test(fallback)) window.open(fallback, '_blank', 'noopener');
      else window.location.href = fallback;
      return;
    }
    toast('Falta el enlace de compra: completa <mark class="dato">shopifyHandle</mark> o <mark class="dato">buyUrl</mark> en data.js.');
  }

  /* ---------- FAQ ---------- */

  function toggleFaq(btn) {
    var open = btn.getAttribute('aria-expanded') !== 'true';
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.classList.toggle('is-open', open);
    panel.inert = !open;
  }

  /* ---------- router ---------- */

  function parse() {
    var h = location.hash;
    if (h.indexOf('#/') !== 0) return null;
    var slug = decodeURIComponent(h.slice(2)).replace(/\/$/, '');
    return slug && findProduct(slug) ? { view: 'product', p: findProduct(slug) } : { view: 'home' };
  }

  function render(route, opts) {
    opts = opts || {};
    cleanups.forEach(function (fn) { fn(); }); cleanups = [];

    var leavingHome = state.view === 'home' && route.view === 'product';
    if (leavingHome) state.homeScroll = window.scrollY;

    state.view = route.view;
    document.body.setAttribute('data-view', route.view);

    if (route.view === 'product') {
      app.innerHTML = productView(route.p);
      document.title = route.p.name + ' · FindDrop';
      renderNav('product', route.p);
      setupBuybar(route.p);
    } else {
      app.innerHTML = homeView();
      document.title = 'FindDrop · ' + DATA.brand.slogan;
      renderNav('home');
      buybar.innerHTML = '';
    }
    renderFooter(route.view);
    if (route.view === 'product') {
      var s = state.shop[route.p.slug];
      if (s && s.available === false) markSoldOut(route.p.slug);
    }

    // Posición: arriba en el producto; al volver, donde estaba la tarjeta.
    var y = route.view === 'home' && opts.restore ? state.homeScroll : 0;
    window.scrollTo(0, y);
    progressBar.style.transform = 'scaleX(0)';

    setupReveal();
    setupCounters();
    setupParallax();
    setupStages();
    onScroll();

    if (opts.focus) {
      var h1 = app.querySelector('h1');
      if (h1) h1.focus({ preventScroll: true });
    }
  }

  function navigate() {
    var route = parse();
    if (!route) return; // ancla interna (ej. #app del enlace de salto)
    if (route.view === state.view && route.p === undefined) return;
    var restore = state.view === 'product' && route.view === 'home';
    var go = function () { render(route, { restore: restore, focus: true }); };

    if (document.startViewTransition && !reduceMotion.matches) {
      document.startViewTransition(go);
    } else if (!reduceMotion.matches) {
      app.classList.add('is-leaving');
      setTimeout(function () { go(); app.classList.remove('is-leaving'); }, 180);
    } else {
      go();
    }
  }

  /* ---------- eventos ---------- */

  document.addEventListener('click', function (e) {
    var buyEl = e.target.closest('[data-buy]');
    if (buyEl) { e.preventDefault(); buy(buyEl.getAttribute('data-buy'), buyEl); return; }

    var sc = e.target.closest('[data-scroll]');
    if (sc) {
      var target = document.getElementById(sc.getAttribute('data-scroll'));
      if (target) { e.preventDefault(); scrollToEl(target); }
      return;
    }

    var q = e.target.closest('.faq__q');
    if (q) { toggleFaq(q); return; }

    // El logo y "Volver a la tienda" desde la tienda: subir al inicio.
    var home = e.target.closest('a[href="#/"]');
    if (home && state.view === 'home') { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' }); }
  });

  document.querySelector('.skip-link').addEventListener('click', function (e) {
    e.preventDefault();
    var h1 = app.querySelector('h1');
    (h1 || app).focus();
  });

  window.addEventListener('hashchange', navigate);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', setupParallax);
  buybar.inert = true;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  render(parse() || { view: 'home' });
  loadShopify();
})();
