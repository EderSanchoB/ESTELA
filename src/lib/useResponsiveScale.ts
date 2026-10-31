import { useEffect, useRef, useState } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Measures a wrapper element's own width (y, opcionalmente, el alto de
 * la ventana) y los convierte en un factor de escala 0..1, para que
 * contenido de tamaño fijo (que si no, se saldría en pantallas angostas
 * O bajas) pueda encogerse en conjunto vía un solo `transform: scale()`
 * en vez de que cada pieza recalcule sus propios tamaños de fuente.
 * `designWidth` es el ancho al que quien llama quiere que la escala
 * llegue a 1 ("tamaño completo").
 *
 * `designHeight` es opcional y hace lo mismo pero contra el ALTO de la
 * ventana (`window.innerHeight`) en vez del ancho del contenedor; la
 * escala final es la MÁS CHICA entre la de ancho y la de alto, así el
 * contenido nunca queda más grande de lo que cabe en cualquiera de las
 * dos dimensiones. Sin pasar `designHeight` el comportamiento es
 * exactamente el de antes (compatibilidad hacia atrás).
 *
 * Eder: "necesito que ajustes una versión de la web para cuando se
 * lanza desde una laptop, ya que las secciones no se ven completas,
 * debido al tamaño de la pantalla" — en una laptop típica el ANCHO
 * suele sobrar (fácil llegar a escala 1 por ancho), pero el ALTO es
 * bastante más bajo que el monitor de escritorio donde se armó el
 * sitio; sin tomar en cuenta el alto, el carrusel de Casos de Estudio
 * se quedaba a tamaño completo aunque la ventana fuera mucho más baja
 * que la ficha de 750px, obligando a scrollear de más para ver una
 * sola ficha completa (ver CasosDeEstudio.tsx para el valor real de
 * `designHeight` que usa).
 *
 * Floor de 0.42 en ambos casos: mantiene las cosas legibles en vez de
 * encogerse hasta la nada en pantallas muy angostas/bajas — por debajo
 * de eso, mejor que el contenido empiece a recortarse en los bordes que
 * verse ilegible.
 */
export function useResponsiveScale(designWidth: number, designHeight?: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const width = el.clientWidth;
      if (width <= 0) return;
      const widthScale = clamp(width / designWidth, 0.42, 1);
      const heightScale = designHeight
        ? clamp(window.innerHeight / designHeight, 0.42, 1)
        : 1;
      setScale(Math.min(widthScale, heightScale));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    // El ResizeObserver de arriba solo detecta cambios en el ANCHO del
    // contenedor (es lo único que mide `update`'s `el.clientWidth`) —
    // si se pasó designHeight, también hay que reaccionar a que cambie
    // el alto de la VENTANA (ej. redimensionar sin que el contenedor
    // cambie de ancho), cosa que el ResizeObserver no ve.
    if (designHeight) window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      if (designHeight) window.removeEventListener("resize", update);
    };
  }, [designWidth, designHeight]);

  return { ref, scale };
}

/**
 * Variante de solo-alto: no mide ningún contenedor (no hay ancho que
 * considerar), solo el alto de la VENTANA — para elementos de alto fijo
 * en px que no tienen un "ancho de diseño" relevante (ej. el visor 3D
 * de ConfiguraGafas.tsx, con sus clases `h-80`/`sm:h-96` fijas). Mismo
 * criterio que el `designHeight` de arriba: en o por encima de
 * `designHeight` la escala es 1 (sin cambios — así una pantalla de
 * escritorio normal, donde ya "se ve perfecto", queda intacta), y por
 * debajo baja proporcional hasta `floor`.
 */
export function useViewportHeightScale(designHeight: number, floor = 0.42) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      setScale(clamp(window.innerHeight / designHeight, floor, 1));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [designHeight, floor]);

  return scale;
}
