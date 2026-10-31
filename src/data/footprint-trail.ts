// El "camino" de huellas que va apareciendo mientras se hace scroll por la
// página — una por sección que visita (ver FootprintTrail.tsx para el
// mecanismo que decide cuál está "activa"). Cada huella sabe en qué
// sección vive (`host`) y su posición es relativa al contenedor `relative`
// de ESA sección (no de la página completa): así cada una sigue
// respondiendo correctamente al layout responsive propio de su sección
// (centrado + `max-w-[1600px] px-6 sm:px-10`, el mismo en ambas), sin
// tener que recalcular nada si el viewport cambia de ancho.
export type FootprintHost = "casos" | "configura";

export type FootprintStep = {
  host: FootprintHost;
  top: number;
  left: number;
  width: number;
  rotate: number;
  mirror?: boolean;
};

// El tamaño/ángulo/espejado de cada huella salió de medir por píxeles los
// PNG de referencia que cargó Eder (huella.png como fuente, 152x324):
// centroide + PCA para el ángulo real hacia dónde apuntan los dedos, y el
// signo del desplazamiento lateral del grupo de dedos respecto al eje
// mayor para detectar espejado. Alternan mirror true/false — parecen
// pasos de pie derecho / pie izquierdo bajando la página. Quedan ~37px de
// ancho cada una.
export const FOOTPRINT_TRAIL: FootprintStep[] = [
  // huella-01 (dentro de "casos": CasosDeEstudio.tsx) — posición/tamaño
  // medidos por fuerza bruta (qué combinación espejo+rotate hace que
  // huella.png renderizado coincida mejor, por IoU de píxeles, con el
  // screenshot de referencia de Eder — 96% de superposición). El primer
  // intento con esos mismos 96% de match (134°) salió "al revés" en el
  // navegador: CSS aplica `rotate()` sobre el punto ANTES que
  // `scaleX(-1)` en `transform: scaleX(-1) rotate(Ndeg)` (el de más a la
  // derecha en la lista actúa primero), mientras que la búsqueda original
  // espejaba primero y rotaba después — produce la MISMA silueta final
  // pero con el signo del ángulo invertido (reflejar y luego rotar θ ≡
  // rotar -θ y luego reflejar). Por eso el valor real es 226 (= -134 mod
  // 360), no 134 — confirmado contra el screenshot real del sitio en vivo.
  { host: "casos", top: -18, left: -85, width: 37, rotate: 226, mirror: true },
  // huella-02 (en "casos") — mismo método (fuerza bruta + IoU) contra el
  // screenshot de Eder — sin espejo esta vez, así que no le aplica el
  // problema de orden mirror/rotate de la 01 (ese solo pasa cuando hay
  // scaleX(-1) de por medio); 96% de superposición con rotate:117, sin
  // mirror.
  { host: "casos", top: 195, left: 0, width: 37, rotate: 117 },
  // huella-03 (en "casos") — mismo método, esta vez con mirror — ya
  // aplicando el orden correcto (rotate antes que scaleX(-1), ver nota de
  // la 01) directo en la búsqueda, así que el ángulo de abajo ya está
  // listo para pegar en el CSS sin tener que invertirlo. ~95% de
  // superposición. Reposicionada luego a partir de un círculo rojo que
  // marcó Eder sobre un screenshot del sitio en vivo (mismo método que la
  // 04 más abajo): se midió por píxeles el centroide de la huella ya
  // desplegada y el del círculo (ambos vía umbral de color con PIL), y
  // ese delta (-47, -103 px CSS, escala ~1:1 en screenshots del sitio en
  // vivo) se sumó a la posición anterior (482, 184). Mismo
  // tamaño/ángulo/espejado, no cambiaron.
  { host: "casos", top: 379, left: 137, width: 37, rotate: 256, mirror: true },
  // huella-04 (en "casos") — reposicionada originalmente (mismo método
  // que la 03 de arriba) a partir de un círculo rojo que marcó Eder:
  // delta medido (-122, -91 px CSS) sumado a la posición anterior (667,
  // 360), dando (238, 576). Ya NO es la última huella de todo el
  // recorrido (ver huella-05 abajo) — el margen de salida corto que tenía
  // mientras lo fue (LAST_FOOTPRINT_EXIT_DISTANCE en FootprintTrail.tsx)
  // ahora le aplica automáticamente a quien sea la última del arreglo
  // completo, es decir a la 05.
  //
  // Eder, después: "la 04 ya debería haber desaparecido para este punto
  // de scrolleo" / "la 04 no desaparece en el momento de scrolleo que te
  // he dicho" — con top:576 el centro de la huella caía casi 200px
  // adentro del carrusel (el stage de las fichas empieza en top≈307 de
  // este mismo contenedor), es decir casi a la misma altura a la que
  // termina asentándose la ficha centrada en pantalla. Medido en vivo
  // (localhost, 1920px, huella-03 en top:379 → centro de documento
  // ≈1389px; huella-04 en top:576 → centro de documento ≈1586px): en el
  // momento exacto del screenshot de Eder (ficha "Headsight — HMD"
  // asentada, "Archivo Histórico" asomando arriba, "01/16 — C-01"
  // asomando abajo), el centro de la ventana ya estaba en ≈1605px — solo
  // 19px más allá del centro de la huella-04, muy por debajo del margen
  // de salida (FOOTPRINT_EXIT_DISTANCE=45), así que seguía técnicamente
  // "activa" por construcción. Ningún ajuste a los márgenes de
  // entrada/salida soluciona esto: el problema es que el punto marcado
  // de la huella coincide con el momento en que la ficha ya está
  // completamente asentada, no con una transición hacia ella.
  //
  // Corregido subiéndola (576 → 450, misma distancia horizontal/tamaño/
  // ángulo): a top:450 su centro de documento queda en ≈1460px, con
  // margen de salida hasta ≈1505px — unos 100px antes de que la ventana
  // llegue a los ≈1605px del screenshot de Eder, dejando tiempo de sobra
  // (incluyendo los 700ms de fundido) para que ya esté invisible cuando
  // la ficha está completamente a la vista. Sigue viniendo después de la
  // huella-03 (que queda en ≈1389px) en la secuencia de scroll.
  { host: "casos", top: 450, left: 238, width: 37, rotate: 126 },
  // huella-05 (dentro de "configura": ConfiguraGafas.tsx) — primera huella
  // fuera de Casos de Estudio, ubicada en el hueco entre esa sección y
  // "Configura tus gafas VR paso a paso". Eder marcó un círculo rojo
  // sobre un screenshot del sitio en vivo (localhost:3000/#instrucciones-vr,
  // viewport ≈1920px) sin mandar una huella de referencia para calcar
  // ángulo/espejado esta vez — solo el DÓNDE, no el CÓMO se ve. Posición:
  // centroide del círculo medido por umbral de color con PIL en (1152.5,
  // 586) px de pantalla; el left se calculó restando el borde izquierdo
  // real del contenedor `max-w-[1600px] px-6 sm:px-10` de ConfiguraGafas
  // en ese mismo screenshot (≈153px, medido por el inicio del texto "C"
  // de "Configura" menos su padding de 40px) y centrando la caja de 37px
  // sobre el círculo; el top se calculó igual mismo contra el tope del
  // texto del propio <h2> (≈y=700 en el screenshot, también medido por
  // pixel-threshold), restando además medio alto de línea/leading del
  // texto (~8px) para aproximar el tope real de la caja del <h2> antes de
  // centrar la huella sobre el círculo. rotate/mirror son un valor por
  // defecto razonable (continúa la alternancia true/false/true/false/true
  // de las 4 anteriores, con un ángulo parecido al de la 01/03, también
  // mirror) — a falta de una huella de referencia específica, como las
  // demás, puede necesitar ajuste si no calza con lo que Eder tenía en
  // mente. Ya NO es la última huella del recorrido completo (ver
  // huella-06 abajo) — el margen de salida corto le aplica ahora
  // automáticamente a quien sea la última del arreglo, es decir a la 06.
  {
    host: "configura",
    top: -146,
    left: 981,
    width: 37,
    rotate: 246,
    mirror: true,
  },
  // huella-06 (en "configura") — segunda huella de esta sección, a la
  // altura del visor 3D (a la derecha del modelo, cerca de donde empieza
  // "INSTRUCCIONES" más abajo). Mismo método que la 05: círculo rojo de
  // Eder sobre un nuevo screenshot del sitio en vivo, más abajo en el
  // scroll (mismo viewport ≈1920px — el texto del <h2> "Configura tus
  // gafas..." vuelve a arrancar en la misma columna x=193, confirmando
  // que es la misma ventana/escala que en la 05, solo que la página está
  // más scrolleada). Centroide del círculo medido por PIL en (1384.5,
  // 640). top/left relativos al mismo contenedor `relative` de
  // ConfiguraGafas.tsx (containerLeft≈153, containerTop≈561 — este
  // último de nuevo aproximado desde el tope del glyph del <h2>, ahora en
  // y=569, menos ~8px de leading), centrando la caja de 37px sobre el
  // círculo. rotate/mirror vuelven a ser un valor por defecto razonable
  // (alterna a mirror:false, continuando la secuencia true/false del
  // resto), a falta de una huella de referencia específica para esta.
  { host: "configura", top: 40, left: 1213, width: 37, rotate: 122 },
  // huella-07 (en "configura") — tercera huella de esta sección, a la
  // altura del selector de gafas ("Meta Quest / HTC Vive / Valve Index /
  // Visor de smartphone") y la imagen del visor, justo antes de la lista
  // de "INSTRUCCIONES" numeradas. Mismo método que la 05/06: círculo
  // rojo de Eder sobre un nuevo screenshot del sitio en vivo
  // (localhost:3000/#instrucciones-vr, viewport ≈1920px). Centroide del
  // círculo medido por umbral de color con PIL en (1174.2, 589.1).
  // top/left relativos al mismo contenedor `relative` de
  // ConfiguraGafas.tsx — esta vez medidos directo contra ESTE screenshot
  // en vez de reusar los de la 05/06 (containerLeft≈151, por el inicio
  // de la "C" de "Configura" en x≈191 menos los 40px de padding;
  // containerTop≈292, por el tope del glyph del <h2> en y≈300 menos ~8px
  // de leading — números casi idénticos a los de la 05/06, lo que
  // confirma que es la misma ventana/escala), centrando la caja de 37px
  // sobre el círculo. rotate/mirror son un valor por defecto razonable
  // (alterna a mirror:true, continuando la secuencia true/false/true de
  // la 05/06), a falta de una huella de referencia específica para esta.
  //
  // Eder: "esa huella en específico gírala 90 grados en sentido de las
  // manecillas del reloj". Con mirror:true el componente aplica
  // `transform: scaleX(-1) rotate(Ndeg)` — CSS compone de derecha a
  // izquierda, así que rotate(N) actúa PRIMERO (en el espacio sin
  // espejar) y scaleX(-1) después (ver nota de huella-01 más arriba); el
  // resultado neto es que, una vez espejada, la rotación que se VE en
  // pantalla es -N (no N) en la convención de CSS (positivo =
  // sentido horario). Por eso para girarla 90° en sentido horario EN
  // PANTALLA hay que RESTAR 90 a N, no sumarlo: 240 → 150.
  {
    host: "configura",
    top: 258,
    left: 1005,
    width: 37,
    rotate: 150,
    mirror: true,
  },
];

// Más allá de esta distancia (px) al centro de la ventana, ninguna huella
// cuenta como "la más cercana" — así no queda una encendida para siempre
// cuando se hizo scroll lejos de todas ellas. Tiene que ser mayor que la
// mitad del hueco más grande entre dos huellas consecutivas.
export const FOOTPRINT_MAX_DISTANCE = 480;

// Eder: "la idea es que las huellas ya no estén para cuando me encuentro
// en alguna de las secciones" — una huella no debe quedar pegada en
// pantalla mientras el usuario ya está leyendo contenido más abajo, aun
// si técnicamente sigue siendo "la más cercana" dentro de
// FOOTPRINT_MAX_DISTANCE. Por eso el margen de SALIDA (una vez que el
// centro de la ventana ya la dejó atrás) es mucho más corto que el de
// ENTRADA (FOOTPRINT_MAX_DISTANCE, que sigue amplio para que la huella
// tenga tiempo de aparecer con su transición de 700ms antes de llegar a
// su punto exacto) — y aplica a TODAS las huellas por igual, no solo a
// la última del recorrido (versión anterior: solo la última lo tenía,
// porque entonces era la única sin una siguiente que la "relevara"; pero
// eso dejaba a las demás con el mismo margen de salida amplio que el de
// entrada, y se quedaban pegadas más de la cuenta — exactamente el bug
// que ya se había corregido una vez para la que en ese momento era la
// última, y que había que corregir para todas, no solo para quien le
// tocara ser la última en cada momento).
export const FOOTPRINT_EXIT_DISTANCE = 45;
