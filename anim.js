/* =============================================================================
   Motor de las animaciones de scroll del sitio ADR.

   Por qué no es sólo CSS: los reveals tienen que dispararse cuando el elemento
   entra en viewport, y el sitio es una SPA — el runtime de DesignCode remonta el
   DOM en cada cambio de vista (inicio / viajes / tienda / FAQ), así que los nodos
   que observamos desaparecen y aparecen otros. De ahí el MutationObserver.

   Contrato con anim.css: este script agrega `adr-js` en <html> (habilita el
   estado inicial invisible), `.adr-in` cuando el elemento entra, y `--adr-i`
   para escalonar hermanos. Si algo de esto falla, el watchdog del final deja
   todo visible.
   ============================================================================= */
(() => {
  "use strict";

  const raiz = document.documentElement;
  const quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Sin IntersectionObserver (o con "reducir movimiento") no escondemos nada:
  // mejor sitio sin animar que sitio invisible.
  if (quieto || !("IntersectionObserver" in window) || !("MutationObserver" in window)) return;

  raiz.classList.add("adr-js");

  /* --- Escalonado -----------------------------------------------------------
     Los hijos de un [data-stagger] entran uno detrás de otro. El índice va como
     custom property y no como delay fijo, para que anim.css decida el paso. Se
     recalcula por padre y no de una vez, porque las listas se filtran en vivo
     (categorías de la tienda, filtros de viajes) y los índices se corren. */
  function escalonar(nodo) {
    const padres = new Set();
    for (const el of nodo.querySelectorAll("[data-stagger] > *")) padres.add(el.parentElement);
    if (nodo.matches && nodo.matches("[data-stagger]")) padres.add(nodo);
    for (const p of padres) {
      let i = 0;
      for (const hijo of p.children) hijo.style.setProperty("--adr-i", String(i++));
    }
  }

  /* --- Entrada en viewport --------------------------------------------------
     `rootMargin` negativo abajo: el elemento no se considera visible apenas
     asoma un pixel, sino cuando ya entró de verdad. Una vez animado lo dejamos
     de observar: el reveal es de una sola vez, no un yo-yo al scrollear. */
  const observador = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("adr-in");
      observador.unobserve(e.target);
    }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });

  const SELECTOR = "[data-reveal], [data-bar]";

  function registrar(nodo) {
    if (nodo.nodeType !== 1) return;
    escalonar(nodo);
    const candidatos = nodo.matches(SELECTOR) ? [nodo, ...nodo.querySelectorAll(SELECTOR)]
                                              : [...nodo.querySelectorAll(SELECTOR)];
    for (const el of candidatos) {
      if (el.classList.contains("adr-in")) continue;
      // Lo que ya está en pantalla al montar (el hero, el header de cada vista)
      // se revela en el acto: esperar al observer le mete un parpadeo.
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) el.classList.add("adr-in");
      else observador.observe(el);
    }
  }

  function arrancar() {
    registrar(document.body);
    // El runtime monta la app después de bajar React y Babel de unpkg, así que
    // el primer registrar() casi siempre corre sobre un body vacío. Este
    // observer es el que realmente engancha el contenido, y el que lo vuelve a
    // enganchar en cada cambio de vista.
    new MutationObserver((muts) => {
      for (const m of muts) for (const n of m.addedNodes) registrar(n);
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) arrancar();
  else document.addEventListener("DOMContentLoaded", arrancar, { once: true });

  /* --- Watchdog -------------------------------------------------------------
     Último recurso. Si unpkg tarda, el runtime explota o el observer se pierde
     algún nodo, a los 6 s marcamos todo como revelado. Es preferible perder la
     animación a que quede contenido en opacity 0 para siempre. */
  setTimeout(() => {
    for (const el of document.querySelectorAll(SELECTOR)) el.classList.add("adr-done");
  }, 6000);
})();
