import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"

import { startThemeSync } from "@/lib/theme"

import { useTabGridStore } from "@/stores/tab-grid-store"
const syncGrid = (event: StorageEvent) => {
  if (event.key === "omt.tab-grid" || event.key === null)
    void useTabGridStore.persist.rehydrate()
}
window.addEventListener("storage", syncGrid)
if (import.meta.hot)
  import.meta.hot.dispose(() => window.removeEventListener("storage", syncGrid))

const stopThemeSync = startThemeSync()
if (import.meta.hot) import.meta.hot.dispose(stopThemeSync)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
