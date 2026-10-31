import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import FootprintHost from "./FootprintTrail";
import { VR_HEADSETS } from "@/data/vr-headsets";
import { useViewportHeightScale } from "@/lib/useResponsiveScale";
// React.lazy por el mismo motivo que PointCloudModel.tsx en
// HeroBody.tsx: WebGL/three.js es pesado, mejor en su propio chunk.
const VRHeadsetModel = lazy(() => import("./VRHeadsetModel"));

/**
 * "Configura tus gafas VR paso a paso": selector de visor (pestañas) +
 * modelo 3D interactivo + instrucciones resumidas + enlace a la guía
 * detallada y al playlist oficial de YouTube. Vive después de Casos de
 * Estudio (ver page.tsx). El id="instrucciones-vr" es el mismo ancla que
 * ya usa el link "Instrucciones VR" del Nav.
 *
 * Eder: "la idea es que las oculus estén por default pero que al
 * presionar otras gafas cambia a todo lo relacionado con las otras".
 * Arrancamos con Meta Quest completo (ver src/data/vr-headsets.ts); las
 * otras tres pestañas ya cambian y responden al click, pero como todavía
 * no tienen modelo/instrucciones propias muestran un aviso de
 * "próximamente" en su lugar.
 */
export default function ConfiguraGafas({ visible }: { visible: boolean }) {
  const [activeId, setActiveId] = useState(VR_HEADSETS[0].id);
  const active =
    VR_HEADSETS.find((headset) => headset.id === activeId) ?? VR_HEADSETS[0];

  // Eder: "esto tambien pasa con la seccion de Instrucciones VR. Pero
  // como se ve en esta PC esta perfecto, solo quiero que cambie en el
  // caso de las laptops" -- mismo problema (y mismo designHeight=1100,
  // ver CasosDeEstudio.tsx) que el carrusel: el visor 3D de abajo tiene
  // alto fijo en px (h-80/sm:h-96) que no bajaba con el alto de la
  // ventana. Con esto, una pantalla de escritorio normal (>=1100px de
  // ventana) queda en escala 1 -- intacta -- y una laptop mas baja (la
  // de prueba de Eder, 911px) se reduce (~0.83).
  const modelHeightScale = useViewportHeightScale(1100);

  return (
    <section
      id="instrucciones-vr"
      // Mismo tratamiento de fade que CasosDeEstudio.tsx (translate +
      // opacity + blur), para que la sección se mantenga oculta hasta que
      // termine la intro.
      className={`border-t border-line bg-white py-20 transition-all duration-700 ease-out ${
        visible
          ? "translate-y-0 opacity-100 blur-none"
          : "pointer-events-none translate-y-3 opacity-0 blur-xl"
      }`}
      aria-hidden={!visible}
    >
      {/* relative: ahora también ancla el overlay de huellas (ver
          FootprintHost host="configura" justo abajo) — mismo contenedor
          `max-w-[1600px] px-6 sm:px-10` que usa CasosDeEstudio.tsx, así
          que la huella-05 (ver footprint-trail.ts) responde igual de
          bien a cambios de ancho de viewport que las anteriores. */}
      <div className="relative mx-auto w-full max-w-[1600px] px-6 sm:px-10">
        <FootprintHost host="configura" />

        <h2 className="font-display text-2xl font-semibold text-neutral-900">
          Configura tus gafas VR paso a paso
        </h2>

        {/* Selector de visor: mismo estilo de píldora que las burbujas de
            dimensiones en CasosDeEstudio.tsx, con una variante "activa"
            (fondo negro) que ahí no hacía falta. */}
        <div className="mt-5 flex flex-wrap gap-3">
          {VR_HEADSETS.map((headset) => {
            const isActive = headset.id === active.id;
            return (
              <button
                key={headset.id}
                type="button"
                onClick={() => setActiveId(headset.id)}
                aria-pressed={isActive}
                className={`rounded-full border px-4 py-1.5 font-sans text-sm transition-colors ${
                  isActive
                    ? "border-black bg-black text-white"
                    : "border-neutral-300 text-neutral-700 hover:border-neutral-400"
                }`}
              >
                {headset.etiqueta}
              </button>
            );
          })}
        </div>

        {/* Visor 3D: centrado, arriba de las instrucciones y debajo de la
            selección de gafas, tal como marcó Eder en su referencia.
            `key={active.id}` fuerza que VRHeadsetModel se desmonte y
            vuelva a montar al cambiar de pestaña, así la animación de
            nube→sólido se repite desde cero cada vez (en vez de quedar a
            mitad de camino si alguien cambia de visor mientras corre).
            El encuadre de la cámara volvió al método seguro (esfera
            envolvente completa — ver CAMERA_DISTANCE en
            VRHeadsetModel.tsx, probado y sin recortes), así que "más
            grande" ya no se consigue acercando la cámara (eso fue lo que
            se recortaba al girar) sino agrandando este contenedor —
            Eder: "de ese tamaño pero que no se corten... puedes hacer un
            poco hacia abajo el texto [si es necesario]". */}
        <div
          className="mx-auto mt-10 h-80 w-full max-w-lg sm:h-96 sm:max-w-2xl"
          // maxHeight (no height): deja las clases h-80/sm:h-96 de
          // arriba como el tamano normal, y solo lo recorta hacia abajo
          // en ventanas mas bajas que designHeight (ver
          // modelHeightScale arriba) -- en una pantalla de escritorio
          // normal 384*1=384, exactamente igual a sm:h-96, cero cambio.
          style={{ maxHeight: 384 * modelHeightScale }}
        >
          {active.modelUrl ? (
            <Suspense fallback={null}>
              <VRHeadsetModel
                key={active.id}
                modelUrl={active.modelUrl}
                className="h-full w-full"
              />
            </Suspense>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 px-6 text-center">
              <p className="font-display text-sm font-medium text-neutral-500">
                Modelo 3D próximamente
              </p>
              <p className="max-w-[240px] font-sans text-xs text-neutral-400">
                Estamos preparando la guía de {active.etiqueta}.
              </p>
            </div>
          )}
        </div>

        {/* Eder (pedido nuevo): ahora quiere que SUBA TODO el bloque
            encerrado en el recuadro rojo (texto + lista + video) como
            una sola unidad, hasta que la distancia entre las gafas y
            "Instrucciones" (línea roja) quede igual a la distancia
            entre "Instrucciones" y el primer paso de la lista (línea
            verde) — esto reemplaza el pedido anterior de mover SOLO el
            texto, así que ya no hace falta la posición absoluta: con
            todo el bloque moviéndose junto, basta con un margen normal.
            El contenedor del visor 3D (h-80/h-96) es una caja de alto
            fijo y el modelo no la llena entera, así que queda "aire"
            transparente debajo de las gafas que ningún ajuste de la
            cámara/encuadre debía tocar (eso fue lo que se recortaba
            antes); para cerrar ese aire sin arriesgar el encuadre del
            3D, se sube el bloque con un margen NEGATIVO en vez de
            agrandar o mover el visor.
            Eder: "ha desaparecido... lo has subido demasiado" — el
            primer valor (-200px) fue una sobrecorrección y tapó/perdió
            el texto. Sin poder ver la página en vivo, se retrocede a
            un valor mucho más conservador (-64px) para no repetir el
            error; probablemente haga falta otra vuelta con una nueva
            captura para afinarlo con precisión. */}
        <div className="-mt-16">
          <p className="text-center font-mono text-xs uppercase tracking-[0.2em] text-neutral-400">
            Instrucciones
          </p>

          {/* mt-12 (48px) reproduce la misma distancia "verde" que ya
              habia entre el texto y la lista (la que se usa como
              referencia para la linea roja de arriba). */}
          <div className="mt-12 grid gap-16 lg:grid-cols-[1fr_320px]">
            {/* Eder: "no quiero que las instrucciones esten en un recuadro" -
              se quita el borde que se les habia puesto; el espacio en
              blanco contra la tarjeta de YouTube ahora depende solo del
              gap del grid (se deja generoso, como en la referencia) y no
              de un recuadro propio. */}
            {/* Instrucciones resumidas + boton a la guia detallada */}
            <div>
              {active.pasos.length > 0 ? (
                <>
                  <ol className="flex flex-col gap-4">
                    {active.pasos.map((paso, index) => (
                      <li key={paso.titulo} className="flex gap-4">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-300 font-mono text-xs text-neutral-600">
                          {index + 1}
                        </span>
                        <p className="font-sans text-sm leading-relaxed text-neutral-700">
                          <strong className="font-medium text-neutral-900">
                            {paso.titulo}
                          </strong>{" "}
                          — {paso.texto}
                        </p>
                      </li>
                    ))}
                  </ol>

                  {active.guiaHref && (
                    <Link
                      to={active.guiaHref}
                      className="mt-6 inline-block rounded-full border border-neutral-300 px-5 py-2.5 font-display text-sm font-medium text-neutral-900 transition-colors hover:border-neutral-400"
                    >
                      Guía detallada
                    </Link>
                  )}
                </>
              ) : (
                <p className="font-sans text-sm text-neutral-500">
                  Las instrucciones para {active.etiqueta} se agregan pronto.
                </p>
              )}
            </div>

            {/* Enlace directo al playlist oficial de YouTube */}
            <div>
              {active.playlist ? (
                <a
                  href={active.playlist.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-2xl border border-line transition-colors hover:border-neutral-400"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
                    {/* <img> normal a propósito: es una miniatura pública
                      de YouTube (img.youtube.com), no un asset propio. */}
                    <img
                      src={`https://img.youtube.com/vi/${active.playlist.videoId}/hqdefault.jpg`}
                      alt={active.playlist.titulo}
                      loading="lazy"
                      className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                    />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 font-display text-base text-neutral-900 shadow-lg transition-transform group-hover:scale-105">
                        ▶
                      </span>
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-neutral-400">
                      YouTube ·{" "}
                      {active.playlist.url.includes("list=")
                        ? "Playlist"
                        : "Video"}
                    </p>
                    <p className="mt-1 font-display text-sm font-semibold text-neutral-900">
                      {active.playlist.titulo}
                    </p>
                    <p className="mt-1 font-sans text-xs text-neutral-500">
                      {active.playlist.subtitulo}
                    </p>
                  </div>
                </a>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-neutral-300 p-6 text-center">
                  <p className="font-sans text-xs text-neutral-400">
                    Playlist pendiente para {active.etiqueta}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
