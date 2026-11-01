import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { withBase } from "@/lib/withBase";

// This file is a pre-decimated bake (~112k of the source scan's 1.4M
// points, raw/un-normalized) rather than the full photogrammetry export —
// see the bake step recorded in project history if it ever needs
// re-generating from a fresh source scan. Baking it down client-side
// would mean shipping the full multi-MB source file just to throw away
// 92% of it after download.
const MODEL_URL = withBase("/models/arq-nube-puntos.glb");

// How far the model turns to follow the cursor (radians). Safe to push
// fairly far: framing below is based on a bounding *sphere*, so it can't
// clip regardless of rotation.
const MAX_YAW = 0.55;
const MAX_PITCH = 0.22;
// Lower = lazier / smoother follow, higher = snappier.
const DAMPING = 0.07;

// TARGET_MAX_DIM controls how much of the canvas the model fills (bigger
// number = bigger model). It was raised from 2.4 to 3.6 to make the model
// noticeably larger without clipping: rather than assume the worst case
// across a full 360° spin (which is what the old, more conservative 2.4
// value was guarding against), this was checked directly by sampling the
// model's actual projected screen-space extent across the real range the
// mouse-follow below ever swings through (BASE_YAW ± MAX_YAW, ±MAX_PITCH)
// — at 3.6 the farthest point still lands at ~88% of the way to the
// canvas edge, so there's a real margin left, not a hairline fit. Camera
// distance/fov are otherwise unchanged.
const TARGET_MAX_DIM = 3.6;
const CAMERA_DISTANCE = 8;
const CAMERA_FOV = 36;

// This scan isn't captured front-on — a yaw of 0 shows it almost edge-on.
// -45° was picked (by test-rendering several angles) as the resting pose
// that reads best: the zig-zag exterior stairs, the front facade, and the
// roofline are all visible at once. The mouse-follow below oscillates
// around this, it doesn't replace it.
const BASE_YAW = -Math.PI / 4;

// Point rendering tuning — also picked by test-rendering candidates. This
// scan has ~112k points crammed into a ~1-unit-ish bounding box, so even a
// small size reads as a dense, legible cloud rather than a sparse scatter;
// slight transparency (plus disabling depth-write) softens overlaps into a
// hazy "cloud" edge instead of a hard, flat silhouette.
const POINT_SIZE = 0.012;
const POINT_COLOR = "#1a1a1a";
const POINT_OPACITY = 0.88;

// Rango de inclinación del celular (grados) que se mapea al -1..1 que el
// render loop espera — mismo rango de entrada que antes daba el mouse al
// recorrer toda la pantalla. `beta` (adelante/atrás) descansa alrededor
// de ~50° cuando alguien sostiene el teléfono de forma natural para
// mirarlo (no en 0°, que sería el teléfono plano boca arriba), así que
// ese es el "centro" sobre el que se mide el swing, no el 0 crudo del
// sensor.
const ORIENTATION_RESTING_BETA = 50;
const ORIENTATION_BETA_RANGE = 35;
const ORIENTATION_GAMMA_RANGE = 35;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Tracks the mouse (desktop) or el giroscopio del celular (táctil) como
 * un par normalizado -1..1, escrito en un ref para que el render loop lo
 * lea cada frame sin forzar un re-render de React.
 *
 * `(pointer: coarse)` es la señal estándar de "el dispositivo primario
 * es un dedo, no un mouse" — a diferencia de sniffear el user-agent,
 * también responde bien al modo de emulación de dispositivo de
 * DevTools. En esos dispositivos no llega pointermove de forma continua
 * (solo mientras se toca la pantalla), así que seguir el mouse ahí
 * dejaría el modelo quieto en su pose de reposo todo el tiempo — de ahí
 * el giroscopio como reemplazo, no como añadido. */
function useNormalizedPointer() {
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const isTouchPrimary = window.matchMedia("(pointer: coarse)").matches;

    if (!isTouchPrimary) {
      const handleMove = (event: PointerEvent) => {
        pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
      };
      window.addEventListener("pointermove", handleMove, { passive: true });
      return () => window.removeEventListener("pointermove", handleMove);
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma == null || event.beta == null) return;
      // gamma: inclinación izquierda/derecha (-90..90). beta: adelante/
      // atrás (-180..180) — ver las constantes de arriba para el porqué
      // del offset.
      pointer.current.x = clamp(event.gamma / ORIENTATION_GAMMA_RANGE, -1, 1);
      pointer.current.y = clamp(
        (event.beta - ORIENTATION_RESTING_BETA) / ORIENTATION_BETA_RANGE,
        -1,
        1,
      );
    };

    // iOS 13+ exige pedir permiso explícito para leer sensores de
    // movimiento/orientación, y esa llamada solo funciona disparada
    // desde un gesto real del visitante — no se puede pedir sola al
    // cargar la página. Por eso queda enganchada al primer toque en
    // cualquier parte de la página en vez de mostrar un botón aparte.
    // Android (y el resto) no tiene ese gate: ahí se engancha directo.
    const DeviceOrientationEventWithPermission =
      window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">;
      };

    if (
      typeof DeviceOrientationEventWithPermission?.requestPermission ===
      "function"
    ) {
      const requestOnFirstTouch = () => {
        DeviceOrientationEventWithPermission.requestPermission!()
          .then((state) => {
            if (state === "granted") {
              window.addEventListener("deviceorientation", handleOrientation);
            }
          })
          .catch(() => {
            // Permiso denegado o API no disponible pese al chequeo: el
            // modelo simplemente se queda en su pose de reposo, igual
            // que si nunca se hubiera tocado la pantalla.
          });
      };
      window.addEventListener("touchend", requestOnFirstTouch, {
        once: true,
      });
      return () => {
        window.removeEventListener("touchend", requestOnFirstTouch);
        window.removeEventListener("deviceorientation", handleOrientation);
      };
    }

    window.addEventListener("deviceorientation", handleOrientation);
    return () =>
      window.removeEventListener("deviceorientation", handleOrientation);
  }, []);

  return pointer;
}

function PointCloud({
  pointer,
}: {
  pointer: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  // Recenter + normalize scale once per loaded model so it always sits in
  // the middle of the canvas regardless of how it was authored/exported.
  const model = useMemo(() => {
    const cloned = scene.clone(true);

    // This is a real THREE.Points cloud (mode 0 in the source glTF) — give
    // every points object the same small, slightly translucent dot
    // material (see the tuning constants above) instead of whatever
    // material the export shipped with.
    cloned.traverse((child) => {
      if (child instanceof THREE.Points) {
        child.material = new THREE.PointsMaterial({
          color: new THREE.Color(POINT_COLOR),
          size: POINT_SIZE,
          sizeAttenuation: true,
          transparent: true,
          opacity: POINT_OPACITY,
          depthWrite: false,
        });
      }
    });

    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    cloned.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    cloned.scale.setScalar(TARGET_MAX_DIM / maxDim);

    return cloned;
  }, [scene]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const targetYaw = BASE_YAW + pointer.current.x * MAX_YAW;
    // Negated: a *positive* rotation.x tips the model's top toward the
    // camera (it "nods forward"), which reads on screen as the top moving
    // down — the opposite of "mouse moves up, model follows up". Flipping
    // the sign here makes the model's top rise to meet an upward mouse
    // move and dip for a downward one, matching the intended feel.
    const targetPitch = -pointer.current.y * MAX_PITCH;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetYaw, DAMPING);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetPitch, DAMPING);
  });

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
}

export default function PointCloudModel({
  className,
}: {
  className?: string;
}) {
  const pointer = useNormalizedPointer();

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, CAMERA_DISTANCE], fov: CAMERA_FOV }}
        style={{ pointerEvents: "none" }}
      >
        {/* No lights: PointsMaterial is unlit (it ignores scene lights
            entirely), so the ambient/directional rig the old solid-mesh
            version needed here has nothing left to do. */}
        <Suspense fallback={null}>
          <PointCloud pointer={pointer} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
