/**
 * Eder, acá quedó el bug que viste en producción (la web se veía en
 * blanco en GitHub Pages: la consola marcaba 404 en los .glb/videos).
 *
 * Causa: Vite sabe agregar el prefijo "/ESTELA/" (el `base` de
 * vite.config.ts) en las rutas que él mismo procesa al construir el
 * sitio — los <script>/<link> de index.html, los `import` de código,
 * los `url()` dentro de archivos .css. Pero una ruta como
 * "/models/meta-quest.glb" escrita como texto plano dentro de un
 * componente (algo que vive en public/, no un import) es invisible
 * para Vite en ese momento: la ve recién cuando el navegador ya está
 * corriendo, y para entonces es demasiado tarde para que Vite la
 * ajuste. En local (`npm run dev`) el sitio vive en la raíz
 * ("http://localhost:5173/"), así que "/models/..." igual apuntaba al
 * lugar correcto por pura coincidencia — por eso no se notó hasta
 * publicar en GitHub Pages, donde el sitio vive en un subdirectorio
 * ("/ESTELA/").
 *
 * La solución: en vez de escribir la ruta directo, se envuelve con
 * esta función en todos los lugares que apuntan a algo dentro de
 * public/ (modelos .glb, imágenes, videos, el cursor). `BASE_URL` es
 * el mismo valor que ya configuramos en vite.config.ts — "/" en local,
 * "/ESTELA/" en GitHub Pages — así que la ruta queda correcta en los
 * dos casos sin tener que escribir el nombre del repo a mano en
 * ningún componente.
 */
export function withBase(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}
