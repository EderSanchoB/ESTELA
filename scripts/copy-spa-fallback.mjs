// GitHub Pages es un host de archivos estáticos: no sabe que "/tutoriales/
// meta-quest" es una ruta que React Router debe resolver en el navegador,
// así que si alguien recarga esa página (o entra directo con ese link),
// GitHub Pages busca un archivo real en esa ruta, no lo encuentra, y
// sirve su 404.html — a menos que ESE archivo sea una copia de nuestro
// index.html. Al ser la misma app, arranca igual, lee la URL completa que
// quedó en la barra de direcciones (sin cambios) y React Router la
// resuelve del lado del cliente como si nada. Por eso este script corre
// después de "vite build": copia dist/index.html a dist/404.html.
import { copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const from = join(root, "dist", "index.html");
const to = join(root, "dist", "404.html");

copyFileSync(from, to);
console.log("dist/404.html generado a partir de dist/index.html");
