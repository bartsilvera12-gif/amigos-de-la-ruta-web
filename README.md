# Amigos de la Ruta — sitio web

Esqueleto del sitio institucional/tienda de ADR. Es un sitio **estático**: no hay build,
no hay framework, no hay dependencias que instalar.

```
index.html     el sitio completo (export .dc.html de DesignCode)
support.js     runtime dc-runtime que interpreta los tags <x-dc>. Generado, no editar a mano.
anim.css       animaciones (keyframes, reveals, hovers)
anim.js        dispara los reveals al entrar en viewport
assets/        imágenes propias del sitio (emblema ADR)
fuentes/       material de referencia — NO se publica (ver .vercelignore):
               manual de identidad visual, proyecto integral y capturas
```

## Ver el sitio localmente

Hay que servirlo por HTTP — abrir `index.html` con doble clic no alcanza, porque las
rutas internas son absolutas (`/support.js`, `/assets/...`):

```bash
python -m http.server 8000
```

Y entrar a http://localhost:8000

## Deploy en Vercel

Importar el repo y dejar el framework en **Other**. Sin build command, sin output
directory: Vercel publica la raíz tal cual. Cada push a `main` redespliega.

Es un proyecto aparte del ERP (Zentra) a propósito: son dos deploys independientes y no
comparten nada.

## Animaciones

Viven en `anim.css` y `anim.js`, **fuera** del export, para que reemplazar `index.html` no
se las lleve puestas. El markup sólo aporta atributos `data-*`:

| Atributo | Qué hace |
| --- | --- |
| `data-reveal` | Aparece al entrar en viewport. Variantes: `up` (default), `down`, `left`, `right`, `zoom`, `fade`, `clip`. |
| `data-stagger` | En un contenedor: sus hijos entran escalonados, uno detrás de otro. |
| `data-card` | Tarjeta que levanta al pasar el mouse y hace zoom a su imagen. |
| `data-zoom` | La "imagen" de una tarjeta cuando es un `background-image` y no un `<img>`. |
| `data-shine` | Barrido de luz sobre el botón al pasar el mouse. |
| `data-underline` | Subrayado que crece de izquierda a derecha. |
| `data-kenburns` | Zoom lento y continuo sobre una foto de fondo. |
| `data-float`, `data-bob`, `data-halo`, `data-drift` | Movimientos de ambiente en bucle. |
| `data-bar` | Barra de progreso que crece al entrar en viewport. |

Dos cosas a no romper:

- **Nada queda invisible si falla el JS.** El estado inicial oculto de `data-reveal` sólo
  aplica bajo `html.adr-js`, clase que pone `anim.js`. Sin JS, con `prefers-reduced-motion`,
  o si el script explota, el contenido se ve igual. Además hay un watchdog a los 6 s.
- **No pongas animaciones con `transform` sobre elementos cuyo `transform` sea un binding
  del export** (el botón flotante de WhatsApp, el track del carrusel): el estilo inline gana
  y se pelean. En esos casos va `data-shine`, que no usa transform sobre el elemento.

Los hovers globales enganchan por `[style*="cursor: pointer"]`, porque el export define todo
con estilos inline y no deja clases a las que agarrarse. React serializa el inline
normalizado, así que el selector es estable.

## Si se reemplaza el export de DesignCode

El export emite las rutas internas **relativas** (`./support.js`, `assets/...`) y sin
`<title>`. Al reemplazar `index.html` hay que volver a:

1. pasar esas rutas a absolutas (`/support.js`, `/assets/...`),
2. re-agregar el `<title>` y el `<link rel="icon">` en el `<head>`,
3. re-agregar `<link rel="stylesheet" href="/anim.css">` y
   `<script src="/anim.js" defer></script>`, y
4. volver a poner los atributos `data-*` de la tabla de arriba.

## Límite conocido

`support.js` descarga React 18, ReactDOM y Babel standalone desde unpkg.com y transpila el
HTML en el browser. O sea: el sitio **necesita internet** para pintar y el primer paint baja
~1 MB de CDN, además de transpilar en caliente. Alcanza de sobra para mostrar el esqueleto;
si el sitio pasa a producción real, conviene portar las vistas a componentes de un framework
y dejar de depender de unpkg.
