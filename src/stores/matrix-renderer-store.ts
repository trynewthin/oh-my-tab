import { create } from "zustand"
export const useMatrixRendererStore = create<{
  renderer: "pixi" | "dom"
  setRenderer: (renderer: "pixi" | "dom") => void
}>((set) => ({
  renderer: new URLSearchParams(location.search).get("matrixRenderer") === "dom" ? "dom" : "pixi",
  setRenderer: (renderer) => set({ renderer }),
}))
