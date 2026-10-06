# Amigos de la Ruta — sitio web

Esqueleto del sitio institucional/tienda de ADR. Es un sitio **estático**: no hay build,
no hay framework, no hay dependencias que instalar.

```
index.html     el sitio completo (export .dc.html de DesignCode)
support.js     runtime dc-runtime que interpreta los tags <x-dc>. Generado, no editar a mano.
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

## Si se reemplaza el export de DesignCode

El export emite las rutas internas **relativas** (`./support.js`, `assets/...`) y sin
`<title>`. Al reemplazar `index.html` hay que volver a:

1. pasar esas rutas a absolutas (`/support.js`, `/assets/...`), y
2. re-agregar el `<title>` y el `<link rel="icon">` en el `<head>`.

## Límite conocido

`support.js` descarga React 18, ReactDOM y Babel standalone desde unpkg.com y transpila el
HTML en el browser. O sea: el sitio **necesita internet** para pintar y el primer paint baja
~1 MB de CDN, además de transpilar en caliente. Alcanza de sobra para mostrar el esqueleto;
si el sitio pasa a producción real, conviene portar las vistas a componentes de un framework
y dejar de depender de unpkg.
