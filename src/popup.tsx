import { IconContext } from "@phosphor-icons/react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import Popup from "./pages/popup/popup"
import { startThemeSync } from "./lib/theme"
import { prepareData } from "./lib/hydrate"
async function start() {
  const stopData = await prepareData()
  if (import.meta.hot) import.meta.hot.dispose(stopData)
  const stop = startThemeSync()
  if (import.meta.hot) import.meta.hot.dispose(stop)
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
        <Popup />
      </IconContext.Provider>
    </StrictMode>
  )
}
void start().catch(() => {
  document.getElementById("root")!.textContent =
    "数据读取失败，请重新打开扩展。"
})
