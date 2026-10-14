/*
 * Etiqueta cada celda de las tablas con el nombre de su columna (data-label) para que, en pantallas pequenas,
 * responsive.css pueda mostrar cada fila como una tarjeta "Columna: valor". Las tablas de esta aplicacion se
 * dibujan dinamicamente, asi que se observa el documento y se etiquetan las filas nuevas.
 */
(function () {
  "use strict";
  var QUITAR = /[↕↑↓▲▼⇅]/g;   // flechas de ordenamiento

  function norm(t) {
    return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
  }

  function encabezados(tabla) {
    var fila = tabla.querySelector("thead tr:last-child") || tabla.querySelector("tr");
    if (!fila) return [];
    var out = [];
    Array.prototype.forEach.call(fila.children, function (th) {
      var n = parseInt(th.getAttribute("colspan") || "1", 10) || 1;
      var t = (th.textContent || "").replace(QUITAR, "").replace(/\s+/g, " ").trim();
      for (var i = 0; i < n; i++) out.push(t);
    });
    return out;
  }

  function etiquetarTabla(tabla) {
    var cols = encabezados(tabla);
    if (cols.length === 0) return;
    var principales = null;     // en celular solo se ven estas columnas; el resto al tocar la tarjeta (data-principales en la tabla)
    if (tabla.hasAttribute("data-principales")) {
      principales = {};
      tabla.getAttribute("data-principales").split(",").forEach(function (n) { principales[norm(n)] = true; });
    }
    Array.prototype.forEach.call(tabla.querySelectorAll("tbody tr"), function (tr) {
      var i = 0;
      Array.prototype.forEach.call(tr.cells, function (td) {
        var span = parseInt(td.getAttribute("colspan") || "1", 10) || 1;
        if (span > 1 && span >= cols.length - 1) {          // "sin resultados" y similares
          td.classList.add("td-vacia");
        } else if (td.getAttribute("data-label") === null || td.getAttribute("data-auto") === "1") {
          td.setAttribute("data-label", cols[i] || "");
          td.setAttribute("data-auto", "1");
        }
        if (principales && !td.classList.contains("td-vacia")) td.classList.toggle("principal", !!principales[norm(td.getAttribute("data-label") || "")]);
        i += span;
      });
    });
  }

  function etiquetarTodo() {
    Array.prototype.forEach.call(document.querySelectorAll("table"), etiquetarTabla);
  }

  var pendiente = false;
  function programar() {
    if (pendiente) return;
    pendiente = true;
    // setTimeout (no requestAnimationFrame): rAF se pausa en pestanas en segundo plano y las tarjetas quedarian sin etiqueta
    window.setTimeout(function () { pendiente = false; etiquetarTodo(); }, 30);
  }

  function iniciar() {
    etiquetarTodo();
    new MutationObserver(programar).observe(document.body, { childList: true, subtree: true, characterData: false });
    iniciarMenuHover();
  }
  // Tocar una tarjeta (solo celular) muestra u oculta el resto de sus datos
  document.addEventListener("click", function (e) {
    if (!window.matchMedia("(max-width: 600px)").matches) return;
    var tr = e.target.closest ? e.target.closest("tr") : null;
    if (!tr || !tr.closest("table[data-principales]")) return;
    if (e.target.closest("select, input, button, a, label, textarea")) return;
    tr.classList.toggle("abierta");
  });

  // Escritorio: el menu lateral queda oculto y se abre al pasar el mouse por el icono del menu (en Inicio se deja visible).
  function iniciarMenuHover() {
    var enInicio = /(^|\/)(index\.html)?$/.test(location.pathname);
    var btn = document.getElementById("menu-toggle-movil"), sb = document.getElementById("sidebar");
    if (enInicio || !btn || !sb) return;
    document.body.classList.add("menu-hover");
    var esc = function () { return window.matchMedia("(min-width: 881px)").matches; };
    var timer = null;
    function abrir() { clearTimeout(timer); sb.classList.add("abierto-movil"); }
    function cerrar() { clearTimeout(timer); timer = setTimeout(function () { sb.classList.remove("abierto-movil"); }, 250); }
    btn.addEventListener("mouseenter", function () { if (esc()) abrir(); });
    btn.addEventListener("mouseleave", function () { if (esc()) cerrar(); });
    sb.addEventListener("mouseenter", function () { if (esc()) clearTimeout(timer); });
    sb.addEventListener("mouseleave", function () { if (esc()) cerrar(); });
    // el clic del icono en escritorio solo abre (el menu ya se abre con el mouse); no lo cierra
    btn.addEventListener("click", function (e) { if (esc()) { e.stopImmediatePropagation(); abrir(); } }, true);
    // al elegir un enlace o con Escape se cierra
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && esc()) sb.classList.remove("abierto-movil"); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
