import { createContext, useContext } from "react"
import {
  uiAppearanceAttributes,
  type UiAppearanceOverrides,
} from "@/lib/ui-appearance"

export const UiAppearanceContext = createContext<
  UiAppearanceOverrides | undefined
>(undefined)

export function useUiAppearanceAttributes() {
  return uiAppearanceAttributes(useContext(UiAppearanceContext))
}
