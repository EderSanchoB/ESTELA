import { useNavigate } from "react-router-dom";
import { markIntroPlayed } from "@/lib/introFlag";

/**
 * Botón "Volver" de las páginas de guía detallada (ver
 * src/app/tutoriales/meta-quest/page.tsx). Antes usaba router.back()
 * (volver al historial real) porque ambos caminos — el botón ← del
 * navegador y este botón — llevaban al mismo sitio de todas formas.
 *
 * Eder: "cuando esté en las Guía detallada y presione 'volver', me lleve
 * directamente a esta sección [Instrucciones VR]" — pide un destino
 * explícito y garantizado, no "lo que sea que haya en el historial"
 * (que además falla si se entra a la guía por un link directo, sin
 * historial de haber pasado por home). router.push a la ruta con el
 * ancla cumple eso siempre, sin depender del historial de navegación —
 * el botón ← del navegador le sigue el paso por su cuenta (sigue siendo
 * historial real), este botón ahora es un atajo explícito al mismo
 * destino.
 *
 * markIntroPlayed() antes de navegar: "directamente" implica sin que se
 * interponga la animación de intro del home camino a la sección — ver
 * src/lib/introFlag.ts (mismo mecanismo que usa InteriorNav.tsx para su
 * link "Instrucciones VR").
 */
export default function VolverButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => {
        markIntroPlayed();
        navigate("/#instrucciones-vr");
      }}
      className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-white/55 transition-colors hover:text-white"
    >
      ← Volver
    </button>
  );
}
