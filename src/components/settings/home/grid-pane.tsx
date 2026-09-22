import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useTranslation } from "react-i18next"
import { settingsControlClassName } from "../shared/control-styles"

export default function GridPane() {
  const { t } = useTranslation()
  const gridMode = useHomeSettingsStore((state) => state.gridMode)
  const setGridMode = useHomeSettingsStore((state) => state.setGridMode)

  return (
    <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
      <div>
        <label htmlFor="home-grid-mode" className="text-sm">
          {t("settings.home.gridMode")}
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          {t(
            gridMode === "static"
              ? "settings.home.gridStaticHint"
              : "settings.home.gridDynamicHint"
          )}
        </p>
      </div>
      <Select
        value={gridMode}
        onValueChange={(value) => {
          if (value === "dynamic" || value === "static") setGridMode(value)
        }}
      >
        <SelectTrigger
          id="home-grid-mode"
          className={`w-full min-w-0 ${settingsControlClassName}`}
        >
          <SelectValue>
            {t(
              gridMode === "static"
                ? "settings.home.gridStatic"
                : "settings.home.gridDynamic"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dynamic">
            {t("settings.home.gridDynamic")}
          </SelectItem>
          <SelectItem value="static">
            {t("settings.home.gridStatic")}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
