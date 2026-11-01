/**
 * Eder: "funciona todo excepto el boton de instrucciones VR en el
 * topbar y el footer" y despues "revisa porque no siempre funciona el
 * del Topbar". Causa raiz, la misma para los dos reportes:
 *
 * Todos los links de ancla de este sitio (Workflows, Plantillas,
 * Instrucciones VR, FAQ — en Nav.tsx, InteriorNav.tsx y SiteFooter.tsx)
 * navegan con el <Link> de React Router, que SIEMPRE intercepta el click
 * y usa pushState — nunca deja que el navegador haga su scroll nativo a
 * la ancla (eso solo pasa con un <a href="#ancla"> de verdad). El primer
 * intento de arreglo fue un efecto en Home.tsx que reacciona cuando
 * cambia location.hash — pero eso solo se dispara cuando el hash
 * efectivamente CAMBIA de valor. Si ya se estaba en "#instrucciones-vr"
 * (por ejemplo, porque se llego ahi antes con el topbar) y se volvia a
 * hacer click en el MISMO link (desde el footer, o de nuevo desde el
 * topbar), el hash de la URL no cambiaba — seguia siendo el mismo texto
 * — asi que ese efecto nunca se volvia a disparar y el click no hacia
 * nada. Eso explica tanto el "a veces si, a veces no" del topbar como el
 * "nunca" del footer.
 *
 * La solucion correcta: no depender de que la URL cambie. Esta funcion
 * se llama directo en el onClick de cada link de ancla, ANTES/ADEMAS de
 * que React Router navegue — si el elemento ya existe en la pagina
 * actual (ya se esta en home), lo desplaza ahi mismo SIEMPRE, sin
 * importar si la URL ya tenia ese mismo hash. Si el elemento NO existe
 * todavia (se esta en una pagina de tutorial, por ejemplo), no hace
 * nada aca: el <Link> sigue navegando normalmente hacia home con ese
 * hash en la URL, y el efecto de montaje de Home.tsx (el que ya existia
 * desde antes) se encarga de aterrizar en el lugar correcto una vez que
 * Home termina de montar.
 */
export function scrollToSectionIfPresent(href: string) {
  if (typeof document === "undefined") return;
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return;
  const hash = href.slice(hashIndex);
  if (!hash || hash === "#") return;
  document.querySelector(hash)?.scrollIntoView({ behavior: "auto", block: "start" });
}
