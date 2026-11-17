import { useEffect, useState } from "react";
import { fetchArchivoHistorico } from "@/lib/cms";
import type { CasoDeEstudio } from "@/data/casos-de-estudio";

type ArchivoHistoricoState =
  | { status: "loading"; casos: [] }
  | { status: "ready"; casos: CasoDeEstudio[] }
  | { status: "error"; casos: [] };

export function useArchivoHistoricoData(): ArchivoHistoricoState {
  const [state, setState] = useState<ArchivoHistoricoState>({
    status: "loading",
    casos: [],
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const casos = await fetchArchivoHistorico();
        if (!cancelled) setState({ status: "ready", casos });
      } catch (error) {
        console.error("No se pudo cargar el Archivo histórico de Estela:", error);
        if (!cancelled) setState({ status: "error", casos: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
