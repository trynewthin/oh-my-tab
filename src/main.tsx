import { IconContext } from "@phosphor-icons/react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"

import { startThemeSync } from "@/lib/theme"

import { prepareData } from "@/lib/hydrate"

async function start() {
  const stopData = await prepareData()
  if (import.meta.hot) import.meta.hot.dispose(stopData)
  const stopThemeSync = startThemeSync()
  if (import.meta.hot) import.meta.hot.dispose(stopThemeSync)

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
  document.getElementById("root")!.textContent =
    "数据读取失败，请检查浏览器存储权限后刷新页面。"
})
