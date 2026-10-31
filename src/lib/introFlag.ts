/**
 * Eder: "quiero que la animación del hero solo se reproduzca cuando se
 * entra a la página, cuando se hace click en el logo... o cuando se
 * recarga la página" — es decir, NO cada vez que se vuelve a home por
 * una navegación normal (el botón "Volver" de una guía, el link
 * "Instrucciones VR" del nav/footer de una página de tutorial, etc.).
 *
 * Se guarda una bandera en sessionStorage (dura mientras la pestaña
 * siga abierta, se borra si se cierra — justo el alcance de "esta
 * sesión de navegación" que pide Eder) apenas termina la intro por
 * primera vez. page.tsx (Home) la revisa al montar: si ya está puesta,
 * se salta la animación y pasa directo a "revealed".
 *
 * El logo (Nav.tsx / InteriorNav.tsx) BORRA la bandera antes de navegar
 * a "/", así que un click ahí siempre fuerza que se vuelva a reproducir
 * aunque ya se haya visto antes en esta sesión.
 *
 * Los enlaces que deben aterrizar directo en una sección (el link
 * "Instrucciones VR" del nav/footer de una página de tutorial, el botón
 * "Volver" de una guía) hacen lo contrario: MARCAN la bandera antes de
 * navegar, para garantizar que nunca se interponga la intro camino a
 * esa sección, sin importar si técnicamente ya estaba puesta o no.
 *
 * Todo envuelto en try/catch porque sessionStorage puede lanzar en
 * contextos restringidos (navegación privada, storage deshabilitado) —
 * el peor caso ahí es que la intro se reproduzca de más, no que la app
 * se rompa.
 */
const INTRO_PLAYED_KEY = "estela:introPlayed";

/** True si la intro ya se reprodujo en esta sesión de pestaña. */
export function hasIntroPlayed(): boolean {
  try {
    return sessionStorage.getItem(INTRO_PLAYED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Marca la intro como ya reproducida — Home la saltará la próxima vez
 *  que monte, y cualquier link que deba aterrizar directo en una
 *  sección (sin pasar por la intro) la llama antes de navegar. */
export function markIntroPlayed(): void {
  try {
    sessionStorage.setItem(INTRO_PLAYED_KEY, "1");
  } catch {
    // Ver comentario de arriba del archivo.
  }
}

/** Borra la bandera — el logo la llama antes de navegar a "/" para
 *  forzar que la intro se vuelva a reproducir. */
export function clearIntroPlayed(): void {
  try {
    sessionStorage.removeItem(INTRO_PLAYED_KEY);
  } catch {
    // Ver comentario de arriba del archivo.
  }
}

/**
 * Eder: una recarga real (F5 / botón recargar) de home siempre debe
 * reproducir la intro, aunque ya se haya visto antes en esta sesión
 * (sessionStorage sobrevive una recarga, a propósito — es lo que hace
 * posible "Instrucciones VR"/"Volver" desde otra página — así que hace
 * falta esta señal aparte para distinguirla de una recarga real).
 *
 * BUG que esto corrige: `performance.getEntriesByType("navigation")`
 * describe cómo se cargó el DOCUMENTO actual de la pestaña — un solo
 * registro que no cambia con la navegación interna de Next.js (SPA, sin
 * recargar el documento). Si ese documento se cargó originalmente con F5
 * estando en OTRA ruta (p. ej. /tutoriales/meta-quest, muy típico al
 * probar cambios), ese "reload" queda pegado para el resto de la vida de
 * la pestaña: cualquier visita posterior a home por navegación normal
 * (el link "Instrucciones VR", el botón "Volver") se leía por error como
 * si home se hubiera recargado, y la intro volvía a interponerse aunque
 * la bandera de sessionStorage ya dijera que había que ir directo.
 *
 * La corrección (parte 1 — por ruta): calcular esto UNA sola vez, a nivel
 * de módulo, en el momento exacto en que el navegador cargó de verdad el
 * documento actual (no cuando Home decide montarse, que puede ser mucho
 * después por una navegación SPA). `window.location.pathname` en ese
 * instante es la ruta que el navegador realmente cargó; si no es "/", lo
 * que haya pasado con el tipo de navegación es irrelevante para home —
 * nunca se recargó home en sí, así que nunca debe forzar la intro. Como
 * introFlag.ts lo importan tanto componentes de home (Nav.tsx) como de
 * las páginas de tutorial (InteriorNav.tsx, VolverButton.tsx,
 * SiteFooter.tsx), y los módulos de JS se evalúan una sola vez por carga
 * real de página (el cache de módulos de Next.js/webpack es el mismo
 * durante toda la vida de la pestaña, pase lo que pase con la navegación
 * SPA después), estas constantes capturan ese instante sin importar cuál
 * haya sido la primera ruta en cargar.
 *
 * SEGUNDO BUG que esto corrige (consumo único): lo anterior describe
 * fielmente "¿la pestaña se cargó de verdad con F5 estando en home?" —
 * pero esa es una pregunta sobre la carga del documento, que solo pasó
 * UNA vez; no debe seguir respondiendo "sí" cada vez que Home se vuelve a
 * montar más tarde por una navegación SPA (p. ej.: logo → Instrucciones
 * VR en home, ir a la guía, volver con "Instrucciones VR" — ese segundo
 * regreso a home NO es la recarga, es de nuevo una navegación normal, y
 * sin embargo con el bug se leía otra vez como recarga real, pisando la
 * bandera recién puesta por markIntroPlayed() e interponiendo la intro).
 * isHomeHardReload() "consume" la respuesta la primera vez que se llama
 * (que coincide exactamente con el PRIMER montaje de Home en la vida de
 * la pestaña, sea por carga real o por la primera navegación SPA que
 * llegue a home) y de ahí en adelante siempre contesta false — una
 * recarga real del navegador, por definición, solo puede ser la causa
 * directa de ese primer montaje; cualquier montaje posterior es, sí o sí,
 * una navegación SPA.
 */
const loadedPathname =
  typeof window === "undefined" ? null : window.location.pathname;

const wasHardReload = (() => {
  if (typeof window === "undefined") return false;
  try {
    const [entry] = performance.getEntriesByType("navigation");
    return (
      (entry as PerformanceNavigationTiming | undefined)?.type === "reload"
    );
  } catch {
    return false;
  }
})();

let homeHardReloadConsumed = false;

/** True solo la primera vez que se llama (es decir, en el primer montaje
 *  de Home en esta pestaña) Y solo si esa carga fue una recarga real del
 *  navegador (F5 / botón recargar) estando específicamente en home ("/").
 *  Cualquier llamada posterior (montajes de Home por navegación SPA)
 *  siempre devuelve false — ver el comentario grande de arriba. */
export function isHomeHardReload(): boolean {
  if (homeHardReloadConsumed) return false;
  homeHardReloadConsumed = true;
  return loadedPathname === "/" && wasHardReload;
}
