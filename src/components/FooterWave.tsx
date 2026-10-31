import { useEffect, useRef } from "react";

// El SVG se estira a todo el ancho real del footer vía
// preserveAspectRatio="none", así que este número solo fija la
// resolución de muestreo de la curva (cuántos puntos se reparten a lo
// ancho), no el ancho visual real.
const VIEWBOX_WIDTH = 1600;
// Alto real (px) de la franja de onda, pegada al borde superior del
// footer — el resto del footer sigue siendo el bg-black plano de
// siempre (ver SiteFooter.tsx).
const WAVE_HEIGHT = 72;
// Puntos de muestreo a lo ancho (10 segmentos entre ellos) — suficientes
// para que la curva de Catmull-Rom de abajo se vea orgánica/líquida, sin
// gastar de más en el rAF.
const POINT_COUNT = 11;
// Duración tope de la animación completa (por si el decaimiento de
// amplitud tardara en cruzar el umbral de "ya está plana" — ver abajo).
// Eder: "la animación puede durar dos segundos más" — el tope solo sigue
// a DECAY_TAU (ver abajo, que es quien realmente decide cuánto dura en
// la práctica); se sube con margen de sobra sobre el tiempo real de
// asentamiento (ver nota de BASE_AMPLITUDE, ≈3.97s).
const DURATION_MS = 4000;
// Qué tan rápido decae la amplitud (ms) — menor = se aplana más rápido.
// Con exp(-t/tau), a t=DECAY_TAU queda ~37% de la amplitud inicial. El
// tiempo real hasta asentarse es DECAY_TAU * ln(BASE_AMPLITUDE /
// SETTLE_EPSILON).
const DECAY_TAU = 919;
// Amplitud inicial de la onda principal, en px. Eder: "haz las ondas
// ligeramente más altas" (22 → 30) — con DECAY_TAU=919 el tiempo real
// de asentamiento queda en ≈3.97s (919 * ln(30/0.4)), por eso
// DURATION_MS subió a 4000 para no cortarla antes de tiempo.
const BASE_AMPLITUDE = 30;
// Velocidad de propagación de las ondas (rad/ms) — qué tan rápido
// "viajan" las crestas de izquierda a derecha mientras decae la
// amplitud.
const WAVE_SPEED = 0.006;
// Dos frecuencias espaciales distintas sumadas (una lenta/grande, otra
// más rápida/chica) en vez de un seno único — da la sensación de
// textura líquida (varias ondas superpuestas) en vez de una ola
// perfectamente regular.
const FREQ_1 = (Math.PI * 2 * 1.4) / VIEWBOX_WIDTH;
const FREQ_2 = (Math.PI * 2 * 3.1) / VIEWBOX_WIDTH;
// Por debajo de esta amplitud (px) ya no se nota el movimiento — se
// corta ahí en vez de esperar a que exp(-t/tau) llegue exactamente a 0
// (nunca llega, solo se acerca).
const SETTLE_EPSILON = 0.4;

// Convierte una lista de puntos en una curva suave (spline de
// Catmull-Rom pasada a segmentos cúbicos de Bézier) — a diferencia de
// unir los puntos con líneas rectas, esto da el aspecto redondeado y
// continuo de una superficie líquida real en vez de una curva con
// "picos" en cada punto de muestreo.
function catmullRomToBezierPath(points: Array<[number, number]>): string {
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

// Arma el `d` de un path CERRADO: la curva ondulada arriba (los `ys`,
// uno por punto de muestreo, 0 = plano) y un rectángulo relleno hacia
// abajo hasta el fondo de la franja — así el relleno negro de la onda
// se une sin costura con el bg-black del resto del footer, inmediatamente
// debajo. Con todos los `ys` en 0, esto es un rectángulo liso
// (visualmente idéntico a "sin onda").
function buildClosedPath(ys: number[]): string {
  const step = VIEWBOX_WIDTH / (ys.length - 1);
  const topPoints: Array<[number, number]> = ys.map((y, i) => [i * step, y]);
  const top = catmullRomToBezierPath(topPoints);
  return `${top} L ${VIEWBOX_WIDTH} ${WAVE_HEIGHT} L 0 ${WAVE_HEIGHT} Z`;
}

/**
 * Eder: "al llegar al footer, quiero que haya una animación de la parte
 * negra como de ondas que se mueven un poco y queda otra vez plana...
 * busco simular como si fuera líquido". Esta franja vive pegada al
 * borde superior de SiteFooter (ver ahí — se monta como primer hijo,
 * antes del contenido con padding) y le tapa ese borde con una curva
 * negra: arranca plana, ondula con amplitud que decae exponencialmente
 * (como una superficie que se perturba y se asienta sola) y vuelve a
 * quedar perfectamente plana — momento en el que el `requestAnimationFrame`
 * se cancela y el `path` se deja fijo en la forma plana (no sigue
 * corriendo un loop en segundo plano sin necesidad).
 *
 * Se dispara con un IntersectionObserver sobre su propio contenedor:
 * cada vez que esta franja ENTRA en viewport (no solo la primera vez —
 * a diferencia de los fades de una sola vez de HeroBody/CasosDeEstudio,
 * acá el pedido es que la ondulación pase "al llegar", como una
 * salpicadura que puede repetirse cada vez que se vuelve a visitar el
 * footer) se reinicia el reloj de la animación; si sale de viewport
 * antes de terminar (scroll rápido hacia arriba), se corta sin dejar el
 * path a medio ondular.
 *
 * Valores (altura/amplitud/duración/velocidad) son un punto de partida
 * razonable — fáciles de retocar acá arriba si el efecto se siente
 * demasiado sutil o demasiado brusco.
 */
export default function FooterWave() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const frameRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const path = pathRef.current;
    if (!wrap || !path) return;

    const flatPath = buildClosedPath(new Array(POINT_COUNT).fill(0));
    path.setAttribute("d", flatPath);

    const stop = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
      path.setAttribute("d", flatPath);
    };

    const tick = (now: number) => {
      const t = now - startRef.current;
      const envelope = BASE_AMPLITUDE * Math.exp(-t / DECAY_TAU);
      if (t >= DURATION_MS || envelope < SETTLE_EPSILON) {
        stop();
        return;
      }
      const ys = new Array(POINT_COUNT).fill(0).map((_, i) => {
        const x = (i * VIEWBOX_WIDTH) / (POINT_COUNT - 1);
        const wave =
          Math.sin(x * FREQ_1 + t * WAVE_SPEED) +
          0.5 * Math.sin(x * FREQ_2 - t * WAVE_SPEED * 1.7 + 1.3);
        return envelope * wave;
      });
      path.setAttribute("d", buildClosedPath(ys));
      frameRef.current = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (frameRef.current) cancelAnimationFrame(frameRef.current);
          startRef.current = performance.now();
          frameRef.current = requestAnimationFrame(tick);
        } else {
          stop();
        }
      },
      { threshold: 0 },
    );
    observer.observe(wrap);

    return () => {
      observer.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="relative w-full overflow-visible"
      style={{ height: WAVE_HEIGHT }}
    >
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${WAVE_HEIGHT}`}
        preserveAspectRatio="none"
        className="block h-full w-full overflow-visible"
      >
        <path ref={pathRef} fill="#000000" />
      </svg>
    </div>
  );
}
