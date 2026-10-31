import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { VR_HEADSETS } from "@/data/vr-headsets";

const CLOSE_DELAY_MS = 150;
const REVEAL_DURATION_MS = 450;
const CONTENT_LEFT_FALLBACK_PX = 24;

type Theme = "light" | "dark";

/**
 * Eder, mirando la topbar de apple.com: "Quiero que la topbar se despliegue
 * tal como lo hace la página de Apple [...] al posicionar el mouse sobre
 * 'Instrucciones VR' [...] se desplieguen las opciones de Gafas [...]
 * entonces que al elegir una de esas opciones, me lleve específicamente a
 * esa opción [...] lo que está abajo del despliegue del topbar, se pone
 * borroso."
 *
 * Reemplaza, solo para el enlace "Instrucciones VR" del nav de escritorio
 * (Nav.tsx y InteriorNav.tsx), el <Link> plano por este trigger + panel
 * flotante con las 4 gafas de VR_HEADSETS, cada una apuntando directo a su
 * guía (guiaHref). El enlace en sí sigue funcionando igual que antes
 * (navega a `href` al hacer click, sin pasar por el panel) — el panel es
 * un atajo adicional, no un reemplazo de esa navegación.
 *
 * Por qué portal a document.body: el <nav> de escritorio de Nav.tsx (el
 * del home) siempre tiene una clase de transform de Tailwind activa (ver
 * `navTransition` ahí — translate-y-0/-translate-y-1 nunca es "ninguno"),
 * y por spec CSS cualquier transform en un ancestro crea un nuevo
 * "containing block" para los descendientes `position: fixed` — es decir,
 * un panel fixed anidado DENTRO de ese <nav> quedaría posicionado relativo
 * a ese <nav>, no al viewport. Portaling a document.body rodea el
 * problema por completo (InteriorNav.tsx no tiene ese problema, pero
 * tampoco le afecta recibir el mismo tratamiento).
 *
 * Eder, segunda vuelta: "no quiero que [las gafas] estén encerradas en
 * burbujas" — se quitaron los bordes/tarjetas por ítem; es una lista
 * plana de enlaces en negrita, sin fondo ni borde por ítem.
 * "quiero que este menú... se despliegue de arriba hacia abajo... y que
 * mientras se va haciendo hacia abajo, se vaya poniendo borroso
 * progresivamente el resto" — el panel no aparece de golpe: `openMenu`
 * primero lo monta en su estado "cerrado" (clip-path sin alto visible) y,
 * un frame después, pasa a su estado "abierto" (clip-path sin recorte) —
 * el navegador anima eso como una cortina bajando desde arriba. El fondo
 * desenfocado usa la misma duración y arranca transparente / sin blur,
 * así el desenfoque "crece" en sincronía con el panel.
 *
 * Eder, tercera vuelta, con una captura marcando un recuadro rojo justo
 * debajo de "Instrucciones VR": "los textos deben quedar debajo de cada
 * opción". Esa vez interpreté el recuadro como el contorno exacto que
 * pedía (panel angosto, con borde, sombra y esquinas redondeadas,
 * anclado bajo el trigger) — pero Eder aclaró después, con una captura
 * de apple.com/store: "el recuadro... era solamente para indicarte dónde
 * iban [las palabras], quiero que se vea como el ejemplo de Apple". O
 * sea: el PANEL sigue siendo la franja de ancho completo al estilo Apple
 * (sin burbuja, sin sombra, sin esquinas redondeadas — ver más abajo),
 * pero el CONTENIDO de texto dentro de esa franja arranca alineado bajo
 * el trigger en vez de pegado al borde izquierdo del viewport. Por eso
 * `measurePosition` sigue midiendo con getBoundingClientRect() (para
 * saber dónde empieza "Instrucciones VR"), pero ahora solo guarda esa
 * coordenada horizontal (`contentLeft`, usada como padding-left del
 * contenido) — el panel en sí vuelve a anclarse con `top-20 inset-x-0`
 * fijo, sin necesitar la coordenada vertical medida.
 *
 * Mismo pedido: "quiero que el desplegable solo se vea cuando me
 * posicione en cada opción... Cuando yo me posiciono en otra parte, el
 * desplegable se cierra hacia arriba. También se cierra si posiciono el
 * mouse fuera del desplegable." El panel (la franja completa) es "el
 * desplegable" — pasarle el mouse por encima lo mantiene abierto en
 * cualquier punto de esa franja (igual que en apple.com, donde el menú
 * entero reacciona, no solo el texto); el fondo borroso de más abajo NO
 * cuenta como parte del desplegable, así que entrarle arma el cierre.
 */
export default function VRGuideDropdown({
  label,
  href,
  className,
  theme,
  onNavigate,
}: {
  label: string;
  href: string;
  className: string;
  theme: Theme;
  onNavigate?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [contentLeft, setContentLeft] = useState<number | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Todas envueltas en useCallback con deps vacías/estables (solo tocan
  // refs y setters de estado) para poder listarlas como dependencias de
  // los efectos de abajo sin que eslint se queje de una dependencia que
  // "cambia" en cada render.
  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const measurePosition = useCallback(() => {
    const node = triggerRef.current;
    if (!node) return;
    setContentLeft(node.getBoundingClientRect().left);
  }, []);

  const openMenu = useCallback(() => {
    cancelClose();
    if (unmountTimer.current) {
      clearTimeout(unmountTimer.current);
      unmountTimer.current = null;
    }
    measurePosition();
    setMounted(true);
    requestAnimationFrame(() => setAnimateIn(true));
  }, [cancelClose, measurePosition]);

  const closeMenu = useCallback(() => {
    cancelClose();
    setAnimateIn(false);
    unmountTimer.current = setTimeout(
      () => setMounted(false),
      REVEAL_DURATION_MS,
    );
  }, [cancelClose]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(closeMenu, CLOSE_DELAY_MS);
  }, [cancelClose, closeMenu]);

  // Mientras el panel está montado: remedir el offset horizontal si la
  // ventana cambia de tamaño, y cerrarlo si la página hace scroll —
  // ningún header de este sitio es sticky, así que "top-20" solo tiene
  // sentido mientras la topbar sigue arriba del todo.
  useEffect(() => {
    if (!mounted) return;
    const handleScroll = () => closeMenu();
    window.addEventListener("resize", measurePosition);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", measurePosition);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [mounted, measurePosition, closeMenu]);

  // Si el componente entero se desmonta (navegación a otra página) con
  // timers todavía pendientes, no deben quedar huérfanos intentando
  // hacer setState.
  useEffect(
    () => () => {
      cancelClose();
      if (unmountTimer.current) clearTimeout(unmountTimer.current);
    },
    [cancelClose],
  );

  // Esc para cerrar, como cualquier menú flotante nativo. El setState
  // ocurre dentro de `handleKey` (una reacción a un evento externo), no
  // de forma síncrona en el cuerpo del efecto.
  useEffect(() => {
    if (!animateIn) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [animateIn, closeMenu]);

  const isDark = theme === "dark";

  const closeAndNavigate = () => {
    closeMenu();
    onNavigate?.();
  };

  return (
    <div ref={triggerRef} onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
      <Link to={href} onClick={closeAndNavigate} className={className}>
        {label}
      </Link>

      {mounted &&
        createPortal(
          <>
            <div
              aria-hidden="true"
              onMouseEnter={scheduleClose}
              onClick={closeMenu}
              className="fixed inset-x-0 top-20 bottom-0 z-40"
              style={{
                transition: `background-color ${REVEAL_DURATION_MS}ms ease-out, backdrop-filter ${REVEAL_DURATION_MS}ms ease-out`,
                backgroundColor: animateIn
                  ? isDark
                    ? "rgba(0,0,0,0.5)"
                    : "rgba(255,255,255,0.45)"
                  : isDark
                    ? "rgba(0,0,0,0)"
                    : "rgba(255,255,255,0)",
                backdropFilter: animateIn ? "blur(14px)" : "blur(0px)",
                WebkitBackdropFilter: animateIn ? "blur(14px)" : "blur(0px)",
                pointerEvents: animateIn ? "auto" : "none",
              }}
            />
            <div
              role="menu"
              aria-label={label}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              className={`fixed inset-x-0 top-20 z-50 border-b ${
                isDark
                  ? "border-white/10 bg-[#111111]"
                  : "border-neutral-200 bg-white"
              }`}
              style={{
                clipPath: animateIn ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
                transition: `clip-path ${REVEAL_DURATION_MS}ms ease-out`,
              }}
            >
              <div
                className="py-10"
                style={{
                  paddingLeft: contentLeft ?? CONTENT_LEFT_FALLBACK_PX,
                  paddingRight: CONTENT_LEFT_FALLBACK_PX,
                }}
              >
                <p
                  className={`font-mono text-[11px] uppercase tracking-[0.14em] ${
                    isDark ? "text-white/40" : "text-neutral-400"
                  }`}
                >
                  Configura tus gafas
                </p>
                <ul className="mt-4 flex flex-col gap-3">
                  {VR_HEADSETS.map((headset) => (
                    <li key={headset.id}>
                      <Link
                        to={headset.guiaHref ?? href}
                        onClick={closeAndNavigate}
                        role="menuitem"
                        className={`font-display text-xl font-semibold transition-colors ${
                          isDark
                            ? "text-white/85 hover:text-white"
                            : "text-neutral-900 hover:text-black"
                        }`}
                      >
                        {headset.etiqueta}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
