import { IconContext } from "@phosphor-icons/react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import { i18n } from "@/i18n"
import App from "./App.tsx"

import { startThemeSync } from "@/lib/theme"
import { startLanguageSync } from "@/lib/language"

import { prepareData } from "@/lib/hydrate"

async function start() {
  const stopData = await prepareData()
  if (import.meta.hot) import.meta.hot.dispose(stopData)
  const stopThemeSync = startThemeSync()
  if (import.meta.hot) import.meta.hot.dispose(stopThemeSync)
  const stopLanguageSync = startLanguageSync("newTab")
  if (import.meta.hot) import.meta.hot.dispose(stopLanguageSync)

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <IconContext.Provider
        value={{
          weight: "bold",
          size: "1em",
          color: "currentColor",
          mirrored: false,
        }}
      >
        <App />
      </IconContext.Provider>
    </StrictMode>
  )
}
void start().catch(() => {
  document.getElementById("root")!.textContent = i18n.t(
    "core.startup.newTabError"
  )
})
