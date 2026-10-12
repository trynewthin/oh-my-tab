import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GRID_COMPONENT_COLUMNS,
  GRID_SCALE_STEP,
  isGridComponentColumnCount,
  MAX_GRID_SCALE,
  MIN_GRID_SCALE,
} from "@/lib/grid/grid-layout"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useTranslation } from "react-i18next"
import SettingItem from "../shared/setting-item"
import {
  settingsControlClassName,
  settingsControlSurface,
} from "../shared/control-styles"

export default function GridPane() {
  const { t } = useTranslation()
  const wideGridColumns = useHomeSettingsStore((state) => state.wideGridColumns)
  const narrowGridColumns = useHomeSettingsStore(
    (state) => state.narrowGridColumns
  )
  const setWideGridColumns = useHomeSettingsStore(
    (state) => state.setWideGridColumns
  )
  const setNarrowGridColumns = useHomeSettingsStore(
    (state) => state.setNarrowGridColumns
  )
  const gridScale = useHomeSettingsStore((state) => state.gridScale)
  const setGridScale = useHomeSettingsStore((state) => state.setGridScale)
  const settings = [
    {
      id: "home-grid-wide-columns",
      label: t("settings.home.gridWideColumns"),
      hint: t("settings.home.gridWideColumnsHint"),
      value: wideGridColumns,
      options: GRID_COMPONENT_COLUMNS,
      setValue: setWideGridColumns,
    },
    {
      id: "home-grid-narrow-columns",
      label: t("settings.home.gridNarrowColumns"),
      hint: t("settings.home.gridNarrowColumnsHint"),
      value: narrowGridColumns,
      options: GRID_COMPONENT_COLUMNS.filter(
        (columns) => columns <= wideGridColumns
      ),
      setValue: setNarrowGridColumns,
    },
  ] as const

  return (
    <div className="space-y-4">
      <div className="border-t" aria-hidden="true" />
      <SettingItem
        label={t("settings.home.gridScale")}
        htmlFor="home-grid-scale"
        description={t("settings.home.gridScaleHint")}
      >
        <div
          className={`flex h-8 min-w-0 items-center gap-2 rounded-2xl px-3 ${settingsControlSurface}`}
        >
          <input
            id="home-grid-scale"
            type="range"
            min={MIN_GRID_SCALE}
            max={MAX_GRID_SCALE}
            step={GRID_SCALE_STEP}
            value={gridScale}
            onChange={(event) => setGridScale(Number(event.target.value))}
            className="min-w-0 flex-1"
          />
          <output
            htmlFor="home-grid-scale"
            className="w-10 text-right text-xs tabular-nums"
          >
            {Math.round(gridScale * 100)}%
          </output>
        </div>
      </SettingItem>
      {settings.map((setting) => (
        <SettingItem
          key={setting.id}
          label={setting.label}
          htmlFor={setting.id}
          description={setting.hint}
        >
          <Select
            value={String(setting.value)}
            onValueChange={(value) => {
              const columns = Number(value)
              if (isGridComponentColumnCount(columns)) setting.setValue(columns)
            }}
          >
            <SelectTrigger
              id={setting.id}
              className={`w-full min-w-0 ${settingsControlClassName}`}
            >
              <SelectValue>
                {t("settings.home.gridColumns", {
                  count: setting.value,
                })}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {setting.options.map((columns) => (
                <SelectItem key={columns} value={String(columns)}>
                  {t("settings.home.gridColumns", { count: columns })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingItem>
      ))}
    </div>
  )
}
