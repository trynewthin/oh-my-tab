import { useTranslation } from "react-i18next"
import {
  tileAppearanceLevels,
  tileBorderLevel,
  tileBorderStroke,
} from "@/lib/tile-appearance"
import type { FolderBorder } from "@/lib/folder-border"
import AppearanceTabs from "./appearance-tabs"

type Stroke = Pick<FolderBorder, "style" | "width" | "opacity">

export default function TileBorderLevelField({
  stroke,
  onChange,
}: {
  stroke: Stroke
  onChange: (stroke: Stroke) => void
}) {
  const { t } = useTranslation()
  const level = tileBorderLevel(stroke)
  return (
    <AppearanceTabs
      label={t("settings.uiAppearance.border")}
      options={tileAppearanceLevels}
      value={level}
      hint={
        level === null ? t("settings.uiAppearance.legacyBorder") : undefined
      }
      onChange={(level) => onChange(tileBorderStroke(level, stroke.style))}
    />
  )
}
