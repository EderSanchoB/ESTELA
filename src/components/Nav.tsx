import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getNavLogoBox, type PixelBox } from "@/lib/heroLogoRect";
import { clearIntroPlayed } from "@/lib/introFlag";
import VRGuideDropdown from "./VRGuideDropdown";
import { withBase } from "@/lib/withBase";

const NAV_LINKS = [
  { label: "Workflows", href: "#workflows" },
  { label: "Plantillas", href: "#plantillas" },
  { label: "Instrucciones VR", href: "#instrucciones-vr" },
  { label: "FAQ", href: "#faq" },
];

export default function Nav({
  logoVisible,
  contentVisible,
  onLogoClick,
}: {
  logoVisible: boolean;
  contentVisible: boolean;
  // Eder: "al presionar el logo no me funcionaba como botón de home
  // page" — el bug: un <Link to="/"> estando YA en "/" es, para
  // Next.js, una navegación a la misma ruta, así que no pasa nada (ni
  // siquiera remonta Home) — clearIntroPlayed() solo no alcanza, porque
  // nunca llega a correr el layout effect de page.tsx que lee esa
  // bandera. Esta función (ver page.tsx) resetea el estado de Home
  // directamente, a mano, para que el logo funcione también cuando ya
  // se está en home — no solo cuando se navega hacia home desde otra
  // página (ese caso sí remonta Home normalmente y no la necesita, pero
  // no está de más llamarla ahí también).
  onLogoClick: () => void;
}) {
  // The video's baked-in logo scales with the viewport (object-fit), so a
  // fixed Tailwind height/padding pair can only ever match it at one
  // accidental window size. Instead we recompute the exact pixel box
  // (see src/lib/heroLogoRect.ts) from the live viewport size and pin the
  // real logo there with position:fixed — same math the video itself is
  // drawn with, so the two stay lined up at any width. `null` until the
  // first effect run avoids a server/client (window-less) mismatch; the
  // logo is opacity:0 until logoVisible anyway, so that brief gap never
  // shows.
  const [box, setBox] = useState<PixelBox | null>(null);

  useEffect(() => {
    const updateBox = () => {
      setBox(getNavLogoBox(window.innerWidth, window.innerHeight));
    };
    updateBox();
    window.addEventListener("resize", updateBox);
    return () => window.removeEventListener("resize", updateBox);
  }, []);

  const navTransition = `transition-all duration-700 ease-out ${
    contentVisible
      ? "translate-y-0 opacity-100 blur-none"
      : "pointer-events-none -translate-y-1 opacity-0 blur-md"
  }`;

  return (
    <header className="relative z-20 border-b border-line">
      {/* No max-w/mx-auto here on purpose: the hero video is full-bleed
          (no centered container), so its closing animation leaves the
          ESTELA mark at a viewport-relative spot, not one relative to a
          centered header container — see the video handoff in page.tsx
          and the object-fit math in src/lib/heroLogoRect.ts. */}
      <div className="flex h-20 items-center justify-between px-6">
        {/* The hero video's closing animation ends with the ESTELA mark
            sitting exactly here, so this logo only fades in (no motion)
            the instant that animation finishes — see page.tsx. It's
            position:fixed (box computed above) rather than laid out by
            this flex row, because the match has to be viewport-relative
            like the video, not relative to this header's own box. The
            span right after it is an invisible placeholder so the nav
            links/button don't shift into the space it would have taken.

            sm:block / hidden below sm: the pixel match only makes sense
            where the video uses object-cover pinned to the top (see
            heroLogoRect.ts's SM_BREAKPOINT). Below that, the video is
            object-contain and vertically centered in the viewport, so on
            a tall narrow phone its baked-in logo — and this match — ends
            up mid-page, nowhere near the header. The intro is also cut
            short on mobile before that logo ever appears (see
            HeroVideo.tsx), so there's no frame to match there anyway;
            the plain static logo below covers phones instead.

            onClick: Eder: "quiero que la animación del hero solo se
            reproduzca... cuando se hace click en el logo" — ver
            src/lib/introFlag.ts para clearIntroPlayed (deja consistente
            la bandera para cualquier navegación futura) y el comentario
            de onLogoClick arriba (reset directo del estado de Home,
            necesario porque un <Link to="/"> estando ya en home no
            navega a ningún lado). */}
        <Link
          to="/"
          aria-label="ESTELA — inicio"
          onClick={() => {
            clearIntroPlayed();
            onLogoClick();
          }}
          className="fixed z-20 hidden shrink-0 transition-opacity duration-200 ease-out sm:block"
          style={{
            opacity: box && logoVisible ? 1 : 0,
            left: box?.left ?? 0,
            top: box?.top ?? 0,
            width: box?.width,
            height: box?.height,
          }}
        >
          <img
            src={withBase("/brand/estela-logo.png")}
            alt="ESTELA"
            width={661}
            height={178}
            draggable={false}
            className="h-full w-full select-none"
          />
        </Link>
        <span
          aria-hidden="true"
          className="hidden shrink-0 sm:block"
          style={{ width: box?.width ?? 0, height: box?.height ?? 0 }}
        />

        {/* Logo normal, en flujo, solo para debajo de `sm` — ver el
            comentario de arriba. Mismo fundido de opacidad que el logo
            fijo (logoVisible), pero sin el matching de posición. */}
        <Link
          to="/"
          aria-label="ESTELA — inicio"
          onClick={() => {
            clearIntroPlayed();
            onLogoClick();
          }}
          className={`block shrink-0 transition-opacity duration-200 ease-out sm:hidden ${
            logoVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={withBase("/brand/estela-logo.png")}
            alt="ESTELA"
            width={661}
            height={178}
            draggable={false}
            className="h-7 w-auto select-none"
          />
        </Link>

        <nav
          aria-label="Navegación principal"
          className={`hidden items-center gap-9 font-display text-[15px] font-medium text-neutral-800 md:flex ${navTransition}`}
        >
          {NAV_LINKS.map((link) =>
            // Eder, viendo la topbar de apple.com: "quiero que la topbar se
            // despliegue... al posicionar el mouse sobre 'Instrucciones VR'
            // se desplieguen las opciones de Gafas" — ver VRGuideDropdown.tsx.
            // Solo este enlace (y solo en esta fila de escritorio; la fila
            // móvil de abajo sigue con <Link> planos) se reemplaza por el
            // trigger+panel; el resto de NAV_LINKS queda igual.
            link.href === "#instrucciones-vr" ? (
              <VRGuideDropdown
                key={link.href}
                label={link.label}
                href={link.href}
                theme="light"
                className="transition-colors hover:text-black"
              />
            ) : (
              <Link
                key={link.href}
                to={link.href}
                className="transition-colors hover:text-black"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className={`flex items-center gap-3 ${navTransition}`}>
          {/* TODO(Eder): sin definir aún qué controla este ícono
              (¿idioma? ¿accesibilidad? ¿tema?) — de momento es decorativo,
              tal como aparece en la maqueta. */}
          <button
            type="button"
            aria-label="Más opciones"
            className="hidden h-9 w-9 items-center justify-center rounded-md border border-neutral-300 transition-colors hover:border-neutral-400 sm:flex"
          >
            <span className="sr-only">Más opciones</span>
          </button>

          <Link
            to="#explorar"
            className="rounded-full bg-black px-5 py-2.5 font-display text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Asistente IA
          </Link>
        </div>
      </div>

      {/* Fila de navegación para móvil: los mismos NAV_LINKS que en
          escritorio, pero en una franja horizontal deslizable con el
          dedo (scroll-snap) en vez de ocultarlos — por debajo de `md`
          no hay espacio para mostrarlos todos en la misma fila que el
          logo y el botón. Se oculta la scrollbar porque el gesto de
          deslizar ya comunica que hay más contenido a los lados. */}
      <nav
        aria-label="Navegación principal (móvil)"
        className={`flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-3 font-display text-sm font-medium text-neutral-800 [-ms-overflow-style:none] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden ${navTransition}`}
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="shrink-0 snap-start whitespace-nowrap transition-colors hover:text-black"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
