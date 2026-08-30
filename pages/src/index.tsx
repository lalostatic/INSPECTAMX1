import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const DEMO = "https://lalostatic.github.io/INSPECTA-1.2/";
const CODE = "https://github.com/lalostatic/INSPECTAMX";

function App() {
  return (
    <main
      style={{
        fontFamily: "IBM Plex Sans, system-ui, sans-serif",
        background: "#f3f1ec",
        color: "#14202b",
        minHeight: "100vh",
        margin: 0,
      }}
    >
      <header
        style={{
          background: "#0e2433",
          color: "#f3f1ec",
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong style={{ letterSpacing: "0.16em" }}>INSPECTAMX</strong>
        <a href={CODE} style={{ color: "#8fd0d8" }}>
          Código
        </a>
      </header>
      <section style={{ padding: "64px 24px", maxWidth: 720 }}>
        <p style={{ color: "#1f8a96", letterSpacing: "0.18em", fontSize: 12 }}>
          PATIO · CONTENEDOR · CHASIS
        </p>
        <h1 style={{ fontSize: "clamp(2rem,6vw,3.4rem)", lineHeight: 1, margin: "8px 0 16px" }}>
          Inspección, taller y pintura en un solo lugar.
        </h1>
        <p style={{ maxWidth: 520, color: "#5b6b75" }}>
          El inspector toca el punto, toma la foto y cierra el folio. El día lo marca el
          ingreso al patio. Un patio por empresa. Sin alta pública.
        </p>
        <p style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
          <a
            href={DEMO}
            style={{
              background: "#1f8a96",
              color: "#fff",
              padding: "12px 18px",
              borderRadius: 6,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Demo visual
          </a>
          <a href="#flujo" style={{ padding: "12px 18px", color: "#0e2433" }}>
            Flujo del día
          </a>
        </p>
      </section>
      <section id="flujo" style={{ padding: "0 24px 64px", maxWidth: 720 }}>
        <h2>El día lo define lo que entra.</h2>
        <ol>
          <li>Ingreso de contenedores y chasis</li>
          <li>Inspección con mapa de puntos</li>
          <li>Taller M&amp;R (~12 / día)</li>
          <li>Pintura (5–7 / día)</li>
          <li>Cierre con folio y firma</li>
        </ol>
        <p style={{ color: "#5b6b75", fontSize: 14 }}>
          Esta app de Pages es el folleto. El patio con login vive en origin Node + Neon.
        </p>
      </section>
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("#root missing");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
