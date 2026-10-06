/* =============================================================================
   Medición — Google Analytics 4, Google Tag Manager y Meta Pixel.

   El pliego pide "preparar integración ... para medir visitas, inicio de inscripción,
   reserva y compra". Esto deja el cableado listo pero APAGADO: mientras los ids estén
   vacíos no se carga ningún script de terceros ni se setea una sola cookie. Completar
   los ids de abajo lo enciende, sin tocar nada más.

   El sitio llama a `window.adrTrack(evento, datos)`; si no hay ids configurados es un
   no-op silencioso, así que el código del sitio no necesita preguntarse si hay medición.
   ============================================================================= */
(() => {
  "use strict";

  const IDS = {
    ga4: "",        // G-XXXXXXXXXX
    gtm: "",        // GTM-XXXXXXX
    metaPixel: ""   // 15 o 16 dígitos
  };

  const cargar = (src) => {
    const s = document.createElement("script");
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  };

  if (IDS.ga4) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", IDS.ga4);
    cargar("https://www.googletagmanager.com/gtag/js?id=" + IDS.ga4);
  }

  if (IDS.gtm) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    cargar("https://www.googletagmanager.com/gtm.js?id=" + IDS.gtm);
  }

  if (IDS.metaPixel) {
    const n = (window.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    n.queue = [];
    n.loaded = true;
    n.version = "2.0";
    cargar("https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", IDS.metaPixel);
    window.fbq("track", "PageView");
  }

  /* Los cuatro eventos que nombra el pliego. `visita` sale sola del page view de cada
     plataforma; los otros tres los dispara el sitio:
       - inicio_inscripcion → primera interacción con el formulario de reserva
       - reserva            → "Reservar mi lugar" con los datos válidos
       - compra             → checkout del carrito
     Se mandan a las tres plataformas a la vez; la que no esté configurada se saltea. */
  const MAPA_META = { inicio_inscripcion: "InitiateCheckout", reserva: "Lead", compra: "Purchase" };

  window.adrTrack = function (evento, datos) {
    const d = datos || {};
    try {
      if (window.gtag && IDS.ga4) window.gtag("event", evento, d);
      if (window.dataLayer && IDS.gtm) window.dataLayer.push(Object.assign({ event: evento }, d));
      if (window.fbq && IDS.metaPixel) window.fbq("track", MAPA_META[evento] || evento, d);
    } catch (e) {
      // Que un bloqueador de anuncios rompa el tracking no puede romper la reserva.
    }
  };
})();
