import { Suspense, useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Mismo radio objetivo para cualquier visor que se cargue acá — así, sea
// cual sea el tamaño real del .glb (una Quest no es del mismo porte que
// un Vive), todos terminan ocupando el mismo espacio en el canvas.
const TARGET_RADIUS = 1.5;
const CAMERA_FOV = 32;

// Distancia de cámara calculada a partir de la ESFERA envolvente completa
// (no de un cilindro ni de una pose fija) — por diseño, una esfera se ve
// igual de cualquier ángulo, así que encuadrar según su radio garantiza
// que el modelo nunca se recorte sin importar cuánto lo gire quien esté
// explorándolo. A diferencia del encuadre en cilindro que se probó antes
// (más ajustado, pero con dos cotas — altura y ancho — tan parecidas
// entre sí que un pequeño error en cualquiera de las dos bastaba para
// recortar; eso fue justo lo que pasó dos veces), este es un límite
// EXACTO de la geometría (no una aproximación), así que un margen chico
// sigue siendo matemáticamente seguro:
//   margen 1 = la esfera toca el borde del frustum (ajuste exacto, cero
//              aire de sobra);
//   margen >1 = ese mismo aire de sobra, como fracción del radio.
// Eder: "verifica que mientras le dé vuelta al 3D NO SE CORTE POR NINGÚN
// LADO" — con 1.05 queda un 5% de margen real (no una aproximación que
// podría fallar por un error de cálculo), visiblemente más grande que el
// 1.22 anterior y aun así con margen de sobra para cualquier ángulo de
// giro. No llega a llenar por completo el recuadro que marcaste — para
// eso la cámara tendría que acercarse tanto que CUALQUIER margen de
// seguridad real desaparecería — así que preferí quedarme en un punto
// donde pueda garantizarlo con la fórmula, no solo con la esperanza de
// que el margen alcance.
const FIT_MARGIN = 1.05;
const CAMERA_DISTANCE =
  (TARGET_RADIUS / Math.sin(THREE.MathUtils.degToRad(CAMERA_FOV) / 2)) *
  FIT_MARGIN;

// Nube de puntos: mismo lenguaje visual que PointCloudModel.tsx (puntos
// oscuros, semitransparentes, sin depth-write para que se vean "brumosos"
// en los bordes) en vez de inventar un estilo aparte.
const POINT_COLOR = "#1a1a1a";
const POINT_SIZE = 0.016;
const POINT_OPACITY = 0.85;

// Secuencia de revelado en 4 etapas (segundos), contados desde que el
// visor ENTRA en el viewport (ver useInView más abajo) — no desde que el
// componente se monta: Eder pidió "que la animación de las gafas ocurra
// apenas yo pueda verlas scrolleando".
//
// 1. (0 → T_POINTS_START)   nada visible todavía — pausa breve antes de
//    empezar, para que el arranque no se sienta instantáneo.
// 2. (→ T_SHARPEN_START)    los puntos aparecen, pero desenfocados
//    ("se ven en blur los puntos").
// 3. (→ T_REVEAL_START)     el desenfoque se retira con los puntos ya
//    completos ("se aclaran los puntos").
// 4. (→ T_DONE)             crossfade de nube de puntos a sólido con
//    color ("se revelan las gafas").
const HIDDEN_DURATION = 0.2;
const POINTS_IN_DURATION = 0.6;
const SHARPEN_DURATION = 0.7;
const REVEAL_DURATION = 1.0;

const T_POINTS_START = HIDDEN_DURATION;
const T_SHARPEN_START = T_POINTS_START + POINTS_IN_DURATION;
const T_REVEAL_START = T_SHARPEN_START + SHARPEN_DURATION;
const T_DONE = T_REVEAL_START + REVEAL_DURATION;

// Desenfoque máximo (CSS filter, a nivel DOM) durante la etapa 2.
const BLUR_MAX = 14;

// Eder, segunda vuelta sobre el aviso de "esto es interactivo": ya no es
// un wiggle que va y vuelve — ahora es un giro lento, en una sola
// dirección (hacia la izquierda, ver ROTATE_ANGLE), que arranca "desde
// que se ven los puntos" (T_POINTS_START, el mismo instante en que
// empieza la etapa 2) y queda fijo en su posición final al terminar — no
// vuelve a 0. Tope en 45° ("pongamos ese tope a 45 grados"). Como
// ConfiguraGafas.tsx remonta VRHeadsetModel con key={active.id} al
// cambiar de visor, este mismo ciclo —reveal + giro— se repite solo con
// cada cambio, sin tener que detectarlo a mano acá.
const ROTATE_START = T_POINTS_START;
const ROTATE_DURATION = 2.6;
const ROTATE_ANGLE_DEG = 45;
// Negativo: con la cámara en +Z mirando hacia el origen, un rotation.y
// negativo gira la cara frontal del modelo hacia -X, que es la izquierda
// de quien mira la pantalla (positivo giraría hacia la derecha).
const ROTATE_ANGLE = -THREE.MathUtils.degToRad(ROTATE_ANGLE_DEG);

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

// Easing de salida (sin "overshoot"): arranca rápido y se frena hasta
// detenerse justo en 1 — así el giro se siente lento/pesado al final en
// vez de rebotar, y nunca pasa del ángulo objetivo.
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Observa cuándo el elemento referenciado entra en el viewport, una sola
 * vez (se desconecta tras el primer isIntersecting) — así la animación de
 * carga arranca "apenas se puedan ver" las gafas al scrollear, en vez de
 * dispararse de inmediato al montar el componente o al cambiar de
 * pestaña fuera de pantalla.
 */
function useInView() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  return { ref, inView };
}

function Headset({
  modelUrl,
  active,
  blurTargetRef,
}: {
  modelUrl: string;
  active: boolean;
  blurTargetRef: { current: HTMLDivElement | null };
}) {
  const { scene } = useGLTF(modelUrl);
  const startedAt = useRef<number | null>(null);
  const doneFading = useRef(false);
  const doneRotating = useRef(false);
  const groupRef = useRef<THREE.Group>(null);

  // Se arma una sola vez por modelo cargado: un grupo "sólido" (el mesh
  // original, con sus materiales ya clonados a transparent+opacity 0 para
  // poder animarlos) y un grupo "nube" clonado del mismo — cada Mesh del
  // clon se reemplaza EN SU LUGAR por un THREE.Points que usa la misma
  // geometría (mismas posiciones de vértice) y hereda el transform local
  // del nodo que reemplaza, así que ambos grupos quedan perfectamente
  // alineados sin tener que calcular ninguna matriz a mano.
  //
  // pointMaterials/solidMaterials salen del propio useMemo (no de un ref
  // acumulado aparte durante el recorrido) porque mutar un ref en render
  // — incluso dentro de useMemo — es justo lo que la regla
  // react-hooks/refs del linter marca como inseguro de cara al React
  // Compiler; useFrame abajo las recibe cerradas sobre el resultado ya
  // memoizado, no sobre un ref.
  const { solid, cloud, pointMaterials, solidMaterials } = useMemo(() => {
    const template = scene.clone(true);

    // Centrar + escalar según la ESFERA envolvente (no la caja) — ver la
    // nota de CAMERA_DISTANCE arriba sobre por qué importa que sea una
    // esfera acá y no una caja como en PointCloudModel.tsx.
    const box = new THREE.Box3().setFromObject(template);
    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    template.position.sub(center);
    const scale = TARGET_RADIUS / (sphere.radius || 1);
    template.scale.setScalar(scale);

    const solidMaterialList: THREE.Material[] = [];
    const solidGroup = template.clone(true);
    solidGroup.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      const clonedMaterials = materials.map((material) => {
        const clone = material.clone();
        clone.transparent = true;
        clone.opacity = 0;
        solidMaterialList.push(clone);
        return clone;
      });
      child.material = Array.isArray(child.material)
        ? clonedMaterials
        : clonedMaterials[0];
    });

    const pointMaterialList: THREE.PointsMaterial[] = [];
    const cloudGroup = template.clone(true);
    // Se recorre una copia de la lista de hijos porque el loop reemplaza
    // nodos del propio árbol que se está recorriendo.
    cloudGroup.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const material = new THREE.PointsMaterial({
        color: new THREE.Color(POINT_COLOR),
        size: POINT_SIZE,
        sizeAttenuation: true,
        transparent: true,
        // Arranca en 0: no debe verse nada hasta que useFrame — ya con
        // active=true — empiece a subir la opacidad en la etapa 2.
        opacity: 0,
        depthWrite: false,
      });
      pointMaterialList.push(material);
      const points = new THREE.Points(child.geometry, material);
      points.position.copy(child.position);
      points.quaternion.copy(child.quaternion);
      points.scale.copy(child.scale);
      child.parent?.add(points);
      child.parent?.remove(child);
    });

    return {
      solid: solidGroup,
      cloud: cloudGroup,
      pointMaterials: pointMaterialList,
      solidMaterials: solidMaterialList,
    };
  }, [scene]);

  useFrame((state) => {
    // Sin active (todavía fuera del viewport) no se anima nada — los
    // materiales se quedan en su opacidad inicial (0), es decir
    // invisibles, que es justo la etapa 1 ("no se ven"). Una vez termina
    // también el giro (ver más abajo) ya no hay nada más que animar en
    // este modelo, así que se deja de procesar frame por frame.
    if (!active || doneRotating.current) return;
    if (startedAt.current === null) startedAt.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startedAt.current;

    if (!doneFading.current) {
      let pointOpacity = 0;
      let solidOpacity = 0;
      let blurPx = BLUR_MAX;

      if (elapsed < T_POINTS_START) {
        // Etapa 1 — nada visible todavía.
        pointOpacity = 0;
        solidOpacity = 0;
        blurPx = BLUR_MAX;
      } else if (elapsed < T_SHARPEN_START) {
        // Etapa 2 — los puntos aparecen, desenfocados.
        const t = smoothstep(
          THREE.MathUtils.clamp(
            (elapsed - T_POINTS_START) / POINTS_IN_DURATION,
            0,
            1,
          ),
        );
        pointOpacity = POINT_OPACITY * t;
        solidOpacity = 0;
        blurPx = BLUR_MAX;
      } else if (elapsed < T_REVEAL_START) {
        // Etapa 3 — el desenfoque se retira, puntos ya completos y nítidos.
        const t = smoothstep(
          THREE.MathUtils.clamp(
            (elapsed - T_SHARPEN_START) / SHARPEN_DURATION,
            0,
            1,
          ),
        );
        pointOpacity = POINT_OPACITY;
        solidOpacity = 0;
        blurPx = BLUR_MAX * (1 - t);
      } else {
        // Etapa 4 — crossfade de nube de puntos a sólido con color.
        const t = smoothstep(
          THREE.MathUtils.clamp(
            (elapsed - T_REVEAL_START) / REVEAL_DURATION,
            0,
            1,
          ),
        );
        pointOpacity = POINT_OPACITY * (1 - t);
        solidOpacity = t;
        blurPx = 0;
        if (elapsed >= T_DONE) doneFading.current = true;
      }

      pointMaterials.forEach((material) => {
        material.opacity = pointOpacity;
      });
      solidMaterials.forEach((material) => {
        material.opacity = solidOpacity;
      });

      // El desenfoque se aplica a nivel DOM (CSS filter) sobre el div que
      // envuelve el <Canvas> — se muta el estilo directamente en vez de
      // pasar por estado de React, para no forzar un re-render en cada
      // frame de la animación.
      const target = blurTargetRef.current;
      if (target) {
        target.style.filter = blurPx > 0.01 ? `blur(${blurPx}px)` : "none";
      }
    }

    // Giro de aviso: arranca desde que se ven los puntos (ROTATE_START ==
    // T_POINTS_START), avanza lento y se detiene en su ángulo final sin
    // volver a 0 — ver la nota grande junto a ROTATE_START sobre por qué.
    if (elapsed >= ROTATE_START && groupRef.current) {
      const rotateElapsed = elapsed - ROTATE_START;
      if (rotateElapsed >= ROTATE_DURATION) {
        groupRef.current.rotation.y = ROTATE_ANGLE;
        doneRotating.current = true;
      } else {
        const p = easeOutCubic(
          THREE.MathUtils.clamp(rotateElapsed / ROTATE_DURATION, 0, 1),
        );
        groupRef.current.rotation.y = ROTATE_ANGLE * p;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={solid} />
      <primitive object={cloud} />
    </group>
  );
}

/**
 * Visor 3D para "Configura tus gafas VR paso a paso" (ver
 * ConfiguraGafas.tsx): carga un .glb y lo anima de nube de puntos (mismo
 * estilo que PointCloudModel.tsx, el modelo del edificio) a sólido con
 * color, en 4 etapas (invisible → puntos desenfocados → puntos nítidos →
 * sólido), mientras quien lo mira puede darle vueltas arrastrando con el
 * mouse o el dedo (OrbitControls, solo rotación horizontal — sin zoom ni
 * paneo, que no aportan nada acá y solo estorban en móvil).
 *
 * La animación arranca recién cuando el visor entra en el viewport (ver
 * useInView), no al montarse — así quien scrollea ve la secuencia
 * completa en vez de encontrarla ya a mitad de camino.
 *
 * A diferencia de PointCloudModel.tsx (que sigue el mouse de forma
 * pasiva), acá el giro lo controla directamente quien visita la página —
 * por eso, desde que se ven los puntos (ver ROTATE_START), el modelo gira
 * lento hacia la izquierda hasta un máximo de 45° y se queda fijo ahí, a
 * modo de pista de que es interactivo. Como el componente se remonta con
 * key={active.id} al cambiar de visor en ConfiguraGafas.tsx, todo este
 * ciclo —revelado + giro— se repite igual con cada cambio de gafas.
 */
export default function VRHeadsetModel({
  modelUrl,
  className,
}: {
  modelUrl: string;
  className?: string;
}) {
  const { ref: wrapperRef, inView } = useInView();

  return (
    <div
      ref={wrapperRef}
      className={`cursor-grab touch-none active:cursor-grabbing ${className ?? ""}`}
    >
      <Canvas
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, CAMERA_DISTANCE], fov: CAMERA_FOV }}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} />
        <directionalLight position={[-4, -2, -3]} intensity={0.4} />
        <Suspense fallback={null}>
          <Headset
            key={modelUrl}
            modelUrl={modelUrl}
            active={inView}
            blurTargetRef={wrapperRef}
          />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
          // Eder: "que el 3D solo se pueda girar hacia la derecha o hacia
          // la izquierda" — fijar min/maxPolarAngle al mismo valor (90°,
          // el plano horizontal de la cámara) bloquea la inclinación
          // vertical y deja libre solo el giro azimutal (horizontal).
          minPolarAngle={Math.PI / 2}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
