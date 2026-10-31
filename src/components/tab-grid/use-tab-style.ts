import { isSquareTabSize, type TabSize } from "@/lib/grid/types"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export function useTabStyle(size: TabSize = "small") {
  const square = isSquareTabSize(size)
  const appearance = useHomeSettingsStore((state) =>
    square ? state.squareTabAppearance : state.tabAppearance
  )
  const texture = useHomeSettingsStore((state) =>
    square ? state.squareTabTexture : state.tabTexture
  )
  const coverage = useHomeSettingsStore((state) =>
    square ? state.squareTabEffectCoverage : state.tabEffectCoverage
  )
  return { appearance, texture, coverage }
}
