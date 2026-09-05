import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import Popup from "./pages/popup/popup"
import { startThemeSync } from "./lib/theme"
const stop = startThemeSync()
if (import.meta.hot) import.meta.hot.dispose(stop)
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Popup />
  </StrictMode>
)
