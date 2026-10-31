// (Migrado de Next.js: mismo comentario que InteriorNav.tsx — "use client"
// ya no aplica en esta SPA de Vite.)
import { Link } from "react-router-dom";
import { markIntroPlayed } from "@/lib/introFlag";
import FooterWave from "./FooterWave";

// Misma lista que NAV_LINKS en Nav.tsx (y los mismos anclas), más
// Contacto/Comité que todavía no tienen sección propia en la página — por
// ahora quedan como enlaces "#" decorativos, mismo tratamiento que el
// botón "Más opciones" del Nav (TODO(Eder) ahí también).
//
// Los anchors van prefijados con "/" (en vez de "#workflows" a secas)
// porque este footer, además de en home, ahora también vive en las
// páginas de tutorial (ver tutoriales/meta-quest/page.tsx) — un "#ancla"
// sin prefijo solo funciona si ya estás en home; con "/" funciona desde
// cualquier ruta y sigue funcionando igual estando ya en home (Next.js
// navega al mismo lugar). Eder: "quiero que en... el footpage, cuando
// haga click me lleve directamente a esta sección [Instrucciones VR]"
// — markIntroPlayed() en cada link (ver src/lib/introFlag.ts) asegura
// que ese salto nunca pase primero por la animación de intro del home.
const FOOTER_COLUMNS: Array<Array<{ label: string; href: string }>> = [
  [
    { label: "Workflows", href: "/#workflows" },
    { label: "Plantillas", href: "/#plantillas" },
  ],
  [
    { label: "Instrucciones VR", href: "/#instrucciones-vr" },
    { label: "FAQ", href: "/#faq" },
  ],
  [
    // TODO(Eder): sin sección propia todavía.
    { label: "Contacto", href: "/#" },
    { label: "Comité", href: "/#" },
  ],
];

export default function SiteFooter() {
  return (
    <footer className="bg-black text-white">
      <FooterWave />
      <div className="mx-auto w-full max-w-[1600px] px-6 py-16 sm:px-10">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-lg font-semibold text-white">
              ESTELA
            </p>
            <p className="mt-3 font-sans text-sm leading-relaxed text-white/55">
              Arquitectura en transición: del objeto material a la experiencia
              virtual.
              <br />
              Universidad de Costa Rica, Escuela de Arquitectura.
            </p>
          </div>

          <nav
            aria-label="Enlaces del pie de página"
            className="flex gap-12 font-sans text-sm text-white/70"
          >
            {FOOTER_COLUMNS.map((column) => (
              <div key={column[0].label} className="flex flex-col gap-3">
                {column.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={markIntroPlayed}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>

        <hr className="mt-12 border-white/10" />

        <p className="mt-6 font-mono text-xs text-white/35">
          © 2026 Eder Sancho · TFG Licenciatura en Arquitectura, UCR
        </p>
      </div>
    </footer>
  );
}
