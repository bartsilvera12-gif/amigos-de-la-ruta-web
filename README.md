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
  o si el script explota, el contenido se ve igual.
- **El watchdog mira si el mecanismo está vivo, no el reloj.** A los 6 s (y a los 15 s)
  revela todo *sólo si no hubo ni un reveal*, señal de que el observer no arranca. Un
  elemento al que todavía no scrollearon tiene que seguir escondido por horas si hace
  falta: revelar por tiempo mataba las animaciones en cualquier visita larga. También
  se revela de entrada si `window.innerHeight` es 0 (pestaña oculta), porque ahí
  IntersectionObserver no dispara nunca.
- **No pongas animaciones con `transform` sobre elementos cuyo `transform` sea un binding
  del export** (el botón flotante de WhatsApp, el track del carrusel): el estilo inline gana
  y se pelean. En esos casos va `data-shine`, que no usa transform sobre el elemento.

Los hovers globales enganchan por `[style*="cursor: pointer"]`, porque el export define todo
con estilos inline y no deja clases a las que agarrarse. React serializa el inline
normalizado, así que el selector es estable.

## Estructura del sitio

| URL | Vista |
| --- | --- |
| `#/` | Inicio — hero, próximos viajes, detalle del viaje destacado, reserva y teaser de tienda |
| `#/nosotros` | Quiénes somos |
| `#/viajes` | Listado de viajes con filtros |
| `#/viajes/<slug>` | Detalle de un viaje: itinerario, incluye/no incluye, salidas, paquetes y reserva |
| `#/galeria` | Galería |
| `#/tienda` | Tienda |
| `#/tienda/<sku>` | Ficha de producto |
| `#/faq` | Preguntas frecuentes |

Las rutas van en el hash porque el sitio es un único `index.html` servido estático.
Son enlazables y el botón Atrás funciona. Toda la traducción entre URL y estado está en
`urlDeEstado()` / `rutaDesdeUrl()`: cuando el catálogo salga del ERP y cada evento tenga
su propia página, se cambia ahí y nada más.

## Cada viaje es dueño de su contenido

El pliego lo pide explícito: *"No programar campos exclusivos para Route 66, Daytona,
Alaska o Sturgis"*. Antes el itinerario, las inclusiones, las salidas y los paquetes eran
constantes globales con el contenido de Route 66, así que "Ver detalle" de cualquier viaje
mostraba Route 66. Ahora cada entrada de `EVENTS` trae lo suyo:

```js
{ slug, name, img, foto, resumen, specs,
  itinerario: [...], incluye: {es,pt}, noIncluye: {es,pt},
  salidas: [...], paquetes: [...] }
```

**Sólo Route 66 tiene el contenido cargado.** Los demás viajes llevan itinerario e
inclusiones vacíos a propósito — la vista oculta lo que está vacío y muestra un aviso de
"se publica próximamente" en vez de pestañas en blanco. No se inventó contenido de viajes
que la empresa vende de verdad: eso lo carga ADR (o, más adelante, el ERP).

La sección de detalle es **un solo markup** que sirve al inicio (viaje destacado) y a
`#/viajes/<slug>`. No hay dos copias que mantener sincronizadas.

## Imágenes que dependen de datos

Van siempre como `background-image:url({{ ... }})` sobre un `div`, nunca como
`<img src="{{ ... }}">`. El parser del navegador ve el `src` antes de que el runtime lo
resuelva y pide la plantilla literal como si fuera una ruta: un 404 por carga. El export
original ya hacía esto por la misma razón.

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

## Monedas de cobro

El pliego pide soporte inicial para **USD, BRL y PYG**. Los precios del catálogo están en
dólares: esa es la moneda base (`MONEDA_BASE`). Lo que se elige en el formulario es en qué
moneda se **cobra**, y el resumen convierte total, saldo y seña.

Las cotizaciones viven en `COTIZACIONES`, en `index.html`:

```js
const COTIZACIONES = {
  fecha: "07/10/2026",
  USD: { tasa: 1,    simbolo: "USD", decimales: 0, locale: "de-DE" },
  BRL: { tasa: 5.06, simbolo: "R$",  decimales: 2, locale: "pt-BR" },
  PYG: { tasa: 6048, simbolo: "Gs",  decimales: 0, locale: "de-DE" }
};
```

**Hay que mantenerlas al día.** Son de referencia, no una cotización en firme. Por eso el
objeto lleva `fecha` y el sitio la muestra en pantalla junto a la tasa usada: una
cotización vieja se nota, en vez de pasar por buena. Cuando el ERP esté conectado, salen
de ahí.

Cada moneda trae su `locale` y sus `decimales` porque no se escriben igual: el guaraní no
lleva decimales, el real usa coma. El dólar va sin decimales para que el resumen se lea
igual que los precios del catálogo (`USD 7.900`).

El pedido que sale por WhatsApp cumple lo que pide el pliego — *"guardar siempre moneda e
importe original del pago, tipo de cambio aplicado y equivalente"*:

```
Moneda de cobro: PYG
Total contratado: Gs 47.779.200
Saldo pendiente: Gs 38.707.200
Equivalente: USD 7.900 (1 USD = Gs 6.048, 07/10/2026)
```

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
