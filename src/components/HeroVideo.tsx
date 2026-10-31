import { useEffect, useRef, useState } from "react";
import { supportsAlphaWebm } from "@/lib/alphaVideoSupport";

// Celular en vertical: usa la animación corta dedicada (solo el ciclo
// "ESTELA" + puntitos, sin la transición al logo final — ver
// estela-hero-mobile-*.{webm,mp4}, pedida por Eder específicamente para
// este caso). Cualquier otro ancho/orientación (escritorio, tablet, o un
// celular rotado a horizontal) sigue usando el video original completo.
// 639px empata con el breakpoint `sm` que ya usa el resto del sitio (ver
// SM_BREAKPOINT en heroLogoRect.ts).
const MOBILE_PORTRAIT_QUERY = "(max-width: 639px) and (orientation: portrait)";

export default function HeroVideo({
  onFinished,
  fadingOut,
}: {
  onFinished: () => void;
  fadingOut: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // This component is only ever mounted client-side (see the ssr:false
  // dynamic import in page.tsx), so it's safe to read the real browser
  // support during the initial render instead of an effect.
  const [useAlpha, setUseAlpha] = useState(() => supportsAlphaWebm());
  // Decidido una sola vez al montar, igual que useAlpha arriba: no se
  // re-evalúa si el celular rota a mitad de la intro — total, dura menos
  // de 6s. Elige entre el par de archivos mobile-* y el par original.
  const [isMobilePortrait] = useState(
    () => window.matchMedia(MOBILE_PORTRAIT_QUERY).matches,
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Autoplay is muted, so this should basically never be blocked — but
    // if it is, don't leave the visitor staring at a frozen white screen.
    video.play().catch(onFinished);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useAlpha]);

  const handleError = () => {
    if (useAlpha) {
      // The alpha source failed to decode/play — drop to the safe MP4.
      setUseAlpha(false);
      return;
    }
    // Both sources failed: don't block the page behind a broken video.
    onFinished();
  };

  const alphaSrc = isMobilePortrait
    ? "/hero/estela-hero-mobile-alpha.webm"
    : "/hero/estela-hero-alpha.webm";
  const fallbackSrc = isMobilePortrait
    ? "/hero/estela-hero-mobile-fallback.mp4"
    : "/hero/estela-hero-fallback.mp4";

  return (
    <video
      ref={videoRef}
      // Force a remount when the source changes so the browser picks the
      // new <source> up immediately instead of caching the old selection.
      key={`${isMobilePortrait ? "mobile" : "desktop"}-${useAlpha ? "alpha" : "fallback"}`}
      // bg-paper: en celular el video queda en object-contain (ver arriba
      // por qué), y como su encuadre es más ancho que alto, dejará barras
      // sin cubrir arriba/abajo del cuadro. Un <video> sin fondo explícito
      // pinta esas barras en negro, lo que durante la intro se ve como un
      // flash negro/roto en vez de fundirse con el blanco de la página —
      // este fondo hace que esas barras sean invisibles.
      className="pointer-events-none fixed inset-0 z-30 h-full w-full bg-paper object-contain object-center transition-opacity duration-150 ease-out sm:object-cover sm:object-top"
      style={{ opacity: fadingOut ? 0 : 1 }}
      autoPlay
      muted
      playsInline
      preload="auto"
      onEnded={onFinished}
      onError={handleError}
    >
      {useAlpha ? (
        <source src={alphaSrc} type='video/webm; codecs="vp9"' />
      ) : (
        <source src={fallbackSrc} type="video/mp4" />
      )}
    </video>
  );
}
