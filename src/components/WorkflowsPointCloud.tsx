import { useEffect, useMemo, useRef, useState } from "react";
import type { WorkflowVideo } from "@/lib/cms";

/**
 * Eder, con la imagen de referencia que me pasaste (la nube de puntos
 * triangulada, estilo "red neuronal"): acá la versión interactiva —
 * pero en vez de puntos decorativos sin sentido, cada punto del primer
 * plano ES un video real de la hoja de CMS, y las líneas entre ellos
 * siguen el orden real de "Paso" dentro de un mismo "Flujo" (ver
 * src/lib/cms.ts). El resto de la nube — la maraña tenue del fondo —
 * es puramente decorativa, solo para dar la sensación de profundidad
 * tridimensional que pedías; no representa nada.
 *
 * Dos capas, cada una con su propio desplazamiento al mover el mouse
 * (ver handleMouseMove): el fondo se mueve apenas un poco, el primer
 * plano (los videos) un poco más — así se siente que el primer plano
 * está "más cerca" y reacciona más al movimiento, como pediste
 * ("se muevan un poquito, no mucho").
 *
 * Por qué NO es three.js/WebGL (a pesar de que el resto del sitio ya
 * usa three.js para los otros modelos 3D): acá no hace falta una
 * cámara 3D real — es una ilusión de profundidad en 2D (como el fondo
 * de referencia que mandaste, que tampoco es 3D real). Usar SVG +
 * elementos HTML normales para los puntos permite que cada círculo sea
 * un <button> de verdad, con su miniatura de YouTube real adentro y su
 * tarjeta de texto al lado al pasar el mouse — mucho más simple de
 * armar y de mantener que proyectar eso sobre un canvas 3D.
 */

const BG_POINT_COUNT = 46;
const BG_NEIGHBORS = 2;
const BG_PARALLAX_PX = 10;
const FG_PARALLAX_PX = 16;
const NODE_IDLE_SIZE = 16;
const NODE_HOVER_SIZE = 84;
const EDGE_MARGIN_RATIO = 0.14;

type NormalizedPoint = { x: number; y: number };

type ForegroundNode = WorkflowVideo & {
  xRatio: number;
  yRatio: number;
};

// Hash simple y determinístico: el mismo id de video siempre cae en el
// mismo lugar del lienzo (no se reacomoda solo de la nada cada vez que
// React vuelve a renderizar), pero se ve disperso, no en fila prolija —
// justo el efecto "sueltos en el espacio" que pediste.
function hashUnit(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (h % 10000) / 10000;
}

function seededRatio(id: string, axis: "x" | "y"): number {
  const raw = hashUnit(`${id}-${axis}`);
  return EDGE_MARGIN_RATIO + raw * (1 - EDGE_MARGIN_RATIO * 2);
}

function layoutForeground(videos: WorkflowVideo[]): ForegroundNode[] {
  return videos.map((video) => ({
    ...video,
    xRatio: seededRatio(video.id, "x"),
    yRatio: seededRatio(video.id, "y"),
  }));
}

// Cadenas: mismo "Flujo" → una línea que conecta sus videos en orden de
// "Paso" (1, 2, 3...). Si dos flujos distintos están visibles a la vez
// (por ejemplo, al no filtrar por Programa), cada uno arma su propia
// cadena por separado — nunca se conectan videos de flujos distintos.
function buildFlowEdges(nodes: ForegroundNode[]): [ForegroundNode, ForegroundNode][] {
  const byFlujo = new Map<string, ForegroundNode[]>();
  for (const node of nodes) {
    const list = byFlujo.get(node.flujo) ?? [];
    list.push(node);
    byFlujo.set(node.flujo, list);
  }
  const edges: [ForegroundNode, ForegroundNode][] = [];
  for (const list of byFlujo.values()) {
    const sorted = [...list].sort((a, b) => a.paso - b.paso);
    for (let i = 0; i < sorted.length - 1; i++) {
      edges.push([sorted[i], sorted[i + 1]]);
    }
  }
  return edges;
}

// Maraña decorativa de fondo: puntos al azar conectados con sus 2
// vecinos más cercanos — da la textura triangulada de la imagen de
// referencia sin que signifique nada. Se calcula UNA sola vez, al
// cargar el módulo (no en cada render ni en cada montaje del
// componente) — así nunca "tiembla"/reacomoda sola mientras se usa la
// página, y de paso Math.random() nunca se llama durante un render
// (lo que el linter de pureza de React marcaría como un efecto
// secundario impuro dentro del componente).
function generateBackgroundMesh(): { points: NormalizedPoint[]; edges: [number, number][] } {
  const points: NormalizedPoint[] = Array.from({ length: BG_POINT_COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
  }));
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  points.forEach((p, i) => {
    const nearest = points
      .map((q, j) => ({ j, d: i === j ? Infinity : (p.x - q.x) ** 2 + (p.y - q.y) ** 2 }))
      .sort((a, b) => a.d - b.d)
      .slice(0, BG_NEIGHBORS);
    for (const { j } of nearest) {
      const key = i < j ? `${i}:${j}` : `${j}:${i}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push(i < j ? [i, j] : [j, i]);
      }
    }
  });
  return { points, edges };
}

const BACKGROUND_MESH = generateBackgroundMesh();

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <polygon points="8,5 19,12 8,19" fill="white" />
    </svg>
  );
}

export default function WorkflowsPointCloud({ videos }: { videos: WorkflowVideo[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { points: bgPoints, edges: bgEdges } = BACKGROUND_MESH;
  const foregroundNodes = useMemo(() => layoutForeground(videos), [videos]);
  const flowEdges = useMemo(() => buildFlowEdges(foregroundNodes), [foregroundNodes]);
  const hoveredNode = foregroundNodes.find((node) => node.id === hoveredId) ?? null;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    setParallax({
      x: (event.clientX - rect.left) / rect.width - 0.5,
      y: (event.clientY - rect.top) / rect.height - 0.5,
    });
  }

  function handleMouseLeave() {
    setParallax({ x: 0, y: 0 });
    setHoveredId(null);
  }

  const bgTransform = `translate(${-parallax.x * BG_PARALLAX_PX}px, ${-parallax.y * BG_PARALLAX_PX}px)`;
  const fgTransform = `translate(${-parallax.x * FG_PARALLAX_PX}px, ${-parallax.y * FG_PARALLAX_PX}px)`;

  const ready = size.width > 0 && size.height > 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative h-[480px] w-full overflow-hidden rounded-3xl border border-line bg-white sm:h-[600px]"
    >
      {videos.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center font-sans text-sm text-neutral-400">
          Ningún video publicado coincide con estos filtros todavía.
        </p>
      )}

      {ready && (
        <>
          {/* Capa de fondo: pura decoración, muy tenue. */}
          <svg
            className="absolute inset-0 h-full w-full transition-transform duration-200 ease-out"
            style={{ transform: bgTransform }}
            aria-hidden="true"
          >
            {bgEdges.map(([a, b], i) => (
              <line
                key={`bg-edge-${i}`}
                x1={bgPoints[a].x * size.width}
                y1={bgPoints[a].y * size.height}
                x2={bgPoints[b].x * size.width}
                y2={bgPoints[b].y * size.height}
                stroke="#d4d4d4"
                strokeWidth={1}
                opacity={0.4}
              />
            ))}
            {bgPoints.map((p, i) => (
              <circle
                key={`bg-dot-${i}`}
                cx={p.x * size.width}
                cy={p.y * size.height}
                r={2}
                fill="#a3a3a3"
                opacity={0.5}
              />
            ))}
          </svg>

          {/* Capa de primer plano: las líneas lógicas entre videos de un
              mismo flujo (más oscuras, más gruesas que las de fondo). */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full transition-transform duration-200 ease-out"
            style={{ transform: fgTransform }}
            aria-hidden="true"
          >
            {flowEdges.map(([a, b], i) => (
              <line
                key={`flow-edge-${i}`}
                x1={a.xRatio * size.width}
                y1={a.yRatio * size.height}
                x2={b.xRatio * size.width}
                y2={b.yRatio * size.height}
                stroke="#404040"
                strokeWidth={1.5}
                opacity={0.65}
              />
            ))}
          </svg>

          {/* Mismos videos, ahora como botones reales posicionados encima
              de sus líneas — comparten el mismo desplazamiento (fgTransform)
              que el svg de arriba para que las líneas sigan calzando con
              cada punto al mover el mouse. */}
          <div
            className="absolute inset-0 transition-transform duration-200 ease-out"
            style={{ transform: fgTransform }}
          >
            {foregroundNodes.map((node) => {
              const isHovered = node.id === hoveredId;
              const size_ = isHovered ? NODE_HOVER_SIZE : NODE_IDLE_SIZE;
              return (
                <button
                  key={node.id}
                  type="button"
                  aria-label={`Ver video: ${node.titulo}`}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId((id) => (id === node.id ? null : id))}
                  onFocus={() => setHoveredId(node.id)}
                  onBlur={() => setHoveredId((id) => (id === node.id ? null : id))}
                  onClick={() => {
                    if (node.youtubeUrl) {
                      window.open(node.youtubeUrl, "_blank", "noopener,noreferrer");
                    }
                  }}
                  className="group absolute flex items-center justify-center rounded-full border-2 border-neutral-900 bg-neutral-900 shadow-[0_0_0_6px_rgba(0,0,0,0.04)] transition-[width,height,transform] duration-300 ease-out"
                  style={{
                    left: `${node.xRatio * 100}%`,
                    top: `${node.yRatio * 100}%`,
                    width: size_,
                    height: size_,
                    transform: "translate(-50%, -50%)",
                    zIndex: isHovered ? 30 : 2,
                  }}
                >
                  {isHovered && node.youtubeId && (
                    <>
                      <img
                        src={`https://img.youtube.com/vi/${node.youtubeId}/hqdefault.jpg`}
                        alt=""
                        loading="lazy"
                        className="h-full w-full rounded-full object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                        <PlayGlyph />
                      </span>
                    </>
                  )}
                </button>
              );
            })}

            {/* Tarjeta con título/descripción del video bajo el mouse —
                se ancla al lado contrario de donde está el punto (si el
                punto vive en la mitad derecha, la tarjeta sale hacia la
                izquierda, y viceversa) para que nunca se salga del
                recuadro. */}
            {hoveredNode && (
              <div
                className="pointer-events-none absolute z-40 w-64 max-w-[70vw] rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-xl backdrop-blur-sm"
                style={{
                  left: `${hoveredNode.xRatio * 100}%`,
                  top: `${hoveredNode.yRatio * 100}%`,
                  transform: `translate(${hoveredNode.xRatio > 0.55 ? "calc(-100% - 28px)" : "28px"}, ${
                    hoveredNode.yRatio > 0.75 ? "-100%" : hoveredNode.yRatio < 0.25 ? "0%" : "-50%"
                  })`,
                }}
              >
                <p className="font-mono text-[10px] uppercase tracking-wide text-neutral-400">
                  {hoveredNode.programa}
                  {hoveredNode.flujo ? ` · Paso ${hoveredNode.paso}` : ""}
                </p>
                <p className="mt-1 font-display text-sm font-semibold text-neutral-900">
                  {hoveredNode.titulo}
                </p>
                {hoveredNode.descripcion && (
                  <p className="mt-1 line-clamp-3 font-sans text-xs text-neutral-500">
                    {hoveredNode.descripcion}
                  </p>
                )}
                {hoveredNode.duracionMin > 0 && (
                  <p className="mt-2 font-mono text-[10px] text-neutral-400">
                    {hoveredNode.duracionMin} min
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
