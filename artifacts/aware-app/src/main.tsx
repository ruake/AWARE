import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./_group.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Fatal: #root element not found in the DOM.");
createRoot(rootEl).render(<App />);
