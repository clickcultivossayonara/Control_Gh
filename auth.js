// auth.js - sesion compartida para todas las paginas protegidas del sitio.
//
// Cada pagina protegida debe cargar, en este orden, antes de su propio script:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="auth.js"></script>
//
// Expone:
//   AUTH_READY        Promise que resuelve con window.SESION (o navega a login.html)
//   authHeaders()      headers para fetch directo a Supabase REST con la sesion actual
//   requireRole([...]) redirige a index.html si el rol de la sesion no esta permitido
//   cerrarSesion()     logout + redirect a login.html
//   pintarSesion(id)    inserta nombre/rol + boton "Cerrar sesion" en el elemento #id

const SUPABASE_URL = "https://kgtwqywbowhllxqdjegi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtndHdxeXdib3dobGx4cWRqZWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMzQ4NjUsImV4cCI6MjEwMjkxMDg2NX0.NsrxM2EdIDvnmCPWjiNR3pBpcMXgPy8bQwagMOYAHHQ";

const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function _paginaActual() {
  return location.pathname.split("/").pop() || "index.html";
}

const AUTH_READY = (async () => {
  const { data: { session } } = await _sb.auth.getSession();
  if (!session) {
    location.href = "login.html?next=" + encodeURIComponent(_paginaActual());
    return new Promise(() => {});
  }

  const { data: perfil, error } = await _sb
    .from("usuarios_perfil")
    .select("nombre,email,rol,areas,activo")
    .eq("id", session.user.id)
    .single();

  if (error || !perfil || !perfil.activo) {
    await _sb.auth.signOut();
    location.href = "login.html";
    return new Promise(() => {});
  }

  window.SESION = {
    id: session.user.id,
    accessToken: session.access_token,
    email: perfil.email,
    nombre: perfil.nombre,
    rol: perfil.rol,
    areas: perfil.areas || [],
  };
  return window.SESION;
})();

_sb.auth.onAuthStateChange((_event, session) => {
  if (session && window.SESION) window.SESION.accessToken = session.access_token;
});

function authHeaders() {
  const s = window.SESION;
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: "Bearer " + (s ? s.accessToken : SUPABASE_ANON_KEY),
  };
}

function requireRole(rolesPermitidos) {
  if (!window.SESION || !rolesPermitidos.includes(window.SESION.rol)) {
    location.href = "index.html";
    return false;
  }
  return true;
}

async function cerrarSesion() {
  await _sb.auth.signOut();
  location.href = "login.html";
}

const ROL_ETIQUETA = { admin: "Administrador", nomina: "Nómina / RRHH", jefe_area: "Jefe de área" };

function pintarSesion(elId) {
  const el = document.getElementById(elId);
  if (!el || !window.SESION) return;
  el.innerHTML =
    `<span class="sesion-usuario">${window.SESION.nombre} &middot; ${ROL_ETIQUETA[window.SESION.rol] || window.SESION.rol}</span>` +
    `<button type="button" class="sesion-salir" id="btn-cerrar-sesion">Cerrar sesión</button>`;
  document.getElementById("btn-cerrar-sesion").addEventListener("click", cerrarSesion);
}

(function inyectarEstiloSesion() {
  const style = document.createElement("style");
  style.textContent = `
    .sesion-box { display:flex; align-items:center; gap:12px; justify-content:center; font-size:12.5px; color:var(--ink-faint); margin-top:8px; }
    .sesion-usuario { font-weight:600; color:var(--ink-soft); }
    .sesion-salir { font:inherit; font-size:12px; font-weight:600; padding:5px 12px; border-radius:20px; border:1px solid var(--line-strong); background:var(--surface); color:var(--ink-soft); cursor:pointer; }
    .sesion-salir:hover { border-color:var(--accent); color:var(--accent); }
  `;
  document.head.appendChild(style);
})();
