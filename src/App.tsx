import { HelmetProvider, Helmet } from "react-helmet-async";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import MetaQuest from "@/pages/tutoriales/MetaQuest";
import HtcVive from "@/pages/tutoriales/HtcVive";
import ValveIndex from "@/pages/tutoriales/ValveIndex";
import Smartphone from "@/pages/tutoriales/Smartphone";

/**
 * Antes vivía en src/app/layout.tsx (Next.js App Router): ahí se cargaban
 * las 3 tipografías con next/font y se definía la metadata por defecto del
 * sitio. En esta versión Vite:
 *  - Las tipografías ya se cargan en src/index.css (Fontsource) y las
 *    clases base de <html>/<body> quedan fijas en index.html, porque son
 *    las mismas siempre — no hace falta un componente para eso.
 *  - El <Helmet> de acá abajo es el título/descripción por defecto del
 *    sitio (lo que antes era `export const metadata` en layout.tsx):
 *    cualquier página puede poner su propio <Helmet> (ver las 4 páginas de
 *    tutoriales) para sobreescribirlo — react-helmet-async se queda con el
 *    más específico, igual que hacía Next con layout vs. page.
 */
export default function App() {
  return (
    <HelmetProvider>
      <Helmet>
        <title>ESTELA — VR/XR en talleres de arquitectura</title>
        <meta
          name="description"
          content="Plataforma para acompañar, documentar y evaluar el uso de herramientas inmersivas (VR/XR) en talleres de diseño arquitectónico."
        />
        <meta
          property="og:title"
          content="ESTELA — VR/XR en talleres de arquitectura"
        />
        <meta
          property="og:description"
          content="Plataforma para acompañar, documentar y evaluar el uso de herramientas inmersivas (VR/XR) en talleres de diseño arquitectónico."
        />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* basename = import.meta.env.BASE_URL: Vite expone ahí el mismo
          valor que se le dé a `base` en vite.config.ts (ver el comentario
          de ese archivo) — "/" en local, "/<repo>/" en GitHub Pages. Sin
          esto, un link interno a "/" terminaría apuntando a la raíz del
          dominio (usuario.github.io) en vez de a la raíz del sitio
          (usuario.github.io/<repo>/). */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tutoriales/meta-quest" element={<MetaQuest />} />
          <Route path="/tutoriales/htc-vive" element={<HtcVive />} />
          <Route path="/tutoriales/valve-index" element={<ValveIndex />} />
          <Route path="/tutoriales/smartphone" element={<Smartphone />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}
