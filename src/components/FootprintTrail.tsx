import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode, RefObject } from "react";
import {
  FOOTPRINT_TRAIL,
  FOOTPRINT_MAX_DISTANCE,
  FOOTPRINT_EXIT_DISTANCE,
  type FootprintHost,
  type FootprintStep,
} from "@/data/footprint-trail";

/**
 * Eder: "estás poniendo todas al mismo tiempo y van una a una, nunca hay
 * dos al mismo tiempo (Aparece la huella-01, desaparece y aparece la
 * huella-02 y así hasta que desaparece la última)". La primera versión
 * dejaba que cada huella decidiera por su cuenta si estaba "en foco" con
 * su propio IntersectionObserver — si dos franjas de activación se
 * solapaban (lo que pasaba seguido, ya que están relativamente cerca
 * unas de otras), se veían dos a la vez.
 *
 * Este hook mide, en cada scroll, qué huella tiene su centro más cerca
 * del centro de la ventana y devuelve solo su índice — por construcción
 * nunca puede haber dos "más cercanas" al mismo tiempo, sin importar qué
 * tan separadas (o no) estén sus posiciones entre sí, Y sin importar en
 * qué sección del DOM viva cada una (getBoundingClientRect() es
 * relativo al viewport, no al contenedor local de cada huella) — por eso
 * puede operar sobre refs reunidas de VARIAS secciones distintas (ver
 * FootprintTrailProvider más abajo) y seguir garantizando una sola
 * activa a la vez en todo el recorrido de la página, no solo dentro de
 * una sección.
 */
type ScrollDirection = "up" | "down";

// Por debajo de este desplazamiento (px) entre una medición y la
// siguiente, no se actualiza la dirección — así un `resize` (que
// también dispara `measure()`, ver abajo) sin scroll real de por medio
// no hace parpadear la dirección, y pequeños temblores de sub-píxel
// tampoco.
const DIRECTION_EPSILON = 1;

function useActiveFootprint(refs: Array<RefObject<HTMLDivElement | null>>) {
  const [active, setActive] = useState(-1);
  // Eder: "cuando se scrollea hacia arriba se vean giradas 180 grados...
  // para que ahora parezca que se va caminando hacia arriba. Cuando
  // scrolleo hacia abajo, se quedan como están ahora". Por defecto
  // "down" — coincide con la narrativa de "caminar hacia abajo" con la
  // que se armó el recorrido antes de que el usuario haga scroll.
  const [direction, setDirection] = useState<ScrollDirection>("down");

  useEffect(() => {
    let frame = 0;
    let lastScrollY = window.scrollY;

    const measure = () => {
      frame = 0;
      const viewportCenter = window.innerHeight / 2;

      const scrollY = window.scrollY;
      const delta = scrollY - lastScrollY;
      if (Math.abs(delta) > DIRECTION_EPSILON) {
        setDirection(delta > 0 ? "down" : "up");
      }
      lastScrollY = scrollY;

      let bestIndex = -1;
      let bestDistance = Infinity;
      let bestCenter = 0;

      refs.forEach((ref, i) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(center - viewportCenter);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = i;
          bestCenter = center;
        }
      });

      if (bestDistance > FOOTPRINT_MAX_DISTANCE) {
        setActive(-1);
        return;
      }

      // Margen de salida corto, aplicado a CUALQUIER huella (no solo a
      // la última del recorrido) una vez que el centro de la ventana ya
      // la dejó atrás — ver FOOTPRINT_EXIT_DISTANCE en footprint-trail.ts.
      if (viewportCenter - bestCenter > FOOTPRINT_EXIT_DISTANCE) {
        setActive(-1);
        return;
      }

      setActive(bestIndex);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
    // refs son objetos estables (ver FootprintTrailProvider) aunque el
    // array que los contiene se recree cada render — solo se arma una
    // vez, como en HeroVideo.tsx.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { active, direction };
}

type FootprintContextValue = {
  refs: Array<RefObject<HTMLDivElement | null>>;
  active: number;
  direction: ScrollDirection;
};

const FootprintContext = createContext<FootprintContextValue | null>(null);

/**
 * Monta UNA sola vez, envolviendo todas las secciones que puedan tener
 * huellas (ver page.tsx) — es lo que hace posible que la arbitración de
 * "solo una activa a la vez" sea global a la página entera y no quede
 * encerrada por sección. Cada <FootprintHost host="..."/> (uno por
 * sección, montado DENTRO del contenedor `relative` propio de esa
 * sección) lee de este contexto en vez de manejar su propio estado.
 */
export function FootprintTrailProvider({ children }: { children: ReactNode }) {
  // `refs` tiene que ser el mismo array (mismos objetos ref) en todos los
  // renders — useActiveFootprint depende de eso (ver su nota de
  // exhaustive-deps arriba). useState con inicializador perezoso (nunca
  // se llama al setter) lo logra sin pasar por useRef: el lint de React
  // marca como error leer `.current` de un useRef durante el render
  // (aunque acá sea seguro, porque el array en sí nunca cambia de
  // identidad), así que esto lo rodea de raíz. Un objeto "ref-like"
  // ({ current: null }) no necesita venir de useRef(); basta con que
  // tenga esa forma para servir como `ref` de un elemento.
  const [refs] = useState<Array<RefObject<HTMLDivElement | null>>>(() =>
    FOOTPRINT_TRAIL.map(() => ({ current: null })),
  );
  const { active, direction } = useActiveFootprint(refs);

  return (
    <FootprintContext.Provider value={{ refs, active, direction }}>
      {children}
    </FootprintContext.Provider>
  );
}

function Huella({
  step,
  isActive,
  direction,
  innerRef,
}: {
  step: FootprintStep;
  isActive: boolean;
  direction: ScrollDirection;
  innerRef: RefObject<HTMLDivElement | null>;
}) {
  const { top, left, width, rotate, mirror } = step;
  // Eder: "cuando se scrollea hacia arriba se vean giradas 180 grados
  // ... para que ahora parezca que se va caminando hacia arriba" — se
  // suma (no se reemplaza) sobre el `rotate` propio de cada huella, así
  // que da igual el signo/orden mirror-rotate ya resuelto por huella
  // (ver notas de huella-01 en footprint-trail.ts): +180 siempre deja la
  // silueta "boca abajo" respecto a como se veía, sin importar el
  // ángulo de partida. La transición ya existente (`transition-all`,
  // ver className abajo) anima este giro igual que ya anima
  // opacity/blur, así que el cambio de dirección se ve como un giro
  // suave, no un salto.
  const flip = direction === "up" ? 180 : 0;

  return (
    <div
      ref={innerRef}
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{ top, left, width }}
    >
      <img
        src="/decor/huella.png"
        alt=""
        width={152}
        height={324}
        loading="lazy"
        draggable={false}
        className={`w-full select-none transition-all duration-700 ease-out ${
          isActive ? "opacity-100 blur-none" : "opacity-0 blur-md"
        }`}
        style={{
          transform: `${mirror ? "scaleX(-1) " : ""}rotate(${rotate + flip}deg)`,
        }}
      />
    </div>
  );
}

/**
 * Overlay de huellas para UNA sección (`host`) — ver FOOTPRINT_TRAIL en
 * footprint-trail.ts para ajustar cuántas hay y dónde cae cada una. El
 * padre que la monta debe ser `relative` (ver CasosDeEstudio.tsx y
 * ConfiguraGafas.tsx); esta cubre todo ese contenedor (`absolute
 * inset-0`) y cada huella de ESA sección se posiciona dentro con su
 * propio top/left — las de otras secciones no se renderizan acá (cada
 * una vive en su propio FootprintHost). Solo desktop (`lg:`): el TRAIL
 * se midió sobre el layout de escritorio de ambas secciones; por debajo
 * de `lg` esas coordenadas ya no corresponden a nada.
 *
 * Requiere estar dentro de un <FootprintTrailProvider> (ver arriba,
 * montado en page.tsx) — sin eso no se renderiza nada.
 */
export default function FootprintHost({ host }: { host: FootprintHost }) {
  const ctx = useContext(FootprintContext);
  if (!ctx) return null;
  const { refs, active, direction } = ctx;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 hidden lg:block">
      {FOOTPRINT_TRAIL.map((step, i) =>
        step.host === host ? (
          <Huella
            key={i}
            step={step}
            isActive={active === i}
            direction={direction}
            innerRef={refs[i]}
          />
        ) : null,
      )}
    </div>
  );
}
