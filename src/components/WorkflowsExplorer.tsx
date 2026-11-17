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
 *
 * Lógica de filtros — Eder, textual: "quiero que Arkio esté por default
 * cuando entramos, pero que si yo desmarco Arkio, entonces también se
 * desaparezcan los puntos... Ahora, cuando yo [selecciono] perfil C, sí
 * deberían salir los que son de perfil C, pero... si yo presiono los
 * perfiles B o A, deberían también incluir los videos básicos, no
 * eliminarlos... de igual manera, para alguien avanzado, también
 * deberían aparecer los tutoriales que son básicos... es como algo
 * progresivo."
 *
 * Eso son DOS reglas distintas:
 *  1. Programa: deja de ser "sin selección = se ven todos" — ahora la
 *     selección manda siempre, de modo que desmarcar el único programa
 *     que hay (Arkio) de verdad oculta sus videos, en vez de volver a
 *     "ninguna selección = todo visible" (que es lo que pasaba antes:
 *     con Arkio como único programa cargado, desmarcarlo no se notaba).
 *     Por default arranca con Arkio marcado.
 *  2. Nivel y Perfil de PC SÍ siguen siendo "sin selección = se ven
 *     todos", pero cuando hay algo seleccionado, ya no es una selección
 *     exacta: C/B/A y Principiante/Intermedio/Avanzado tienen un orden
 *     de básico → avanzado (ver PERFIL_ORDER/NIVEL_ORDER), y marcar un
 *     nivel muestra ESE nivel más todos los que estén por debajo
 *     (más básicos) — así alguien en Perfil A o Nivel Avanzado puede
 *     seguir viendo los tutoriales básicos que tal vez quiera repasar.
 */

const NIVEL_ORDER = ["Principiante", "Intermedio", "Avanzado"];
// De más básico a más avanzado — Perfil C es equipo sin GPU dedicada,
// Perfil A es equipo alto (ver claude/logica-filtros-workflows.md).
const PERFIL_ORDER = ["C", "B", "A"];
const DEFAULT_PROGRAMAS = ["Arkio"];

function sortByOrder(order: string[], values: string[]): string[] {
  return [...values].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
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

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

/**
 * Regla "progresiva" de Nivel/Perfil de PC: sin nada seleccionado, pasa
 * cualquier valor (sin filtro). Con algo seleccionado, pasa si su rango
 * es menor o igual que el rango MÁS ALTO seleccionado — así seleccionar
 * un nivel avanzado arrastra automáticamente todo lo básico debajo,
 * sin tener que marcarlo también a mano.
 */
function passesProgressive(order: string[], selected: Set<string>, value: string): boolean {
  if (selected.size === 0) return true;
  const valueRank = order.indexOf(value);
  if (valueRank === -1) return false;
  let maxSelectedRank = -1;
  for (const s of selected) {
    const rank = order.indexOf(s);
    if (rank > maxSelectedRank) maxSelectedRank = rank;
  }
  return valueRank <= maxSelectedRank;
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
  const [programas, setProgramas] = useState<Set<string>>(() => new Set(DEFAULT_PROGRAMAS));
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
    return sortByOrder(NIVEL_ORDER, Array.from(values));
  }, [data.listas, data.videos]);

  const perfilOptions = useMemo(() => {
    const values = new Set(data.listas?.perfilPc ?? []);
    data.videos.forEach((v) => v.perfilPc && values.add(v.perfilPc));
    return sortByOrder(PERFIL_ORDER, Array.from(values));
  }, [data.listas, data.videos]);

  const filteredVideos = useMemo(() => {
    return data.videos.filter((v) => {
      // Programa: la selección manda siempre (sin el escape "nada
      // marcado = se ven todos" que tienen Nivel/Perfil más abajo) —
      // así desmarcar Arkio de verdad lo oculta.
      if (!programas.has(v.programa)) return false;
      if (!passesProgressive(NIVEL_ORDER, niveles, v.nivel)) return false;
      if (!passesProgressive(PERFIL_ORDER, perfiles, v.perfilPc)) return false;
      return true;
    });
  }, [data.videos, programas, niveles, perfiles]);

  const hasActiveFilters =
    !setsEqual(programas, new Set(DEFAULT_PROGRAMAS)) || niveles.size > 0 || perfiles.size > 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-6 py-16 sm:px-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-neutral-900 sm:text-4xl">
            Workflows
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-sm text-neutral-500">
            Cada punto numerado es un video real de un flujo de trabajo VR/XR,
            conectado en el orden de su recorrido. Filtrá por programa, nivel o
            perfil de PC, pasá el mouse sobre un punto para ver de qué trata y
            hacé clic para reproducirlo aquí mismo.
          </p>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setProgramas(new Set(DEFAULT_PROGRAMAS));
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
