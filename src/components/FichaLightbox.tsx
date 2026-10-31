import { useEffect } from "react";
import { createPortal } from "react-dom";
import FichaCard from "./FichaCard";
import { useResponsiveScale } from "@/lib/useResponsiveScale";
import type { CasoDeEstudio } from "@/data/casos-de-estudio";

/**
 * Eder: "me gustaría que en la sección de casos de estudio, se pueda
 * dar click y que la imagen de la ficha se vea en grande, para poder
 * leer y que al clickar fuera de la imagen pueda seguir deslizando" —
 * al hacer click (no arrastrar — ver CasosDeEstudio.tsx, que distingue
 * una cosa de la otra por cuánto se movió el puntero) en cualquier
 * ficha del carrusel, esa ficha se abre acá agrandada sobre un fondo
 * oscuro; clickear fuera de ella (el fondo) la cierra. El carrusel de
 * atrás nunca se toca — esto solo se dibuja ENCIMA (portal a
 * document.body, mismo motivo que VRGuideDropdown.tsx: cualquier
 * ancestro con transform rompería un position:fixed anidado) — así que
 * al cerrar se puede seguir deslizando exactamente donde se había
 * quedado.
 *
 * FichaCard siempre se dibuja a su tamaño natural (500×750px reales,
 * ver su propio comentario) — acá se reusa el mismo truco de "medir el
 * ancho del contenedor y escalar la ficha encima con transform" que ya
 * usa el carrusel (useResponsiveScale), así el texto que a tamaño de
 * carrusel queda diminuto (8-10px reales) se lee a su tamaño nativo o
 * más grande. El contenedor mide `min(90vw, 60vh)` de ancho — nunca más
 * ancho que el 90% del viewport ni, gracias al aspect-ratio 2:3 de la
 * ficha (500:750), más alto que el 90% de su alto — y
 * useResponsiveScale no deja que la escala pase de 1, así en pantallas
 * grandes la ficha no se agranda más allá de su resolución nativa (se
 * vería borrosa si se estirara de más).
 */
export default function FichaLightbox({
  caso,
  onClose,
}: {
  caso: CasoDeEstudio;
  onClose: () => void;
}) {
  const { ref, scale } = useResponsiveScale(500);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={ref}
        className="relative"
        style={{ width: "min(90vw, 60vh)", aspectRatio: "500 / 750" }}
        // Sin este stopPropagation, cualquier click DENTRO de la ficha
        // (que es lo que se quiere poder leer) burbujearía hasta el
        // fondo de arriba y la cerraría de inmediato.
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ transform: `scale(${scale})` }}
        >
          <FichaCard caso={caso} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
