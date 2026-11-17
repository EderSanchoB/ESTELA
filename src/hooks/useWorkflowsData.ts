import { useEffect, useState } from "react";
import {
  fetchListas,
  fetchTutoriales,
  type ListasOptions,
  type WorkflowVideo,
} from "@/lib/cms";

type WorkflowsDataState =
  | { status: "loading"; videos: []; listas: null }
  | { status: "ready"; videos: WorkflowVideo[]; listas: ListasOptions }
  | { status: "error"; videos: []; listas: null };

/**
 * Pide los videos y las listas de filtro a la hoja de Google Sheets (ver
 * src/lib/cms.ts) una vez, al montar esta sección. Si falla (sin
 * internet, la hoja cambió de permisos, etc.) no rompe el resto de la
 * página — la sección de Workflows simplemente muestra un aviso en vez
 * de la nube de puntos (ver WorkflowsExplorer.tsx).
 */
export function useWorkflowsData(): WorkflowsDataState {
  const [state, setState] = useState<WorkflowsDataState>({
    status: "loading",
    videos: [],
    listas: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [videos, listas] = await Promise.all([
          fetchTutoriales(),
          fetchListas(),
        ]);
        if (!cancelled) setState({ status: "ready", videos, listas });
      } catch (error) {
        console.error("No se pudo cargar el CMS de Estela (Workflows):", error);
        if (!cancelled) setState({ status: "error", videos: [], listas: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
