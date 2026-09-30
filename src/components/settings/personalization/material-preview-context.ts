import { createContext, useContext } from "react"
import type { MaterialStyle } from "@/components/effects/material-surface"

export type MaterialPreviewStyle = MaterialStyle
export type StarTrailMode = "dynamic" | "static"

export type MaterialPreviewContextValue = {
  value: MaterialPreviewStyle
  setValue: (value: MaterialPreviewStyle) => void
  starTrailSpeed: number
  setStarTrailSpeed: (value: number) => void
  starTrailMode: StarTrailMode
  setStarTrailMode: (value: StarTrailMode) => void
}

export const MaterialPreviewContext =
  createContext<MaterialPreviewContextValue | null>(null)

export function useMaterialPreview() {
  const context = useContext(MaterialPreviewContext)
  if (!context)
    throw new Error("Material preview must be used inside its provider")
  return context
}
