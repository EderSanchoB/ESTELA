import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import CustomCursor from "@/components/CustomCursor";
import Nav from "@/components/Nav";
import HeroBody from "@/components/HeroBody";
import CasosDeEstudio from "@/components/CasosDeEstudio";
import ConfiguraGafas from "@/components/ConfiguraGafas";
import { FootprintTrailProvider } from "@/components/FootprintTrail";
import SiteFooter from "@/components/SiteFooter";
import {
  clearIntroPlayed,
  hasIntroPlayed,
  isHomeHardReload,
  markIntroPlayed,
} from "@/lib/introFlag";

// Cargado con React.lazy (no un import normal): es pesado (decide la
// fuente de video vía UA sniffing) y solo se necesita durante la intro,
// nunca en "revealed" — separarlo en su propio chunk evita que ese peso
// entre en el bundle principal. (Antes era next/dynamic con ssr:false;
// Vite no renderiza en servidor, así que ese motivo ya no aplica, pero
// el code-splitting en sí sigue valiendo la pena.)
const HeroVideo = lazy(() => import("@/components/HeroVideo"));

type Phase = "intro" | "revealed";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [logoLocked, setLogoLocked] = useState(false);

  // Fires the moment the hero video's animation ends. The video's last
  // frame already places the ESTELA mark exactly where the real nav logo
  // sits, so we flip the real logo on right away and let the video
  // itself fade out underneath — a very short crossfade rather than a
  // hard cut, in case the two aren't pixel-perfect on every viewport.
  const handleVideoFinished = useCallback(() => {
    setLogoLocked(true);
    window.setTimeout(() => {
      setPhase("revealed");
      // Por si se llegó acá con un ancla en la URL (ver el comentario
      // del layout effect de abajo) — caso raro (primera visita real al
      // sitio entrando directo por una página de tutorial), pero que la
      // intro haya jugado no debería hacer perder el destino.
      if (window.location.hash) {
        document
          .querySelector(window.location.hash)
          ?.scrollIntoView({ behavior: "auto", block: "start" });
      }
    }, 150);
    markIntroPlayed();
  }, []);

  // Eder: "al presionar el logo no me funcionaba como botón de home
  // page" — un <Link href="/"> en Nav.tsx, estando YA en home, es para
  // Next.js una navegación a la misma ruta: no pasa nada (Home ni
  // siquiera se vuelve a montar), así que clearIntroPlayed() por sí solo
  // no alcanza — nunca llega a correr el layout effect de arriba que lee
  // esa bandera. Esta función resetea el estado directamente a mano, sin
  // depender de que la navegación remonte el componente — vale tanto
  // para cuando ya se está en home como para cuando se llega desde otra
  // página (donde de todas formas el layout effect de arriba haría lo
  // mismo al montar, así que no hace daño llamarla ahí también). También
  // sube el scroll al tope: si el logo "lleva a home", debe verse el
  // video desde arriba, no a media página si el usuario ya había
  // scrolleado.
  const replayIntro = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setLogoLocked(false);
    setPhase("intro");
  }, []);

  // Eder: "quiero que la animación del hero solo se reproduzca cuando se
  // entra a la página, cuando se hace click en el logo... o cuando se
  // recarga la página" — ver src/lib/introFlag.ts para el detalle
  // completo de la bandera en sessionStorage que hace esto posible.
  //
  // useLayoutEffect (no useEffect) para que, si corresponde saltarse la
  // intro, el cambio de fase ocurra ANTES de que el navegador pinte el
  // primer frame — así nunca se alcanza a ver ni un instante del video.
  useLayoutEffect(() => {
    if (isHomeHardReload()) {
      // Eder: una recarga real (F5) de home siempre debe reproducir la
      // intro, aunque ya se haya visto antes en esta sesión. isHomeHardReload
      // (no cualquier "recarga" genérica) es a propósito — ver el comentario
      // grande en introFlag.ts sobre el bug que esto corrige: un F5 en OTRA
      // página (p. ej. /tutoriales/meta-quest) no debe forzar la intro la
      // próxima vez que se llegue a home por un link normal.
      clearIntroPlayed();
      return;
    }
    if (!hasIntroPlayed()) return; // primera vez real: que juegue normal

    // (Ya no hay SSR/hidratación en esta SPA de Vite — el comentario
    // original explicaba por qué esto vivía en un useLayoutEffect en vez de
    // inicializar el useState directamente; se mantiene en useLayoutEffect
    // porque de todas formas evita un parpadeo visible del video antes del
    // primer paint, que es lo que sigue importando acá.)
    // oxlint-disable-next-line react/set-state-in-effect
    setLogoLocked(true);
    setPhase("revealed");

    // Eder (pedido relacionado): "Volver" en una guía, y el link
    // "Instrucciones VR" del nav/footer de una página de tutorial,
    // deben aterrizar directo en #instrucciones-vr — ambos marcan la
    // intro como ya reproducida antes de navegar (ver VolverButton.tsx
    // e InteriorNav.tsx), así que llegan por esta misma rama. Como acá
    // la intro nunca llega a jugar, el scroll tampoco queda bloqueado
    // (ver el efecto de overflow más abajo), pero el salto al ancla
    // puede llegar casi al mismo tiempo que este efecto corre —
    // repetirlo a mano garantiza que, pase lo que pase con el
    // auto-scroll del navegador, se termina en el lugar correcto.
    if (window.location.hash) {
      document
        .querySelector(window.location.hash)
        ?.scrollIntoView({ behavior: "auto", block: "start" });
    }
  }, []);

  // Mientras dura la animación inicial (phase === "intro") no debe poder
  // scrollearse hacia el resto de la página (HeroBody, CasosDeEstudio):
  // bloqueamos el scroll en <html>/<body> y lo restauramos apenas la
  // intro termina y pasamos a "revealed".
  useEffect(() => {
    const html = document.documentElement;
    const { body } = document;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    if (phase === "intro") {
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
    } else {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    }

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [phase]);

  return (
    <div className="relative flex min-h-screen flex-col bg-paper">
      <CustomCursor />

      <div
        aria-hidden="true"
        className="h-[3px] w-full shrink-0 bg-accent-blue"
      />

      <Nav
        logoVisible={logoLocked}
        contentVisible={phase === "revealed"}
        onLogoClick={replayIntro}
      />
      <HeroBody visible={phase === "revealed"} />
      {/* FootprintTrailProvider: arbitra "solo una huella activa a la
          vez" a lo largo de TODO este recorrido (ver FootprintTrail.tsx)
          — por eso envuelve ambas secciones en vez de que cada una
          maneje su propio estado por separado. */}
      <FootprintTrailProvider>
        <CasosDeEstudio visible={phase === "revealed"} />
        <ConfiguraGafas visible={phase === "revealed"} />
      </FootprintTrailProvider>
      {/* Sin gating de fade: el scroll ya queda bloqueado durante "intro"
          (ver el efecto más abajo), así que nadie llega a verlo antes de
          tiempo — no hace falta repetir la coreografía de reveal de las
          secciones de arriba. */}
      <SiteFooter />

      {phase === "intro" && (
        <Suspense fallback={null}>
          <HeroVideo onFinished={handleVideoFinished} fadingOut={logoLocked} />
        </Suspense>
      )}
    </div>
  );
}
