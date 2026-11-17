import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LineMaterial, LineSegments2, LineSegmentsGeometry } from "three-stdlib";
import type { WorkflowVideo } from "@/lib/cms";
import VideoPlayerModal from "./VideoPlayerModal";

/**
 * Nube de puntos de Workflows — versión 3D real.
 *
 * Eder pidió tres cosas sobre la versión anterior (2D, dos capas SVG):
 *
 * 1. "Que todas las líneas, aún las que no tienen puntos de video, estén
 *    interconectadas" y que haya "intermedios entre grises y negros" que
 *    le den tridimensionalidad — "incluso podrías hacerlo tridimensional,
 *    de modo que sea la realidad de la figura". Ahora la nube es un
 *    volumen 3D de verdad (three.js, ya usado en el resto del sitio): los
 *    puntos decorativos y los de video forman UNA sola red (árbol de
 *    expansión mínima + vecinos más cercanos, así ningún punto queda
 *    suelto), y el tono de cada línea y cada punto se calcula en cada
 *    cuadro según su distancia real a la cámara: negro adelante, gris
 *    claro atrás, con todos los intermedios.
 *
 * 2. "Que cada vez que se sume uno de estos puntos con videos queden lo
 *    más centrados posibles" — las posiciones de los videos se calculan
 *    para que su centro quede siempre en el origen, la cámara encuadra
 *    la nube completa y, al agregar o filtrar videos, los puntos se
 *    deslizan suavemente a su nueva posición.
 *
 * 3. Orden visual: al lado de cada video, su número de paso ("01") y el
 *    título, como texto suelto sin recuadro, en letra pequeña y delgada.
 *    Al hacer clic, el video se reproduce en primer plano dentro de la
 *    página (ver VideoPlayerModal.tsx).
 */

type Vec3 = [number, number, number];

// --- Ajustes de la figura (todo en un solo lugar) -------------------------

const BG_POINT_COUNT = 64;
// Semiejes del volumen elipsoidal donde viven los puntos decorativos.
const CLOUD_RADII: Vec3 = [3.4, 2.15, 2.15];
const BG_NEIGHBORS = 2;
const VIDEO_NEIGHBORS = 3;

// La figura se mece despacio de un lado a otro (no da vueltas completas):
// así se aprecia que es 3D, pero el recorrido 01 → 02 → 03 se sigue
// leyendo de izquierda a derecha y las etiquetas no se enciman.
const SWAY_SPEED = 0.22; // rad/s de la oscilación
const SWAY_AMPLITUDE = 0.5; // rad (~29°) hacia cada lado
const MOUSE_TILT_X = 0.22; // rad
const MOUSE_TILT_Y = 0.35; // rad
const POSITION_DAMPING = 4; // qué tan rápido se reacomodan los puntos

// Rango de grises según profundidad (0 = adelante, 1 = atrás).
const MESH_TONE: [number, number] = [0.07, 0.86];
const VIDEO_TONE: [number, number] = [0.02, 0.45];
const LABEL_TONE: [number, number] = [0.07, 0.48];
const FLOW_TONE: [number, number] = [0.0, 0.35];

const BG_DOT_RADIUS = 0.024;
const NODE_IDLE_SIZE = 14;
const NODE_HOVER_SIZE = 84;
const LABEL_MAX_CHARS = 40;
const LABEL_MAX_CHARS_COMPACT = 24;
// Por debajo de esta proporción ancho/alto (celular vertical) la figura
// se gira 90°: el recorrido baja de arriba hacia abajo (01 arriba) en vez
// de ir de izquierda a derecha, y así aprovecha la pantalla alta.
const VERTICAL_ASPECT = 0.85;
const CAMERA_FOV = 38;

// --- Utilidades ------------------------------------------------------------

// PRNG determinístico: la nube decorativa sale siempre igual, no
// "tiembla" ni se reacomoda sola entre visitas.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateBackground(): Vec3[] {
  const rand = mulberry32(20261117);
  const points: Vec3[] = [];
  while (points.length < BG_POINT_COUNT) {
    const x = rand() * 2 - 1;
    const y = rand() * 2 - 1;
    const z = rand() * 2 - 1;
    if (x * x + y * y + z * z > 1) continue;
    points.push([x * CLOUD_RADII[0], y * CLOUD_RADII[1], z * CLOUD_RADII[2]]);
  }
  return points;
}

const BACKGROUND_POINTS = generateBackground();

function dist2(a: Vec3, b: Vec3) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

function edgeKey(a: number, b: number) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/** Título sin el prefijo del programa ("Arkio | …"). */
function cleanTitle(titulo: string): string {
  const parts = titulo.split(" | ");
  return (parts.length > 1 ? parts.slice(1).join(" | ") : titulo).trim();
}

/** Título limpio, cortado para la etiqueta (más corto en celular). */
function shortTitle(titulo: string, compact = false): string {
  const clean = cleanTitle(titulo);
  const max = compact ? LABEL_MAX_CHARS_COMPACT : LABEL_MAX_CHARS;
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// --- Orden y posiciones de los videos -------------------------------------

/** Videos agrupados por Flujo y ordenados por Paso dentro de cada flujo. */
function orderVideos(videos: WorkflowVideo[]): WorkflowVideo[] {
  const byFlujo = new Map<string, WorkflowVideo[]>();
  for (const v of videos) {
    const list = byFlujo.get(v.flujo) ?? [];
    list.push(v);
    byFlujo.set(v.flujo, list);
  }
  const flows = Array.from(byFlujo.values()).map((list) =>
    [...list].sort((a, b) => a.paso - b.paso || a.id.localeCompare(b.id)),
  );
  flows.sort((a, b) => a[0].id.localeCompare(b[0].id));
  return flows.flat();
}

/**
 * Coloca los videos en orden a lo largo de una curva suave que atraviesa
 * la nube de izquierda a derecha (así el recorrido 01 → 02 → 03 se lee
 * en el mismo sentido que el texto), y después resta el centroide para
 * que el conjunto quede SIEMPRE centrado, sin importar cuántos haya.
 * Con muchos videos (más de 7) la curva se enrolla en espiral sobre una
 * esfera para no salirse del cuadro.
 */
function layoutVideos(ordered: WorkflowVideo[]): Map<string, Vec3> {
  const n = ordered.length;
  const raw: Vec3[] = [];
  if (n <= 7) {
    const spacing = n > 1 ? Math.min(2.3, 5.2 / (n - 1)) : 0;
    for (let i = 0; i < n; i++) {
      const angle = i * 1.9 + 0.6;
      raw.push([
        (i - (n - 1) / 2) * spacing,
        Math.sin(angle) * 0.75,
        Math.cos(angle) * 0.8,
      ]);
    }
  } else {
    const radius = 2.1;
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      raw.push([Math.cos(theta) * r * radius * 1.3, y * radius * 0.85, Math.sin(theta) * r * radius]);
    }
  }
  const c: Vec3 = [0, 0, 0];
  raw.forEach((p) => {
    c[0] += p[0] / n;
    c[1] += p[1] / n;
    c[2] += p[2] / n;
  });
  const out = new Map<string, Vec3>();
  ordered.forEach((v, i) => {
    out.set(v.id, [raw[i][0] - c[0], raw[i][1] - c[1], raw[i][2] - c[2]]);
  });
  return out;
}

type Topology = {
  /** Aristas de la red general (índices sobre [fondo..., videos...]). */
  meshEdges: [number, number][];
  /** Aristas del recorrido de cada flujo (paso a paso). */
  flowEdges: [number, number][];
};

/**
 * Una sola red para todos los puntos: un árbol de expansión mínima (Prim)
 * garantiza que ningún punto quede aislado, y los vecinos más cercanos de
 * cada punto le dan la textura triangulada. Las líneas del recorrido se
 * dibujan aparte, más gruesas y oscuras.
 */
function buildTopology(points: Vec3[], ordered: WorkflowVideo[], bgCount: number): Topology {
  const n = points.length;
  const seen = new Set<string>();
  const meshEdges: [number, number][] = [];
  const flowEdges: [number, number][] = [];

  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i].flujo === ordered[i - 1].flujo) {
      const a = bgCount + i - 1;
      const b = bgCount + i;
      flowEdges.push([a, b]);
      seen.add(edgeKey(a, b));
    }
  }

  const add = (a: number, b: number) => {
    const key = edgeKey(a, b);
    if (a === b || seen.has(key)) return;
    seen.add(key);
    meshEdges.push([a, b]);
  };

  if (n > 1) {
    const inTree = new Array<boolean>(n).fill(false);
    const best = new Array<number>(n).fill(Infinity);
    const parent = new Array<number>(n).fill(-1);
    best[0] = 0;
    for (let k = 0; k < n; k++) {
      let u = -1;
      for (let i = 0; i < n; i++) {
        if (!inTree[i] && (u === -1 || best[i] < best[u])) u = i;
      }
      inTree[u] = true;
      if (parent[u] >= 0) add(parent[u], u);
      for (let v = 0; v < n; v++) {
        if (inTree[v]) continue;
        const d = dist2(points[u], points[v]);
        if (d < best[v]) {
          best[v] = d;
          parent[v] = u;
        }
      }
    }
  }

  points.forEach((p, i) => {
    const k = i >= bgCount ? VIDEO_NEIGHBORS : BG_NEIGHBORS;
    points
      .map((q, j) => ({ j, d: i === j ? Infinity : dist2(p, q) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, k)
      .forEach(({ j }) => add(i, j));
  });

  return { meshEdges, flowEdges };
}

// --- Etiquetas sin choques --------------------------------------------------

type ScreenNode = { id: string; x: number; y: number; refs: NodeRefs };
type Rect = { x0: number; y0: number; x1: number; y1: number };

const LABEL_GAP = 12; // px entre el punto y el texto
const LABEL_HEIGHT = 14;
const LABEL_SHIFT = 16; // px que sube o baja una etiqueta para esquivar otra

function overlaps(a: Rect, b: Rect) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

/**
 * Coloca cada etiqueta (número + título) donde no tape a otra: primero
 * prueba a la derecha del punto, después a la izquierda, y si las dos
 * chocan, la sube o la baja un renglón. También evita salirse del borde.
 * Se recalcula en cada cuadro porque la figura se mueve.
 */
function placeLabels(nodes: ScreenNode[], hoveredId: string | null, width: number) {
  const placed: Rect[] = nodes.map((n) => ({ x0: n.x - 9, y0: n.y - 9, x1: n.x + 9, y1: n.y + 9 }));
  const sorted = [...nodes].sort((a, b) => a.x - b.x);
  for (const node of sorted) {
    const side = node.refs.side;
    if (!side || node.id === hoveredId) continue;
    const labelWidth = (side.firstElementChild as HTMLElement | null)?.offsetWidth ?? 200;
    const candidates: { dir: "left" | "right"; dy: number }[] = [
      { dir: "right", dy: 0 },
      { dir: "left", dy: 0 },
      { dir: "right", dy: LABEL_SHIFT },
      { dir: "right", dy: -LABEL_SHIFT },
      { dir: "left", dy: LABEL_SHIFT },
      { dir: "left", dy: -LABEL_SHIFT },
    ];
    let choice = candidates[0];
    let rect: Rect | null = null;
    for (const c of candidates) {
      const x0 = c.dir === "right" ? node.x + LABEL_GAP : node.x - LABEL_GAP - labelWidth;
      const r = { x0, x1: x0 + labelWidth, y0: node.y + c.dy - LABEL_HEIGHT / 2, y1: node.y + c.dy + LABEL_HEIGHT / 2 };
      const inside = r.x0 >= 4 && r.x1 <= width - 4;
      if (inside && !placed.some((p) => overlaps(p, r))) {
        choice = c;
        rect = r;
        break;
      }
    }
    if (!rect) {
      // Sin hueco libre: el lado con más espacio hasta el borde.
      choice = { dir: node.x > width / 2 ? "left" : "right", dy: 0 };
      const x0 = choice.dir === "right" ? node.x + LABEL_GAP : node.x - LABEL_GAP - labelWidth;
      rect = { x0, x1: x0 + labelWidth, y0: node.y - LABEL_HEIGHT / 2, y1: node.y + LABEL_HEIGHT / 2 };
    }
    placed.push(rect);
    if (side.dataset.side !== choice.dir) side.dataset.side = choice.dir;
    side.style.marginTop = `${choice.dy}px`;
  }
}

// --- Escena 3D ------------------------------------------------------------

type NodeRefs = {
  wrap: HTMLDivElement | null;
  dot: HTMLButtonElement | null;
  side: HTMLDivElement | null;
};

type NodeRegistry = React.MutableRefObject<Map<string, NodeRefs>>;

type SceneProps = {
  ordered: WorkflowVideo[];
  targets: Map<string, Vec3>;
  topology: Topology;
  hoveredId: string | null;
  nodeRefs: NodeRegistry;
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  reducedMotion: boolean;
};

function CameraRig() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(size.height, 1);
    const vHalf = THREE.MathUtils.degToRad(CAMERA_FOV / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * aspect);
    // Encuadra la nube completa (con un poco de aire) tanto a lo ancho
    // como a lo alto — en celular manda el ancho, en escritorio el alto.
    const vertical = aspect < VERTICAL_ASPECT;
    const halfW = (vertical ? CLOUD_RADII[1] : CLOUD_RADII[0]) + 0.4;
    const halfH = (vertical ? CLOUD_RADII[0] : CLOUD_RADII[1]) + 0.45;
    const distForWidth = halfW / Math.tan(hHalf);
    const distForHeight = halfH / Math.tan(vHalf);
    const distance = Math.max(distForWidth, distForHeight) + CLOUD_RADII[2] * 0.3;
    cam.fov = CAMERA_FOV;
    cam.position.set(0, 0, distance);
    cam.near = 0.1;
    cam.far = distance * 3;
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function Scene({
  ordered,
  targets,
  topology,
  hoveredId,
  nodeRefs,
  pointer,
  reducedMotion,
}: SceneProps) {
  const { size } = useThree();
  const outerRef = useRef<THREE.Group>(null);
  const rootRef = useRef<THREE.Group>(null);
  const vertical = size.width / Math.max(size.height, 1) < VERTICAL_ASPECT;
  const dotsRef = useRef<THREE.InstancedMesh>(null);
  const swayClock = useRef(0);
  const tilt = useRef({ x: 0, y: 0 });
  const current = useRef(new Map<string, THREE.Vector3>());
  const bgCount = BACKGROUND_POINTS.length;

  // Posiciones actuales (animadas) de los videos: un video nuevo nace en
  // el centro y se desliza a su lugar; los existentes se mueven suave.
  useEffect(() => {
    const map = current.current;
    for (const id of Array.from(map.keys())) {
      if (!targets.has(id)) map.delete(id);
    }
    for (const id of targets.keys()) {
      if (!map.has(id)) map.set(id, new THREE.Vector3(0, 0, 0));
    }
  }, [targets]);

  // Red general: un solo buffer de segmentos de 1 px con color por vértice.
  const meshLines = useMemo(() => {
    const count = topology.meshEdges.length * 2;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const material = new THREE.LineBasicMaterial({ vertexColors: true });
    return new THREE.LineSegments(geometry, material);
  }, [topology]);

  // Recorrido de cada flujo: línea gruesa (LineSegments2) con color por vértice.
  const flowLines = useMemo(() => {
    const geometry = new LineSegmentsGeometry();
    const material = new LineMaterial({ linewidth: 2.2, vertexColors: true });
    return new LineSegments2(geometry, material);
  }, []);

  useEffect(() => () => {
    meshLines.geometry.dispose();
    (meshLines.material as THREE.Material).dispose();
  }, [meshLines]);

  useEffect(() => () => {
    flowLines.geometry.dispose();
    flowLines.material.dispose();
  }, [flowLines]);

  useEffect(() => {
    flowLines.material.resolution.set(size.width, size.height);
  }, [flowLines, size]);

  const scratch = useMemo(
    () => ({
      world: new THREE.Vector3(),
      ndc: new THREE.Vector3(),
      color: new THREE.Color(),
      matrix: new THREE.Matrix4(),
      all: [] as THREE.Vector3[],
    }),
    [],
  );

  useFrame((state, delta) => {
    const root = rootRef.current;
    if (!root) return;
    const camera = state.camera;
    const dt = Math.min(delta, 0.05);

    // Rotación: giro automático muy lento (se detiene al pasar el mouse
    // sobre un video, para que sea fácil hacerle clic) + inclinación
    // leve siguiendo al mouse.
    if (!reducedMotion && !hoveredId) swayClock.current += SWAY_SPEED * dt;
    const sway = Math.sin(swayClock.current) * SWAY_AMPLITUDE;
    const ease = 1 - Math.exp(-dt * 3);
    tilt.current.x += (pointer.current.y * MOUSE_TILT_X - tilt.current.x) * ease;
    tilt.current.y += (pointer.current.x * MOUSE_TILT_Y - tilt.current.y) * ease;
    root.rotation.set(tilt.current.x, sway + tilt.current.y, 0);
    (outerRef.current ?? root).updateMatrixWorld();

    // Animación de posiciones de los videos hacia su destino.
    const move = 1 - Math.exp(-dt * POSITION_DAMPING);
    for (const [id, pos] of current.current) {
      const t = targets.get(id);
      if (t) pos.lerp(scratch.world.set(t[0], t[1], t[2]), move);
    }

    // Lista completa de puntos (fondo + videos) en coordenadas locales.
    const all = scratch.all;
    all.length = 0;
    for (const p of BACKGROUND_POINTS) all.push(new THREE.Vector3(p[0], p[1], p[2]));
    for (const v of ordered) all.push(current.current.get(v.id) ?? new THREE.Vector3());

    // Profundidad real de cada punto → tono (0 = adelante, 1 = atrás).
    // Se normaliza contra el punto más cercano y el más lejano de ESTE
    // cuadro, así siempre se usa la escala completa de grises.
    const distances = all.map((p) => {
      scratch.world.copy(p).applyMatrix4(root.matrixWorld);
      return scratch.world.distanceTo(camera.position);
    });
    const dMin = Math.min(...distances);
    const dSpan = Math.max(Math.max(...distances) - dMin, 1e-6);
    const depth = distances.map((d) => (d - dMin) / dSpan);
    const tone = (range: [number, number], t: number) => range[0] + (range[1] - range[0]) * t;

    // Red general.
    const pos = meshLines.geometry.getAttribute("position") as THREE.BufferAttribute;
    const col = meshLines.geometry.getAttribute("color") as THREE.BufferAttribute;
    topology.meshEdges.forEach(([a, b], i) => {
      const pa = all[a];
      const pb = all[b];
      pos.setXYZ(i * 2, pa.x, pa.y, pa.z);
      pos.setXYZ(i * 2 + 1, pb.x, pb.y, pb.z);
      const ga = tone(MESH_TONE, depth[a]);
      const gb = tone(MESH_TONE, depth[b]);
      col.setXYZ(i * 2, ga, ga, ga);
      col.setXYZ(i * 2 + 1, gb, gb, gb);
    });
    pos.needsUpdate = true;
    col.needsUpdate = true;
    meshLines.geometry.computeBoundingSphere();

    // Recorridos (líneas gruesas).
    if (topology.flowEdges.length > 0) {
      const fp: number[] = [];
      const fc: number[] = [];
      for (const [a, b] of topology.flowEdges) {
        fp.push(all[a].x, all[a].y, all[a].z, all[b].x, all[b].y, all[b].z);
        const ga = tone(FLOW_TONE, depth[a]);
        const gb = tone(FLOW_TONE, depth[b]);
        fc.push(ga, ga, ga, gb, gb, gb);
      }
      flowLines.geometry.setPositions(fp);
      flowLines.geometry.setColors(fc);
      flowLines.visible = true;
    } else {
      flowLines.visible = false;
    }

    // Puntos decorativos.
    const dots = dotsRef.current;
    if (dots) {
      for (let i = 0; i < bgCount; i++) {
        const p = all[i];
        const s = 1.15 - depth[i] * 0.5;
        scratch.matrix.makeScale(s, s, s).setPosition(p.x, p.y, p.z);
        dots.setMatrixAt(i, scratch.matrix);
        const g = tone(MESH_TONE, depth[i]);
        dots.setColorAt(i, scratch.color.setRGB(g, g, g));
      }
      dots.instanceMatrix.needsUpdate = true;
      if (dots.instanceColor) dots.instanceColor.needsUpdate = true;
    }

    // Videos: el punto y su etiqueta son HTML normal (para que sean
    // botones reales con miniatura y texto nítido); acá se proyecta su
    // posición 3D a la pantalla en cada cuadro, junto con su tono según
    // la profundidad, el orden de apilado y de qué lado va la etiqueta
    // (hacia afuera de la figura, para no salirse del recuadro).
    const screen: ScreenNode[] = [];
    ordered.forEach((v, i) => {
      const refs = nodeRefs.current.get(v.id);
      if (!refs?.wrap) return;
      const p = all[bgCount + i];
      scratch.ndc.copy(p).applyMatrix4(root.matrixWorld).project(camera);
      const x = ((scratch.ndc.x + 1) / 2) * size.width;
      const y = ((1 - scratch.ndc.y) / 2) * size.height;
      const t = depth[bgCount + i];
      refs.wrap.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      refs.wrap.style.zIndex = v.id === hoveredId ? "40" : String(Math.round((1 - t) * 30) + 1);
      refs.wrap.style.visibility = "visible";
      if (refs.dot && v.id !== hoveredId) {
        const g = Math.round(tone(VIDEO_TONE, t) * 255);
        refs.dot.style.backgroundColor = `rgb(${g},${g},${g})`;
        refs.dot.style.borderColor = `rgb(${g},${g},${g})`;
      }
      if (refs.side) {
        const g = Math.round(tone(LABEL_TONE, t) * 255);
        refs.side.style.color = `rgb(${g},${g},${g})`;
        // El número de paso va "un poco más oscuro" que el título (pedido
        // explícito de Eder) — no solo más grueso (font-medium vs
        // font-light): una variable CSS aparte, un poco más oscura que el
        // color base, que el span del número usa en vez de heredar.
        const gNum = Math.max(0, g - 45);
        refs.side.style.setProperty("--step-color", `rgb(${gNum},${gNum},${gNum})`);
      }
      screen.push({ id: v.id, x, y, refs });
    });
    placeLabels(screen, hoveredId, size.width);
  });

  return (
    <>
      <CameraRig />
      <group ref={outerRef} rotation={[0, 0, vertical ? -Math.PI / 2 : 0]}>
      <group ref={rootRef}>
        <primitive object={meshLines} />
        <primitive object={flowLines} />
        <instancedMesh ref={dotsRef} args={[undefined, undefined, bgCount]} frustumCulled={false}>
          <sphereGeometry args={[BG_DOT_RADIUS, 10, 10]} />
          <meshBasicMaterial />
        </instancedMesh>

      </group>
      </group>
    </>
  );
}

// --- Puntos de video (HTML encima del lienzo 3D) ----------------------------

function VideoNodes({
  ordered,
  hoveredId,
  setHoveredId,
  onOpen,
  nodeRefs,
  compact,
}: {
  ordered: WorkflowVideo[];
  compact: boolean;
  hoveredId: string | null;
  setHoveredId: (updater: (id: string | null) => string | null) => void;
  onOpen: (id: string) => void;
  nodeRefs: NodeRegistry;
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {ordered.map((video) => {
        const isHovered = video.id === hoveredId;
        const nodeSize = isHovered ? NODE_HOVER_SIZE : NODE_IDLE_SIZE;
        const register = (key: keyof NodeRefs) => (el: HTMLDivElement | HTMLButtonElement | null) => {
          const entry = nodeRefs.current.get(video.id) ?? { wrap: null, dot: null, side: null };
          nodeRefs.current.set(video.id, Object.assign(entry, { [key]: el }));
        };
        return (
          <div
            key={video.id}
            ref={register("wrap")}
            className="absolute left-0 top-0 h-0 w-0"
            // Oculto hasta el primer cuadro, que lo coloca en su lugar.
            style={{ visibility: "hidden" }}
          >
            <button
              ref={register("dot")}
              type="button"
              aria-label={`Reproducir paso ${pad2(video.paso)}: ${video.titulo}`}
              onMouseEnter={() => setHoveredId(() => video.id)}
              onMouseLeave={() => setHoveredId((id) => (id === video.id ? null : id))}
              onFocus={() => setHoveredId(() => video.id)}
              onBlur={() => setHoveredId((id) => (id === video.id ? null : id))}
              onClick={() => onOpen(video.id)}
              className="pointer-events-auto absolute left-0 top-0 flex items-center justify-center overflow-hidden rounded-full border-2 bg-neutral-900 shadow-[0_0_0_6px_rgba(0,0,0,0.05)] transition-[width,height] duration-300 ease-out"
              style={{
                width: nodeSize,
                height: nodeSize,
                transform: "translate(-50%, -50%)",
                ...(isHovered ? { backgroundColor: "#0a0a0a", borderColor: "#0a0a0a" } : {}),
              }}
            >
              {isHovered && video.youtubeId && (
                <>
                  <img
                    src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                      <polygon points="8,5 19,12 8,19" fill="white" />
                    </svg>
                  </span>
                </>
              )}
            </button>

            {/* Número + título: texto suelto, sin recuadro. data-side lo
                decide cada cuadro: la etiqueta va hacia afuera de la figura. */}
            <div
              ref={register("side")}
              data-side="right"
              className="group/side absolute top-0 -translate-y-1/2 data-[side=left]:right-0 data-[side=right]:left-0"
              style={{ color: "rgb(30,30,30)" }}
            >
              {!isHovered ? (
                <p className="flex items-baseline gap-2 whitespace-nowrap font-sans text-[11.5px] font-light leading-none tracking-[0.01em] [text-shadow:0_0_3px_#fff,0_0_3px_#fff,0_0_2px_#fff] group-data-[side=left]/side:-translate-x-[12px] group-data-[side=left]/side:flex-row-reverse group-data-[side=right]/side:translate-x-[12px]">
                  <span className="font-mono text-[11px] font-medium" style={{ color: "var(--step-color, currentColor)" }}>{pad2(video.paso)}</span>
                  <span>{shortTitle(video.titulo, compact)}</span>
                </p>
              ) : (
                <div className="relative isolate w-60 max-w-[55vw] font-sans text-neutral-900 group-data-[side=left]/side:-translate-x-[54px] group-data-[side=right]/side:translate-x-[54px]">
                  {/* Eder: "al ampliarse la descripción del video, no se lee
                      tan bien... que se mantenga sin burbuja detrás mientras
                      no me haya posicionado sobre él, pero que al
                      posicionarme, se ponga detrás una burbuja en blur, sin
                      bordes definidos." Esta capa solo existe en esta rama
                      (la del hover) — el texto suelto de abajo (!isHovered)
                      sigue sin nada detrás. El borde "sin definir" no es un
                      recuadro con esquinas redondeadas: es un degradado
                      radial usado como máscara (mask-image), así el blur
                      (y el tinte blanco) se desvanecen gradualmente hacia
                      afuera en vez de cortar en un borde recto. -z-10 +
                      "isolate" en el contenedor: que quede detrás del texto
                      de esta tarjeta, pero sin colarse detrás del resto de
                      la página (isolate le crea su propio contexto de
                      apilamiento). */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-5 -z-10"
                    style={{
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      background:
                        "radial-gradient(ellipse at center, rgba(255,255,255,0.88) 40%, rgba(255,255,255,0) 100%)",
                      maskImage:
                        "radial-gradient(ellipse at center, black 40%, transparent 100%)",
                      WebkitMaskImage:
                        "radial-gradient(ellipse at center, black 40%, transparent 100%)",
                    }}
                  />
                  <p className="font-mono text-[10px] uppercase tracking-wide text-neutral-400">
                    Paso {pad2(video.paso)} · {video.programa}
                    {video.duracionMin > 0 ? ` · ${video.duracionMin} min` : ""}
                  </p>
                  <p className="mt-1 font-display text-sm font-semibold leading-snug">
                    {cleanTitle(video.titulo) || video.id}
                  </p>
                  {video.descripcion && (
                    <p className="mt-1 line-clamp-3 text-xs font-light leading-relaxed text-neutral-500">
                      {video.descripcion}
                    </p>
                  )}
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-neutral-400">
                    Clic para reproducir
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Componente principal --------------------------------------------------

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export default function WorkflowsPointCloud({ videos }: { videos: WorkflowVideo[] }) {
  const [hoveredId, setHoveredIdState] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const nodeRefs = useRef(new Map<string, NodeRefs>());
  const containerRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const ordered = useMemo(() => orderVideos(videos), [videos]);
  const targets = useMemo(() => layoutVideos(ordered), [ordered]);
  const topology = useMemo(() => {
    const points: Vec3[] = [...BACKGROUND_POINTS, ...ordered.map((v) => targets.get(v.id) as Vec3)];
    return buildTopology(points, ordered, BACKGROUND_POINTS.length);
  }, [ordered, targets]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setCompact(entry.contentRect.width < 640);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const setHoveredId = (updater: (id: string | null) => string | null) => setHoveredIdState(updater);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    pointer.current = {
      x: (event.clientX - rect.left) / rect.width - 0.5,
      y: (event.clientY - rect.top) / rect.height - 0.5,
    };
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        pointer.current = { x: 0, y: 0 };
        setHoveredIdState(null);
      }}
      className="relative h-[70vh] min-h-[560px] w-full overflow-hidden"
    >
      <Canvas
        frameloop={activeId ? "never" : "always"}
        dpr={[1, 1.75]}
        camera={{ fov: CAMERA_FOV, position: [0, 0, 12] }}
        // preserveDrawingBuffer: Eder: "al dar click a los videos salen
        // estas rayas al fondo antes de que se quiten" — al abrir el
        // reproductor, frameloop pasa a "never" (ver más abajo) para
        // pausar la nube detrás del modal. Por defecto WebGL puede
        // limpiar/descartar su buffer de dibujo justo después de
        // presentar un cuadro; si eso pasa en el mismo instante en que
        // se pausa, el `backdrop-filter: blur()` del modal (ver
        // VideoPlayerModal.tsx) termina muestreando un buffer a medio
        // limpiar — de ahí las rayas, que desaparecen apenas el
        // navegador logra una captura válida. preserveDrawingBuffer
        // conserva ese último cuadro completo, así el fondo que se ve
        // desenfocado detrás del video siempre es una imagen real y
        // estable, nunca basura de GPU a medio componer.
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        style={{ position: "absolute", inset: 0 }}
      >
        <Scene
          ordered={ordered}
          targets={targets}
          topology={topology}
          hoveredId={hoveredId}
          nodeRefs={nodeRefs}
          pointer={pointer}
          reducedMotion={reducedMotion}
        />
      </Canvas>

      <VideoNodes
        ordered={ordered}
        compact={compact}
        hoveredId={hoveredId}
        setHoveredId={setHoveredId}
        onOpen={(id) => {
          setHoveredIdState(null);
          setActiveId(id);
        }}
        nodeRefs={nodeRefs}
      />

      {videos.length === 0 && (
        <p className="pointer-events-none absolute inset-x-0 bottom-8 px-6 text-center font-sans text-sm text-neutral-400">
          Ningún video publicado coincide con estos filtros todavía.
        </p>
      )}

      {activeId && (
        <VideoPlayerModal
          videos={ordered}
          activeId={activeId}
          onChange={setActiveId}
          onClose={() => setActiveId(null)}
        />
      )}
    </div>
  );
}
