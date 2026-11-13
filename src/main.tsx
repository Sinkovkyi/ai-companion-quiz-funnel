import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import raw from "../funnels/halcy.json";
import { funnelSchema } from "./engine/schema";
import { initAnalytics } from "./analytics";
import App from "./App";
import "./styles.css";

// Fails loudly in dev and in tests if the funnel JSON breaks the schema.
const funnel = funnelSchema.parse(raw);
initAnalytics(funnel.meta.version);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App funnel={funnel} />
  </StrictMode>,
);
