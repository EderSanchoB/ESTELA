import { useCallback, useRef, useState } from "react";
import FichaCard from "./FichaCard";
import FichaLightbox from "./FichaLightbox";
import FootprintHost from "./FootprintTrail";
import {
  CASOS_DE_ESTUDIO,
  DIMENSIONES_INMERSION,
  type CasoDeEstudio,
  type DimensionInmersion,
} from "@/data/casos-de-estudio";
import { useResponsiveScale } from "@/lib/useResponsiveScale";

// Ficha's real, unscaled footprint — must match FichaCard's own
// h-[750px] w-[500px] (500 wide, 750 tall).
const CARD_WIDTH = 500;
const CARD_HEIGHT = 750;

// Horizontal distance, in that same unscaled px space, between two
// neighboring cards' centers. Deliberately smaller than CARD_WIDTH so
// neighbors visibly overlap and peek out from behind the centered one,
// echoing the fanned stack in Eder's reference sketch.
const STEP = 300;
// Per step away from center: how much a card shrinks, fades, tilts away,
// and loses shadow — i.e. how "far back" each step reads as. All four are
// tuned together here rather than inline in the render loop below, so the
// depth effect can be adjusted in one place without touching the drag math.
const SCALE_PER_STEP = 0.16;
const MIN_SCALE = 0.5;
const OPACITY_PER_STEP = 0.22;
const MIN_OPACITY = 0.3;
const ROTATE_PER_STEP = 20; // degrees, coverflow-style fan
const MAX_ROTATE = 46;
const SHADOW_FALLOFF_PER_STEP = 0.28;
// How many screen px of horizontal drag correspond to moving exactly one
// card at 100% responsive scale — divided by the live scale below so the
// drag still feels 1:1 once the whole stack has shrunk to fit a narrow
// viewport.
const DRAG_PX_PER_STEP = 220;
// Por debajo de este desplazamiento total (px) del puntero, un
// pointerdown+pointerup sobre una ficha cuenta como "click" (agranda
// esa ficha — ver FichaLightbox) en vez de como un arrastre del
// carrusel. Eder: "se pueda dar click y que la imagen de la ficha se
// vea en grande... y que al clickar fuera de la imagen pueda seguir
// deslizando" — bastante holgado para no exigir un click perfectamente
// quieto (dedos/mouse siempre tiemblan un poco), pero lo bastante corto
// para que arrastrar el carrusel nunca dispare el agrandado sin querer.
const CLICK_MAX_MOVEMENT = 6;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * "Casos de Estudio": la revisión horizontal de las 16 fichas del corpus
 * del TFG, más las 4 burbujas de dimensiones de inmersión con su popover
 * explicativo al pasar el mouse. Vive como su propia sección de scroll,
 * después del home (ver page.tsx).
 *
 * El carrusel no usa ninguna librería de drag: cada ficha es un
 * FichaCard de tamaño fijo (500x750) al que esta sección le aplica un
 * `transform` (posición + escala + rotateY + sombra) calculado a partir
 * de qué tan lejos está del índice centrado. Arrastrar con el mouse
 * (pointerdown/move/up) simplemente mueve ese índice de forma continua;
 * al soltar, se redondea al caso más cercano. La escala de respuesta
 * (useResponsiveScale) es un segundo factor que se multiplica encima,
 * para que todo el conjunto quepa en pantallas angostas sin que cada
 * ficha tenga que recalcular sus propios tamaños de fuente.
 */
export default function CasosDeEstudio({ visible }: { visible: boolean }) {
  const count = CASOS_DE_ESTUDIO.length;
  // designHeight=1100: a partir de esta altura de VENTANA (no de
  // contenedor — ver useResponsiveScale) la ficha queda a tamaño
  // completo; por debajo, se encoge junto con el ancho. Eder: "las
  // secciones no se ven completas [en laptop], debido al tamaño de la
  // pantalla" — en su laptop de prueba (1917×911 de ventana real) el
  // ancho sobra de sobra (escala 1 por ancho), pero antes de esto la
  // ficha de 750px de alto se quedaba a tamaño completo igual,
  // obligando a scrollear de más dentro de una sola ficha para verla
  // completa. Con 1100 esa laptop queda en ~0.83 de escala (ficha
  // ≈660px en vez de 790px) y un monitor de escritorio típico (~1000px
  // de ventana) casi no se nota la diferencia (~0.91). Las huellas
  // (ver FootprintTrail.tsx) NO dependen de esta escala — están
  // ancladas a coordenadas fijas del contenedor exterior, no del stage
  // — así que esto no desalinea nada de lo ya calibrado.
  const { ref: stageRef, scale } = useResponsiveScale(CARD_WIDTH * 2.6, 1100);

  // Índice del caso centrado — fraccional mientras se arrastra, entero en
  // reposo.
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; index: number } | null>(null);
  // Cuánto se movió el puntero (abs, en px) durante el gesto actual —
  // reiniciado en cada pointerdown, actualizado en cada pointermove. Es
  // lo que decide, en endDrag, si fue un click de verdad o la cola de
  // un arrastre (ver CLICK_MAX_MOVEMENT arriba).
  const dragMoved = useRef(0);
  // Índice de la ficha que estaba bajo el puntero al momento del
  // pointerdown (null si el down no empezó sobre ninguna ficha, ej. en
  // el espacio vacío del stage). Eder: "no me sirve lo de clickar las
  // fichas" (no funcionaba) — la causa real: `onPointerDown` de abajo
  // llama `setPointerCapture` sobre el STAGE para que el arrastre
  // funcione fuera de los bordes de la ficha; una vez capturado el
  // puntero, el click sintético que sigue al pointerup también se
  // reenruta al stage, nunca llega al `onClick` de la ficha individual
  // (que es donde vivía antes esta lógica). Por eso ahora la decisión
  // de abrir el lightbox se toma DIRECTO en pointerdown/pointerup del
  // propio stage — los mismos dos manejadores que ya hacen funcionar
  // el arrastre — en vez de depender de un onClick nativo por ficha.
  const pointerDownIndex = useRef<number | null>(null);
  const [hoverDim, setHoverDim] = useState<DimensionInmersion | null>(null);
  const [lightboxCaso, setLightboxCaso] = useState<CasoDeEstudio | null>(null);

  const settle = useCallback(
    (value: number) => clamp(Math.round(value), 0, count - 1),
    [count],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, index };
    dragMoved.current = 0;
    // Se lee el índice ANTES de que la captura de arriba pueda
    // complicar a qué elemento "pertenece" el evento — target todavía
    // es, en este punto, el elemento real bajo el dedo/mouse.
    const cardEl = (event.target as HTMLElement).closest("[data-ficha-index]");
    pointerDownIndex.current = cardEl
      ? Number(cardEl.getAttribute("data-ficha-index"))
      : null;
    setIsDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (!start) return;
    dragMoved.current = Math.max(
      dragMoved.current,
      Math.abs(event.clientX - start.x),
    );
    const deltaSteps = (event.clientX - start.x) / (DRAG_PX_PER_STEP * scale);
    setIndex(clamp(start.index - deltaSteps, 0, count - 1));
  };

  const endDrag = () => {
    if (!dragStart.current) return;
    dragStart.current = null;
    setIsDragging(false);
    setIndex((current) => settle(current));

    // Click real (no cola de arrastre, ver CLICK_MAX_MOVEMENT) sobre
    // cualquier ficha del carrusel, esté centrada o no: la agranda en
    // FichaLightbox en vez de solo centrarla como hacía antes — ese
    // comportamiento de "centrar al hacer click" queda reemplazado por
    // este, más útil ahora que agrandar está a un click de distancia.
    if (
      dragMoved.current <= CLICK_MAX_MOVEMENT &&
      pointerDownIndex.current !== null
    ) {
      setLightboxCaso(CASOS_DE_ESTUDIO[pointerDownIndex.current]);
    }
    pointerDownIndex.current = null;
  };

  const goTo = (next: number) => setIndex(clamp(next, 0, count - 1));

  const centeredCaso = CASOS_DE_ESTUDIO[settle(index)];

  // Contenido de la nota sobre las 4 dimensiones — se renderiza dos veces
  // más abajo (relleno invisible + párrafo real), así que vive en una
  // sola variable en vez de duplicar el texto.
  const introNote = (
    <>
      Un artículo llamado <em>Immersive Experience and Virtual Reality</em>,
      publicado en <em>Philosophy &amp; Technology</em> (2024) por Magdalena y
      Brendan Balcerak Jackson, propone que la inmersión en VR tiene cuatro
      dimensiones (representacional, participativa, afectiva y narrativa), que
      no son exclusivas de VR sino que existen también en otros medios como el
      cine o la literatura. Lo que distingue a VR es que puede combinarlas todas
      con gran intensidad. Aplicado al debate sobre empatía, los autores
      concluyen que VR tiene potencial real pero no es una &quot;máquina
      mágica&quot; — su efectividad depende del mismo trabajo artístico y
      narrativo que cualquier película o novela.
    </>
  );

  return (
    <section
      id="casos-de-estudio"
      // Antes esta sección no tenía ningún gating: se renderizaba a opacidad
      // completa desde el primer paint, a diferencia de Nav/HeroBody — por
      // eso durante la intro (mientras el video del hero carga su chunk en
      // dev, o incluso en prod por un instante) se alcanzaba a ver todo el
      // carrusel de fichas de golpe debajo del hero. Mismo tratamiento de
      // fade que HeroBody (translate + opacity + blur) para que se mantenga
      // oculta hasta que `phase` pasa a "revealed".
      className={`border-t border-line bg-white py-20 transition-all duration-700 ease-out ${
        visible
          ? "translate-y-0 opacity-100 blur-none"
          : "pointer-events-none translate-y-3 opacity-0 blur-xl"
      }`}
      aria-hidden={!visible}
    >
      <div className="relative mx-auto w-full max-w-[1600px] px-6 sm:px-10">
        <FootprintHost host="casos" />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-neutral-900">
              Casos de Estudio
            </h2>
            <p className="mt-1 font-sans text-sm text-muted">
              Dimensiones de inmersión (Balcerak Jackson, 2024)
            </p>

            {/* Burbujas de dimensiones: hover/focus revela el recuadro con la
                definición, tal como en la tabla de referencia que Eder adjuntó. */}
            <div className="mt-5 flex flex-wrap gap-3">
              {DIMENSIONES_INMERSION.map((dim) => (
                <div key={dim.id} className="relative">
                  <button
                    type="button"
                    className="rounded-full border border-neutral-300 px-4 py-1.5 font-sans text-sm text-neutral-700 transition-colors hover:border-neutral-400"
                    onMouseEnter={() => setHoverDim(dim.id)}
                    onMouseLeave={() =>
                      setHoverDim((current) =>
                        current === dim.id ? null : current,
                      )
                    }
                    onFocus={() => setHoverDim(dim.id)}
                    onBlur={() =>
                      setHoverDim((current) =>
                        current === dim.id ? null : current,
                      )
                    }
                  >
                    {dim.etiqueta}
                  </button>

                  <div
                    role="tooltip"
                    // z-[200]: por encima de cualquier ficha del carrusel de
                    // abajo (la del centro llega a z-index 100) — si no, la
                    // ficha se pinta encima del recuadro y lo tapa a medias.
                    className={`absolute left-0 top-full z-[200] mt-2 w-64 rounded-2xl border border-line bg-white p-4 shadow-lg transition-all duration-150 ease-out ${
                      hoverDim === dim.id
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-1 opacity-0"
                    }`}
                  >
                    <div className="font-display text-sm font-semibold text-neutral-900">
                      {dim.etiqueta}
                    </div>
                    <p className="mt-2 font-sans text-xs leading-relaxed text-neutral-600">
                      {dim.definicion}
                    </p>
                    <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-neutral-400">
                      {dim.queImplica}
                    </p>
                    <p className="mt-2 font-sans text-xs italic leading-relaxed text-neutral-500">
                      {dim.ideaClave}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nota sobre la fuente de las 4 dimensiones: a la derecha del
              título, en la misma fila. Eder marcó una franja roja ancha y
              baja, a la altura del bloque de título+burbujas, no un
              bloque angosto que se extendiera hacia abajo — por eso en
              vez de limitar el ancho (`max-w-*`, los dos intentos
              anteriores) se deja que el párrafo ocupe el espacio que
              sobra en la fila (`lg:min-w-0 lg:flex-1`): con más ancho
              disponible el texto se acomoda en pocas líneas largas en vez
              de muchas líneas cortas, quedando como una franja baja en
              vez de una columna alta. Texto plano, sin tarjeta ni fondo.
              Por debajo de `lg` sigue como ítem normal del flex-col
              (mobile no cambia). */}
          <p className="font-sans text-sm leading-relaxed text-neutral-600 lg:min-w-0 lg:flex-1">
            {introNote}
          </p>
        </div>

        {/* mt-20 en vez de mt-10: le da a los popovers de las burbujas de
            arriba aire de sobra antes de que empiecen a asomar las fichas
            (que ya de por sí llevan z-index alto — ver el z-[200] del
            popover más arriba, que es la corrección real; este espacio
            extra es solo para que no se sientan pegados). */}
        <p className="mt-20 text-center font-mono text-xs uppercase tracking-[0.2em] text-neutral-400">
          Archivo Histórico
        </p>

        <div className="relative mt-4">
          <div
            ref={stageRef}
            // overflow-x-hidden (no overflow-hidden a secas): las fichas
            // lejanas del carrusel sí deben recortarse a los lados, pero
            // el eje vertical se deja libre — si no, esta misma caja
            // recorta el difuminado del box-shadow de cada ficha justo en
            // su borde inferior, y la sombra se ve "cortada" en vez de
            // desvanecerse.
            className="relative touch-pan-y select-none overflow-x-hidden overflow-y-visible"
            style={{ height: CARD_HEIGHT * scale + 40 }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {CASOS_DE_ESTUDIO.map((caso, i) => {
              const offset = i - index;
              const abs = Math.abs(offset);
              const cardScale =
                clamp(1 - abs * SCALE_PER_STEP, MIN_SCALE, 1) * scale;
              const opacity = clamp(1 - abs * OPACITY_PER_STEP, MIN_OPACITY, 1);
              const rotate = clamp(
                -offset * ROTATE_PER_STEP,
                -MAX_ROTATE,
                MAX_ROTATE,
              );
              const translateX = offset * STEP * scale;
              const shadowStrength = clamp(
                1 - abs * SHADOW_FALLOFF_PER_STEP,
                0.15,
                1,
              );

              return (
                <div
                  key={caso.codigo}
                  // Leído en onPointerDown (ver arriba) para saber qué
                  // ficha está bajo el puntero cuando empieza un
                  // gesto — necesario porque un onClick nativo acá no
                  // es confiable una vez que el stage captura el
                  // puntero (ver el comentario grande junto a
                  // pointerDownIndex).
                  data-ficha-index={i}
                  className={`absolute left-1/2 top-1/2 ${
                    isDragging
                      ? ""
                      : "transition-transform duration-300 ease-out"
                  }`}
                  style={{
                    transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${cardScale}) perspective(1400px) rotateY(${rotate}deg)`,
                    opacity,
                    zIndex: 100 - Math.round(abs * 10),
                    // La ficha (FichaCard) tiene esquinas redondeadas
                    // (rounded-[28px]); si este wrapper no comparte ese
                    // mismo radio, el box-shadow se calcula sobre un
                    // rectángulo de esquinas rectas y no acompaña la curva
                    // visible de la ficha — se nota como un corte/hueco
                    // justo en cada esquina redondeada. Repetir el mismo
                    // 28px aquí hace que la sombra siga exactamente el
                    // contorno redondeado de la ficha.
                    borderRadius: "28px",
                    boxShadow: `0 ${30 * shadowStrength}px ${60 * shadowStrength}px -12px rgba(0,0,0,${(0.45 * shadowStrength).toFixed(3)})`,
                  }}
                >
                  <FichaCard caso={caso} />
                </div>
              );
            })}
          </div>

          <button
            type="button"
            aria-label="Caso anterior"
            onClick={() => goTo(Math.round(index) - 1)}
            disabled={index <= 0}
            className="absolute left-2 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 transition-opacity hover:border-neutral-400 disabled:opacity-0 sm:left-6"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 5 8 12 15 19" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Caso siguiente"
            onClick={() => goTo(Math.round(index) + 1)}
            disabled={index >= count - 1}
            className="absolute right-2 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 transition-opacity hover:border-neutral-400 disabled:opacity-0 sm:right-6"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 5 16 12 9 19" />
            </svg>
          </button>
        </div>

        {/* mt-14 en vez de mt-4: ahora que el stage de arriba deja el
            eje vertical sin recortar (overflow-y-visible), la sombra de
            la ficha centrada se desvanece varios px por debajo de su
            propia caja — este aire extra evita que ese desvanecido se
            sienta pegado al contador. */}
        <p className="mt-14 text-center font-mono text-xs text-neutral-400">
          {String(settle(index) + 1).padStart(2, "0")} /{" "}
          {String(count).padStart(2, "0")}
          {" — "}
          {centeredCaso.codigo}
        </p>
      </div>

      {lightboxCaso && (
        <FichaLightbox
          caso={lightboxCaso}
          onClose={() => setLightboxCaso(null)}
        />
      )}
    </section>
  );
}
