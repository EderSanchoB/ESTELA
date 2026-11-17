import { Helmet } from "react-helmet-async";
import CustomCursor from "@/components/CustomCursor";
import InteriorNav from "@/components/InteriorNav";
import SiteFooter from "@/components/SiteFooter";
import WorkflowsExplorer from "@/components/WorkflowsExplorer";

/**
 * Eder: "La page de workflows es totalmente aparte, no está en las
 * secciones del Home Page, solo se accesa por medio de 'Workflows' en
 * el topbar y el footer." — página propia con su propia ruta
 * ("/workflows", ver src/App.tsx), no una sección de Home.tsx.
 *
 * InteriorNav theme="light": a diferencia de las páginas de tutorial
 * (fondo oscuro, logo invertido), acá Eder pidió explícitamente "fondo
 * blanco" para la nube de puntos — ver el comentario grande en
 * InteriorNav.tsx sobre el nuevo prop `theme`.
 */
export default function Workflows() {
  return (
    <div className="min-h-screen bg-paper">
      <Helmet>
        <title>Workflows | ESTELA</title>
        <meta
          name="description"
          content="Explorá los flujos de trabajo VR/XR de Estela: cada punto es un video real, conectado en el orden de su recorrido."
        />
        <meta property="og:title" content="Workflows | ESTELA" />
        <meta
          property="og:description"
          content="Explorá los flujos de trabajo VR/XR de Estela: cada punto es un video real, conectado en el orden de su recorrido."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      <CustomCursor />
      <InteriorNav theme="light" />
      <WorkflowsExplorer />
      <SiteFooter />
    </div>
  );
}
