import { useEffect, useRef } from "react";
import { withBase } from "@/lib/withBase";

type Particle = {
  x: number;
  y: number;
  r: number;
  born: number;
  life: number;
  shade: number; // 0 (light gray) .. 1 (near black)
};

// Tuning for the trailing "estela" (wake) of little dots behind the
// cursor — kept here so the look is easy to nudge in one place.
const SPAWN_EVERY_PX = 5; // how much the pointer must move before a new puff spawns
const PARTICLES_PER_SPAWN = [1, 3] as const; // random count per puff
const JITTER_PX = 7; // how far a particle can land from the exact pointer point
const PARTICLE_LIFE_MS = [450, 750] as const;
const PARTICLE_RADIUS_PX = [0.6, 2.2] as const;
const MAX_PARTICLES = 220;
// How much the dot shrinks while a button is held down (1 = no change).
const PRESSED_SCALE = 0.75;

function randRange([min, max]: readonly [number, number]) {
  return min + Math.random() * (max - min);
}

/**
 * Replaces the native pointer with a small VR-goggles mark
 * (public/cursor/cursor-goggles.png) and leaves a fine, fading dust trail
 * behind it as it moves — a little "estela" (wake), matching the site's
 * name. The trail is drawn on a canvas (cheap to animate at this particle
 * count); the goggles mark itself stays a DOM element on top so it stays
 * crisp.
 *
 * The goggles read as solid black over the (white) page, but flip to white
 * the instant they cross something dark, like a heading or the 3D model —
 * see the reference composite the design for this was based on. That's not
 * two swapped images: the PNG itself is the WHITE version of the mark, and
 * `mix-blend-difference` (see the JSX below) inverts it against whatever is
 * underneath — white-on-white difference is black, white-on-black
 * difference stays white — with the browser recomputing that per pixel on
 * every frame for free. This only works because nothing between this
 * component and the page root creates its own stacking context (a
 * transform/opacity/filter on an ANCESTOR of this cursor would wall the
 * blend off from the rest of the page); it's rendered as a direct child of
 * the plain `position: relative` root wrapper in page.tsx precisely so the
 * blend can see everything.
 *
 * Disabled on touch / coarse-pointer devices so nothing gets stuck on
 * screen, and cursor positioning is done via direct DOM writes (no React
 * state) so it tracks the mouse every frame without re-rendering the app.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const isFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    if (!isFinePointer) return;

    const dot = dotRef.current;
    const canvas = canvasRef.current;
    if (!dot || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    document.documentElement.classList.add("has-custom-cursor");

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let rafId = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let lastSpawnX = x;
    let lastSpawnY = y;
    let pressed = false;
    const particles: Particle[] = [];

    // The dot's position AND its click-press scale are both written into
    // this one `transform` string, from this one place. Previously the
    // position came from this inline `transform` while the -50%/-50%
    // centering and the click scale came from separate Tailwind utility
    // classes (the native CSS `translate`/`scale` properties, which
    // compose with `transform` rather than simply being overridden by
    // it) — that combination was what made clicking visibly relocate the
    // dot instead of just shrinking it in place. A single source of
    // truth for the whole transform avoids that composition entirely.
    const applyTransform = () => {
      const scale = pressed ? PRESSED_SCALE : 1;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
    };
    applyTransform();

    const spawnPuff = (px: number, py: number) => {
      const count = Math.round(randRange(PARTICLES_PER_SPAWN));
      for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) particles.shift();
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * JITTER_PX;
        particles.push({
          x: px + Math.cos(angle) * dist,
          y: py + Math.sin(angle) * dist,
          r: randRange(PARTICLE_RADIUS_PX),
          born: performance.now(),
          life: randRange(PARTICLE_LIFE_MS),
          shade: Math.random(),
        });
      }
    };

    const applyFrame = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const now = performance.now();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const t = (now - p.born) / p.life;
        if (t >= 1) {
          particles.splice(i, 1);
          continue;
        }
        const alpha = (1 - t) * 0.55;
        const gray = Math.round(20 + p.shade * 90); // near-black to mid-gray
        ctx.beginPath();
        ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, ${alpha})`;
        ctx.arc(p.x, p.y, p.r * (1 - t * 0.3), 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = particles.length > 0 ? requestAnimationFrame(applyFrame) : 0;
    };

    const ensureLoopRunning = () => {
      if (!rafId) rafId = requestAnimationFrame(applyFrame);
    };

    const handleMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      dot.style.opacity = "1";
      applyTransform();

      const dx = x - lastSpawnX;
      const dy = y - lastSpawnY;
      if (Math.hypot(dx, dy) >= SPAWN_EVERY_PX) {
        spawnPuff(x, y);
        lastSpawnX = x;
        lastSpawnY = y;
      }
      ensureLoopRunning();
    };

    const handleLeave = () => {
      dot.style.opacity = "0";
    };

    const handleDown = () => {
      pressed = true;
      applyTransform();
    };
    const handleUp = () => {
      pressed = false;
      applyTransform();
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointerup", handleUp);
    document.addEventListener("mouseleave", handleLeave);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
      document.removeEventListener("mouseleave", handleLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[998]"
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[999] w-11 aspect-[199/109] mix-blend-difference opacity-0 transition-[opacity,transform] duration-150 ease-out will-change-transform"
        style={{
          backgroundImage: `url(${withBase("/cursor/cursor-goggles.png")})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      />
    </>
  );
}
