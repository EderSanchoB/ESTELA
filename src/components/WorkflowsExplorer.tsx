import { useMemo, useState } from "react";
import { useWorkflowsData } from "@/hooks/useWorkflowsData";
import WorkflowsPointCloud from "./WorkflowsPointCloud";

/**
 * Contenido de la página "Workflows" (ver src/pages/Workflows.tsx) —
 * Eder pidió que esto NO fuera una sección más del home, sino su propia
 * página, accesible solo desde el link "Workflows" de la topbar y el
 * footer. Este componente ya no es un <section> con id de ancla ni
 * gating de fade (eso era para encajar en la coreografía de scroll del
 * home) — acá es simplemente el cuerpo de la página: título, filtros y
 * la visualización de puntos.
 *
 * Se lee en vivo de tu hoja "CMS" (tabs Tutoriales + Listas) cada vez
 * que alguien abre la página — no hay nada "quemado" acá: si editás un
 * video o agregás una fila en la hoja, la próxima vez que alguien cargue
 * la página de Workflows ya aparece. Ver src/lib/cms.ts para el detalle
 * de cómo se lee la hoja.
 */

const NIVEL_ORDER = ["Principiante", "Intermedio", "Avanzado"];

function sortNiveles(values: string[]): string[] {
  return [...values].sort((a, b) => {
    const ia = NIVEL_ORDER.indexOf(a);
    const ib = NIVEL_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

function toggleInSet(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[11px] uppercase tracking-wide text-neutral-400">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.has(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              aria-pressed={active}
              className={`rounded-full border px-4 py-1.5 font-sans text-sm transition-colors ${
                active
                  ? "border-black bg-black text-white"
                  : "border-line bg-white text-neutral-600 hover:border-neutral-400"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function WorkflowsExplorer() {
  const data = useWorkflowsData();
  const [programas, setProgramas] = useState<Set<string>>(new Set());
  const [niveles, setNiveles] = useState<Set<string>>(new Set());
  const [perfiles, setPerfiles] = useState<Set<string>>(new Set());

  const programaOptions = useMemo(() => {
    const values = new Set(data.listas?.programa ?? []);
    data.videos.forEach((v) => v.programa && values.add(v.programa));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [data.listas, data.videos]);

  const nivelOptions = useMemo(() => {
    const values = new Set(data.listas?.nivel ?? []);
    data.videos.forEach((v) => v.nivel && values.add(v.nivel));
    return sortNiveles(Array.from(values));
  }, [data.listas, data.videos]);

  const perfilOptions = useMemo(() => {
    const values = new Set(data.listas?.perfilPc ?? []);
    data.videos.forEach((v) => v.perfilPc && values.add(v.perfilPc));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [data.listas, data.videos]);

  const filteredVideos = useMemo(() => {
    return data.videos.filter((v) => {
      if (programas.size > 0 && !programas.has(v.programa)) return false;
      if (niveles.size > 0 && !niveles.has(v.nivel)) return false;
      if (perfiles.size > 0 && !perfiles.has(v.perfilPc)) return false;
      return true;
    });
  }, [data.videos, programas, niveles, perfiles]);

  const hasActiveFilters = programas.size > 0 || niveles.size > 0 || perfiles.size > 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-6 py-16 sm:px-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-neutral-900 sm:text-4xl">
            Workflows
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-sm text-neutral-500">
            Cada punto es un video real de un flujo de trabajo VR/XR. Filtrá por
            programa, nivel o perfil de PC para ver cómo cambian los recorridos —
            y pasá el mouse sobre un punto para verlo.
          </p>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setProgramas(new Set());
              setNiveles(new Set());
              setPerfiles(new Set());
            }}
            className="font-mono text-xs uppercase tracking-wide text-neutral-400 underline-offset-4 hover:text-neutral-700 hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:gap-10">
        <FilterGroup
          label="Programa"
          options={programaOptions}
          selected={programas}
          onToggle={(value) => setProgramas((prev) => toggleInSet(prev, value))}
        />
        <FilterGroup
          label="Nivel"
          options={nivelOptions}
          selected={niveles}
          onToggle={(value) => setNiveles((prev) => toggleInSet(prev, value))}
        />
        <FilterGroup
          label="Perfil de PC"
          options={perfilOptions}
          selected={perfiles}
          onToggle={(value) => setPerfiles((prev) => toggleInSet(prev, value))}
        />
      </div>

      <div className="mt-10">
        {data.status === "loading" && (
          <div className="flex h-[70vh] min-h-[560px] items-center justify-center">
            <p className="font-sans text-sm text-neutral-400">Cargando workflows…</p>
          </div>
        )}
        {data.status === "error" && (
          <div className="flex h-[70vh] min-h-[560px] flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="font-sans text-sm text-neutral-500">
              No se pudieron cargar los workflows en este momento.
            </p>
            <p className="font-sans text-xs text-neutral-400">
              Revisá tu conexión e intentá recargar la página.
            </p>
          </div>
        )}
        {data.status === "ready" && <WorkflowsPointCloud videos={filteredVideos} />}
      </div>
    </div>
  );
}
