import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createFolderItem } from "@/lib/grid/factory"
import type { TabEntry } from "@/lib/grid/types"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import SettingItem from "../shared/setting-item"
import { settingsControlClassName } from "../shared/control-styles"
import AppearancePreviewStage from "./appearance-preview-stage"
import AppearancePreviewTile from "./appearance-preview-tile"
import AppearanceResetButton from "./appearance-reset-button"
import ColorPicker from "@/components/ui/color-picker"
import { tileAppearanceLevels, tileBorderLevel } from "@/lib/tile-appearance"
import AppearanceTabs from "./appearance-tabs"
import TileBorderLevelField from "./tile-border-level-field"

const appIcon = `${import.meta.env.BASE_URL}icons/mark-128.png`

function previewTab(name: string): TabEntry {
  return {
    id: crypto.randomUUID(),
    name,
    url: "https://oh-my-tab.example",
    icon: appIcon,
  }
}

function buildPreview(t: (key: string) => string) {
  return [
    createFolderItem({
      name: t("settings.previews.favorites"),
      tabs: [
        previewTab("Oh My Tab"),
        previewTab(t("settings.previews.newTab")),
        previewTab(t("settings.previews.extensions")),
        previewTab(t("settings.previews.settings")),
      ],
    }),
    createFolderItem({
      name: t("settings.previews.readLater"),
      tabs: [
        previewTab(t("settings.previews.designDoc")),
        previewTab(t("settings.previews.bookmarks")),
        previewTab(t("settings.previews.history")),
        previewTab(t("settings.previews.downloads")),
      ],
    }),
  ] as const
}

const folderStyleKeys = {
  classic: "settings.folders.classic",
  noise: "settings.folders.noise",
  none: "settings.folders.none",
} as const

export default function FolderPane() {
  const { t } = useTranslation()
  const folderStyle = useHomeSettingsStore((state) => state.folderStyle)
  const setFolderStyle = useHomeSettingsStore((state) => state.setFolderStyle)
  const border = useHomeSettingsStore((state) => state.folderBorder)
  const setBorder = useHomeSettingsStore((state) => state.setFolderBorder)
  const shadow = useHomeSettingsStore((state) => state.folderShadow)
  const setShadow = useHomeSettingsStore((state) => state.setFolderShadow)
  const solidBackground = useHomeSettingsStore(
    (state) => state.backgroundType === "solid"
  )
  const resetStyle = useHomeSettingsStore((state) => state.resetFolderStyle)
  const [favorites, readLater] = useMemo(() => buildPreview(t), [t])
  const materialShadow =
    folderStyle === "none" && solidBackground ? "none" : "small"

  return (
    <>
      <AppearancePreviewStage>
        <AppearancePreviewTile
          item={favorites}
          className="top-[12%] left-[8%] -rotate-4"
        />
        <AppearancePreviewTile
          item={readLater}
          className="top-[36%] left-[40%] rotate-3"
        />
      </AppearancePreviewStage>
      <SettingItem label={t("settings.folders.texture")} htmlFor="folder-style">
        <Select
          value={folderStyle}
          onValueChange={(value) => {
            if (value === "classic" || value === "noise" || value === "none")
              setFolderStyle(value)
          }}
        >
          <SelectTrigger
            id="folder-style"
            className={`w-full ${settingsControlClassName}`}
          >
            <SelectValue>{t(folderStyleKeys[folderStyle])}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="classic">
              {t("settings.folders.classic")}
            </SelectItem>
            <SelectItem value="noise">{t("settings.folders.noise")}</SelectItem>
            <SelectItem value="none">{t("settings.folders.none")}</SelectItem>
          </SelectContent>
        </Select>
      </SettingItem>
      <TileBorderLevelField stroke={border} onChange={setBorder} />
      {tileBorderLevel(border) !== "none" && (
        <>
          <SettingItem
            label={t("settings.tabs.appearance.borderStyle")}
            htmlFor="folder-border-style"
          >
            <Select
              value={border.style}
              onValueChange={(value) => {
                if (
                  value === "solid" ||
                  value === "dashed" ||
                  value === "dotted"
                )
                  setBorder({ style: value })
              }}
            >
              <SelectTrigger
                id="folder-border-style"
                className={`w-full ${settingsControlClassName}`}
              >
                <SelectValue>
                  {t(`settings.folders.borderStyles.${border.style}`)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(["solid", "dashed", "dotted"] as const).map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`settings.folders.borderStyles.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingItem>
          <SettingItem
            label={t("settings.tabs.appearance.borderColor")}
            htmlFor="folder-border-color"
          >
            <div className="space-y-2">
              <Select
                value={border.color === "theme" ? "theme" : "custom"}
                onValueChange={(value) => {
                  if (value === "theme") setBorder({ color: "theme" })
                  else if (value === "custom" && border.color === "theme")
                    setBorder({ color: "#808080" })
                }}
              >
                <SelectTrigger
                  id="folder-border-color"
                  className={`w-full ${settingsControlClassName}`}
                >
                  <SelectValue>
                    {t(
                      border.color === "theme"
                        ? "settings.tabs.appearance.colorTheme"
                        : "settings.tabs.appearance.colorCustom"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="theme">
                    {t("settings.tabs.appearance.colorTheme")}
                  </SelectItem>
                  <SelectItem value="custom">
                    {t("settings.tabs.appearance.colorCustom")}
                  </SelectItem>
                </SelectContent>
              </Select>
              {border.color !== "theme" && (
                <ColorPicker
                  label={t("settings.tabs.appearance.borderColor")}
                  value={border.color}
                  className={settingsControlClassName}
                  onChange={(color) => setBorder({ color })}
                />
              )}
            </div>
          </SettingItem>
        </>
      )}
      <AppearanceTabs
        label={t("settings.uiAppearance.shadow")}
        options={tileAppearanceLevels}
        value={shadow === "auto" ? materialShadow : shadow}
        onChange={setShadow}
      />
      <AppearanceResetButton
        label={t("settings.folders.resetStyle")}
        onReset={resetStyle}
      />
    </>
  )
}
