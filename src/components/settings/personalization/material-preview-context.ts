import { createContext, useContext } from "react"
import type { EffectStyle } from "@/stores/home-settings-store"

export type MaterialPreviewStyle = EffectStyle

export type MaterialPreviewContextValue = {
  value: MaterialPreviewStyle
  setValue: (value: MaterialPreviewStyle) => void
}

export const MaterialPreviewContext =
  createContext<MaterialPreviewContextValue | null>(null)

export function useMaterialPreview() {
  const context = useContext(MaterialPreviewContext)
  if (!context)
    throw new Error("Material preview must be used inside its provider")
  return context
}
