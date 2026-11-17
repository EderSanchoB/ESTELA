import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { WorkflowVideo } from "@/lib/cms";

/**
 * Reproductor en primer plano de la página Workflows.
 *
 * Eder: "quiero que al darle play al video, el mismo se ponga en primer
 * plano y que se pueda reproducir desde la página" — en vez de abrir
 * YouTube en otra pestaña, el video se reproduce aquí, centrado, con el
 * resto de la página atenuada y desenfocada detrás. Debajo van los datos
 * del paso y botones para avanzar o retroceder dentro del mismo flujo
 * sin cerrar el reproductor.
 *
 * Usa youtube-nocookie.com (el modo de privacidad mejorada de YouTube):
 * no guarda cookies del visitante hasta que le da play.
 *
 * Se cierra con el botón ×, la tecla Esc o un clic fuera del video; al
 * cerrar, el iframe se desmonta (el video se detiene) y el foco vuelve al
 * punto que lo abrió.
 */

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function cleanTitle(titulo: string): string {
  const parts = titulo.split(" | ");
  return (parts.length > 1 ? parts.slice(1).join(" | ") : titulo).trim();
}

export default function VideoPlayerModal({
  videos,
  activeId,
  onChange,
  onClose,
}: {
  /** Videos visibles, ya ordenados por flujo y paso. */
  videos: WorkflowVideo[];
  activeId: string;
  onChange: (id: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const video = videos.find((v) => v.id === activeId) ?? null;
  const flow = video
    ? videos.filter((v) => v.flujo === video.flujo).sort((a, b) => a.paso - b.paso)
    : [];
  const index = video ? flow.findIndex((v) => v.id === video.id) : -1;
  const prev = index > 0 ? flow[index - 1] : null;
  const next = index >= 0 && index < flow.length - 1 ? flow[index + 1] : null;

  // Foco, scroll de la página y teclado (Esc para cerrar, Tab atrapado
  // dentro del reproductor mientras está abierto).
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], iframe, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  if (!video) return null;

  const meta = [video.programa, video.nivel, video.perfilPc ? `Perfil ${video.perfilPc}` : ""]
    .filter(Boolean)
    .join(" · ");

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-neutral-950/70 p-4 backdrop-blur-md sm:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-player-title"
        className="relative my-auto w-full max-w-[960px]"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar video"
          className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:border-white hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
          {video.youtubeId ? (
            <iframe
              key={video.youtubeId}
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={video.titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center font-sans text-sm text-white/60">
              Este video todavía no tiene enlace de YouTube.
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-4 text-white sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/50">
              Paso {pad2(video.paso)}
              {flow.length > 1 ? ` de ${pad2(flow.length)}` : ""}
              {meta ? ` · ${meta}` : ""}
              {video.duracionMin > 0 ? ` · ${video.duracionMin} min` : ""}
            </p>
            <h2 id="video-player-title" className="mt-2 font-display text-xl font-semibold leading-snug sm:text-2xl">
              {cleanTitle(video.titulo)}
            </h2>
            {video.descripcion && (
              <p className="mt-2 max-w-2xl font-sans text-sm font-light leading-relaxed text-white/70">
                {video.descripcion}
              </p>
            )}
          </div>

          {(prev || next) && (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={!prev}
                onClick={() => prev && onChange(prev.id)}
                className="rounded-full border border-white/30 px-4 py-2 font-sans text-sm text-white transition-colors hover:border-white hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30"
              >
                ← Paso anterior
              </button>
              <button
                type="button"
                disabled={!next}
                onClick={() => next && onChange(next.id)}
                className="rounded-full border border-white/30 px-4 py-2 font-sans text-sm text-white transition-colors hover:border-white hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30"
              >
                Siguiente paso →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
