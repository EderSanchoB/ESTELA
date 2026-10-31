import { lazy, Suspense } from "react";

// React.lazy: depende de WebGL/three.js y es pesado, así que vive en su
// propio chunk en vez de ir en el bundle principal. (Antes next/dynamic
// con ssr:false por el mismo motivo de peso, más evitar que corriera en
// servidor — en esta SPA de Vite no hay servidor, pero el code-splitting
// sigue siendo deseable.)
const PointCloudModel = lazy(() => import("./PointCloudModel"));

export default function HeroBody({ visible }: { visible: boolean }) {
  return (
    <main
      // max-w bumped from 7xl (1280px) to 1600px: the grid below needs the
      // extra room so the 3D can grow substantially larger (per feedback)
      // while both headings keep their original 2-line wrap and the gap
      // around the model actually grows instead of shrinking — see the
      // grid comment below for the full breakdown. The subtitle/scroll
      // hint further down keep their own max-w-xl, so they don't stretch.
      // Blur added on top of the existing translate/opacity fade so the
      // whole section reads as emerging into focus out of the white
      // background, not just sliding/fading in — per feedback, everything
      // here gets this treatment except the ESTELA logo in Nav.tsx, which
      // intentionally keeps its plain opacity-only fade.
      className={`mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-6 pb-16 pt-8 transition-all duration-700 ease-out sm:px-10 ${
        visible
          ? "translate-y-0 opacity-100 blur-none"
          : "pointer-events-none translate-y-3 opacity-0 blur-xl"
      }`}
      aria-hidden={!visible}
    >
      {/* Model track raised 480px -> 520px and gap 24px -> 32px. Bumping
          just the track (with the old 1280px-wide `main`) would have eaten
          the gap alive — the side columns only had ~336px each to give up
          before text started wrapping onto a 3rd line, and giving up 40px
          there to grow the model would have shrunk the surrounding gap,
          not grown it. Widening `main` first means the side columns keep
          their original width (headings still wrap exactly as before) and
          the gap can grow too — see the layout math recorded alongside
          this change if these numbers ever need revisiting. */}
      <div className="grid flex-1 grid-cols-1 items-center gap-12 py-10 md:grid-cols-[1fr_minmax(300px,520px)_1fr] md:gap-8">
        <h1 className="text-center font-display text-[1.9rem] font-semibold leading-[1.15] text-neutral-900 md:text-left md:text-[2rem]">
          Arquitectura en
          <br className="hidden md:block" /> transición
        </h1>

        <Suspense fallback={null}>
          <PointCloudModel className="mx-auto aspect-square w-full max-w-[520px]" />
        </Suspense>

        <h2 className="text-center font-display text-[1.9rem] font-semibold leading-[1.15] text-neutral-900 md:text-right md:text-[2rem]">
          Del objeto material a la experiencia virtual
        </h2>
      </div>

      <div className="mx-auto max-w-xl pb-2 text-center">
        <p className="font-sans text-[15px] leading-relaxed text-muted">
          Una plataforma para acompañar, documentar y evaluar el uso de
          VR/XR en talleres de diseño arquitectónico.
        </p>
        <p className="mt-6 font-mono text-xs tracking-wide text-neutral-400">
          ↓ Scroll para explorar
        </p>
      </div>
    </main>
  );
}
