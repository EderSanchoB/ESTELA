import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Lee el alias "@/*" directo de tsconfig.app.json — ya no hace falta el
  // plugin vite-tsconfig-paths (Vite 8 lo soporta nativo).
  resolve: {
    tsconfigPaths: true,
  },
  // GitHub Pages sirve el sitio en https://<usuario>.github.io/<repo>/ (no
  // en la raíz del dominio), así que todas las rutas a los archivos
  // (JS/CSS/imágenes) necesitan ese "/<repo>/" por delante. En desarrollo
  // local (npm run dev) no hace falta ninguno — por eso esto solo cambia
  // cuando VITE_BASE_PATH viene seteado desde afuera, que es justo lo que
  // hace el workflow de GitHub Actions (.github/workflows/deploy.yml),
  // calculándolo automáticamente a partir del nombre real del repositorio.
  base: process.env.VITE_BASE_PATH || "/",
});
