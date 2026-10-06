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

## Qué hay que completar antes de salir a producción

Todo junto, arriba del `<script>` de la lógica en `index.html`, salvo los ids de medición:

| Dónde | Qué falta |
| --- | --- |
| `WHATSAPP` | Número real de ADR. Hoy `595981000000`, el de relleno. Lo usan el botón flotante, el teléfono de contacto y el envío de la reserva. |
| `TELEFONO_VISIBLE` | El mismo número, como se muestra en pantalla. |
| `REDES` | URLs de Instagram, Facebook, YouTube y TikTok. Las vacías no se muestran (en vez de quedar como enlaces muertos). |
| `analytics.js` → `IDS` | GA4, GTM y Meta Pixel. Vacíos = no se carga ningún script de terceros ni se setea una sola cookie. |

## Medición

`analytics.js` deja el cableado listo y apagado. El sitio llama a `window.adrTrack(evento, datos)`,
que es un no-op silencioso mientras no haya ids. Los eventos son los que pide el pliego:

- `visita` — sale sola del page view de cada plataforma.
- `inicio_inscripcion` — primera interacción real con el formulario de reserva (una sola vez por sesión; ver la sección no cuenta).
- `reserva` — "Reservar mi lugar" con los datos válidos, con viaje, paquete y total.
- `compra` — **todavía no se dispara**: el checkout del carrito necesita el ERP.

## WhatsApp contextual

El mensaje precargado dice desde dónde consulta la persona, como pide el pliego:

| Dónde está | Mensaje |
| --- | --- |
| Inicio | el viaje que muestra el carrusel en ese momento ("...por el viaje Route 66") |
| Viajes / Tienda / FAQ | la sección |
| Detalle de producto | el producto y su SKU |

El detalle de producto manda sobre la vista, porque es lo más específico que la persona tiene abierto.

## Formulario de reserva

Está en la sección "Reservá en cuatro pasos" y funciona de verdad: se elige viaje,
salida y paquete, se cargan los datos del participante, y el resumen calcula paquete,
pasajeros, total contratado, saldo pendiente y la barra de avance. La seña es fija
(`DEPOSIT`, USD 1.500).

**Falta poner el número real de WhatsApp.** El botón "Reservar mi lugar" valida los
campos y abre `wa.me` con la reserva ya escrita, pero apunta a la constante `WHATSAPP`
de `index.html`, que hoy tiene el número de relleno que ya traía el sitio
(`595981000000`). Formato internacional, sólo dígitos, sin `+` ni espacios.

### Desplegables

No hay ningún `<select>` nativo en el sitio. El nativo abre con el chrome del sistema
operativo — fondo blanco, resalte azul — y eso no se puede tematizar desde CSS, así que
desentonaba con todo lo demás. En su lugar hay un desplegable propio (`dropdown()` y
`dropdownOpts()` en la lógica), usado por los cuatro selectores de la reserva y por el
orden de la tienda.

Detalles que conviene conservar si se tocan:

- Disparador y opciones son `<button type="button">`, no `div`. Así se enfocan con Tab y
  se activan con Enter o Espacio sin escribir nada de teclado a mano.
- Cierra al tocar afuera gracias a una tapa `position:fixed` detrás del panel, no con un
  listener global en `document`: no hay que acordarse de desengancharlo.
- `openSel` guarda cuál está abierto, así que sólo puede haber uno a la vez.

Sobre los datos: el catálogo sólo modela **Route 66** en profundidad — es el único viaje
con salidas y paquetes propios (`DEPARTURES`, `PACKAGES`). Para los demás, el formulario
deriva una salida única y un "paquete base" de 1 persona a partir del propio evento, así
el total siempre sale de un precio real del catálogo. Si se quieren paquetes por viaje,
hay que extender esos datos.

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
