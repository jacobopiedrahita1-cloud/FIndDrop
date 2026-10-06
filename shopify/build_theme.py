"""Empaqueta el sitio de FindDrop como tema de Shopify.

Uso:  python3 shopify/build_theme.py
Sale: dist/finddrop-theme.zip  (Shopify > Tienda online > Temas > Agregar tema > Subir archivo .zip)

index.html, styles.css, data.js y app.js siguen siendo la única fuente:
este script los copia y genera layout/theme.liquid a partir de index.html.
"""
import pathlib, re, shutil, zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC_THEME = ROOT / 'shopify' / 'theme'
BUILD = ROOT / 'dist' / 'theme'
ZIP = ROOT / 'dist' / 'finddrop-theme.zip'


def asset(name):
    return "{{ '%s' | asset_url }}" % name


def layout():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    for name in ('styles.css', 'data.js', 'app.js'):
        html = html.replace('"%s"' % name, '"%s"' % asset(name))
    html = re.sub(r'"assets/([^"]+)"', lambda m: '"%s"' % asset(m.group(1)), html)

    head, body = html.split('<body>')
    body, tail = body.split('</body>')
    head = head.replace('</head>', '{{ content_for_header }}\n</head>')

    # El sprite de íconos es común a todas las páginas; el resto del body es la tienda (solo en el inicio).
    sprite_end = body.index('</svg>\n') + len('</svg>\n')
    sprite, spa = body[:sprite_end], body[sprite_end:]
    scripts_at = spa.index('<script src=')
    spa_markup, spa_scripts = spa[:scripts_at], spa[scripts_at:]
    # Reseñas de Judge.me del producto destacado: se cargan con la página (para que Judge.me
    # las inicialice) y app.js las mueve a la sección de reseñas de #/lullabites.
    reviews = ("{%- assign fd_product = all_products['lullabites'] -%}\n"
               "{%- if fd_product.id -%}<div id=\"fd-reviews-holder\" hidden>"
               "{% render 'judgeme-widget', product: fd_product %}</div>{%- endif -%}\n")
    base = "<script>window.FINDDROP_ASSET_BASE = {{ 'favicon.png' | asset_url | split: 'favicon.png' | first | json }};</script>\n"

    other = '''<header class="site-header">
  <div class="wrap site-header__inner">
    <a class="logo" href="{{ routes.root_url }}" aria-label="FindDrop, ir a la tienda">
      <svg class="logo__drop" aria-hidden="true"><use href="#i-drop" /></svg>
      <span class="logo__word" aria-hidden="true"><span class="thin">Find</span><b>Drop</b></span>
    </a>
    <nav class="nav" aria-label="Principal">
      <a href="{{ routes.root_url }}" class="back"><svg class="icon" aria-hidden="true"><use href="#i-back"/></svg><span>Volver a la tienda</span></a>
    </nav>
  </div>
</header>
<main class="sec sec--light page-shell" id="app"><div class="wrap wrap--narrow">
{{ content_for_layout }}
</div></main>
<footer class="site-footer"><div class="wrap footer__bottom"><span>© {{ 'now' | date: '%Y' }} FindDrop</span><span>Un hallazgo por semana</span></div></footer>
'''
    return (head + '<body>' + sprite +
            "{%- if template.name == 'index' -%}\n" + spa_markup + reviews + '{{ content_for_layout }}\n' + base + spa_scripts +
            '{%- else -%}\n' + other + '{%- endif -%}\n</body>' + tail)


def main():
    if BUILD.exists():
        shutil.rmtree(BUILD)
    shutil.copytree(SRC_THEME, BUILD)
    (BUILD / 'layout').mkdir()
    (BUILD / 'layout' / 'theme.liquid').write_text(layout(), encoding='utf-8')
    (BUILD / 'assets').mkdir()
    for name in ('styles.css', 'data.js', 'app.js'):
        shutil.copy(ROOT / name, BUILD / 'assets' / name)
    for f in (ROOT / 'assets').iterdir():
        shutil.copy(f, BUILD / 'assets' / f.name)

    ZIP.unlink(missing_ok=True)
    with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(BUILD.rglob('*')):
            if f.is_file():
                z.write(f, f.relative_to(BUILD).as_posix())
    print('Listo:', ZIP.relative_to(ROOT.parent))


if __name__ == '__main__':
    main()
