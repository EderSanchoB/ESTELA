// (Migrado de Next.js: antes este comentario explicaba por qué este
// componente necesitaba "use client" — en una SPA de Vite ese concepto de
// Server/Client Component no existe, todo corre en el navegador.)
import { Link } from "react-router-dom";
import { clearIntroPlayed, markIntroPlayed } from "@/lib/introFlag";
import VRGuideDropdown from "./VRGuideDropdown";

const NAV_LINKS = [
  { label: "Workflows", href: "/#workflows" },
  { label: "Plantillas", href: "/#plantillas" },
  { label: "Instrucciones VR", href: "/#instrucciones-vr" },
  { label: "FAQ", href: "/#faq" },
];

/**
 * Eder: "quiero que al entrar a las instrucciones de las gafas siga
 * apareciendo la top bar pero con colores invertidos (incluso el logo)...
 * quiero que tenga la estética de la página principal".
 *
 * Esta es la versión "interior" (páginas que no son el home, por ahora
 * solo /tutoriales/*) del header de Nav.tsx: mismos enlaces, mismo logo
 * y mismo botón "Asistente IA", pero en negativo (fondo oscuro,
 * texto/logo blancos) para calzar con el fondo oscuro de las páginas de
 * tutorial — ver --bg/--text-primary en tutoriales/meta-quest/page.tsx.
 *
 * A propósito NO reutiliza Nav.tsx: ese componente existe solo para la
 * coreografía del video de intro del home (logoVisible/contentVisible,
 * el logo position:fixed que calza pixel a pixel con el último frame del
 * video — ver heroLogoRect.ts). Nada de eso aplica aquí: estas páginas no
 * tienen video de intro, así que el logo es simplemente estático — pero
 * Eder: "en la página principal el Logo se queda mientras uno scrollea,
 * entonces en las instrucciones de las gafas, también" — ahí el logo
 * queda fijo por el position:fixed de Nav.tsx (ver ese componente); acá
 * no hace falta todo el cálculo de heroLogoRect.ts (no hay video que
 * calzar), así que basta con un position:fixed simple, pineado en el
 * mismo punto (izquierda arriba).
 *
 * Igual que en Nav.tsx, el logo fijo solo aplica en `sm:` y arriba —
 * debajo de eso vuelve a ser uno normal, en el flujo (se desplaza con
 * el header, no se queda fijo). En Nav.tsx eso es un efecto colateral
 * de la coreografía del video; acá es a propósito: en pantallas
 * angostas no sobra espacio horizontal para reservarle un carril al
 * logo sin que cualquier texto que pase por ahí al hacer scroll choque
 * con él (ver el siguiente comentario) — mejor que en el home se vea
 * igual (el logo se desplaza con todo lo demás) a que en el tutorial
 * se vea peor (texto tapado a medias por el logo en cada scroll).
 *
 * Tamaño: Eder: "el logo en la home page y en esta sección tienen
 * diferentes escalas" — el logo fijo del home no tiene una altura fija
 * (depende del viewport, ver heroLogoRect.ts), pero calculado para un
 * viewport típico de escritorio (1920×1080) da ~42px de alto; h-10
 * (40px) es la aproximación más cercana en la escala de Tailwind, bien
 * por encima del h-7 (28px) que tenía antes.
 *
 * El resto de la barra (enlaces + botón) SÍ se desplaza con la página,
 * igual que en el home — ahí tampoco queda fijo, solo el logo.
 *
 * El logo (/brand/estela-logo.png) es tinta negra pura sobre transparente
 * (confirmado pixel a pixel), así que `invert` (filter: invert(100%)) lo
 * vuelve blanco sin artefactos — es la misma técnica que ya usa el cursor
 * de gafas VR (ver CustomCursor.tsx) para invertirse sobre fondos oscuros,
 * aunque ahí es automático (mix-blend-difference) porque el cursor viaja
 * sobre fondos claros Y oscuros en la misma página; acá el fondo siempre
 * es oscuro, así que basta con invertir el logo una sola vez.
 *
 * Los anchors (#workflows, #plantillas, #faq, #explorar) van prefijados
 * con "/" porque desde una ruta distinta a la home un simple "#ancla" no
 * navegaría a ningún lado — tienen que apuntar de vuelta al home. Ninguno
 * de esos ids existe todavía en la home salvo #instrucciones-vr (ver
 * ConfiguraGafas.tsx); el resto queda igual de "pendiente" que en el Nav
 * original del home.
 *
 * Eder: "quiero que en la top bar... cuando haga click [Instrucciones
 * VR] me lleve directamente a esta sección" — "directamente" quiere
 * decir sin que se interponga la animación de intro del home camino
 * para allá. markIntroPlayed() en los NAV_LINKS (se llama para los
 * cuatro, no solo Instrucciones VR, total los otros tres todavía no
 * apuntan a nada) marca la intro como ya vista ANTES de navegar, así
 * que Home la salta siempre — sin importar si técnicamente es la
 * primera vez que se visita el sitio en esta sesión (ver
 * src/lib/introFlag.ts). El logo hace lo opuesto (clearIntroPlayed):
 * Eder pidió que ESE click sí la reproduzca.
 */
export default function InteriorNav() {
  return (
    <header className="relative z-20 border-b border-white/10">
      <div className="flex h-20 items-center justify-between px-6">
        {/* Logo fijo (ver el comentario de arriba): position:fixed en vez
            de quedar en el flujo de este header, así permanece en el
            mismo punto de la pantalla al hacer scroll. El span invisible
            de al lado reserva el mismo espacio para que los enlaces/botón
            de la derecha no se corran a ocupar ese hueco. Solo en `sm:`
            y arriba — ver el comentario de arriba sobre por qué no en
            móvil. */}
        <Link
          to="/"
          aria-label="ESTELA — inicio"
          onClick={clearIntroPlayed}
          className="fixed left-6 top-5 z-20 hidden shrink-0 sm:block"
        >
          <img
            src="/brand/estela-logo.png"
            alt="ESTELA"
            width={661}
            height={178}
            draggable={false}
            className="h-10 w-auto select-none invert"
          />
        </Link>
        <span
          aria-hidden="true"
          className="hidden h-10 w-[149px] shrink-0 sm:block"
        />

        {/* Logo normal, en flujo, solo para debajo de `sm` — se desplaza
            con el resto del header en vez de quedar fijo. */}
        <Link
          to="/"
          aria-label="ESTELA — inicio"
          onClick={clearIntroPlayed}
          className="block shrink-0 sm:hidden"
        >
          <img
            src="/brand/estela-logo.png"
            alt="ESTELA"
            width={661}
            height={178}
            draggable={false}
            className="h-7 w-auto select-none invert"
          />
        </Link>

        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-9 font-display text-[15px] font-medium text-white/80 md:flex"
        >
          {NAV_LINKS.map((link) =>
            // Mismo trigger+panel que Nav.tsx (ver VRGuideDropdown.tsx) —
            // acá en negativo (theme="dark") para calzar con el fondo
            // oscuro de estas páginas, y con onNavigate={markIntroPlayed}
            // porque todos los enlaces de esta barra ya lo usan (ver el
            // comentario grande de arriba sobre por qué).
            link.href === "/#instrucciones-vr" ? (
              <VRGuideDropdown
                key={link.href}
                label={link.label}
                href={link.href}
                theme="dark"
                onNavigate={markIntroPlayed}
                className="transition-colors hover:text-white"
              />
            ) : (
              <Link
                key={link.href}
                to={link.href}
                onClick={markIntroPlayed}
                className="transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-3">
          {/* Mismo placeholder decorativo sin función definida aún que en
              Nav.tsx (ver el TODO de Eder ahí), invertido igual que todo
              lo demás. */}
          <button
            type="button"
            aria-label="Más opciones"
            className="hidden h-9 w-9 items-center justify-center rounded-md border border-white/20 transition-colors hover:border-white/40 sm:flex"
          >
            <span className="sr-only">Más opciones</span>
          </button>

          <Link
            to="/#explorar"
            onClick={markIntroPlayed}
            className="rounded-full bg-white px-5 py-2.5 font-display text-sm font-medium text-black transition-colors hover:bg-neutral-200"
          >
            Asistente IA
          </Link>
        </div>
      </div>

      {/* Misma fila de navegación para móvil que Nav.tsx (scroll-snap
          horizontal en vez de ocultar enlaces), en negativo. */}
      <nav
        aria-label="Navegación principal (móvil)"
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-3 font-display text-sm font-medium text-white/80 [-ms-overflow-style:none] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            onClick={markIntroPlayed}
            className="shrink-0 snap-start whitespace-nowrap transition-colors hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
