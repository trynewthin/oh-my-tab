import { useLayoutEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createFolderItem } from "@/lib/grid/factory"
import type { FolderItem, GridItem, TabEntry } from "@/lib/grid/types"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import SettingItem from "../shared/setting-item"
import { settingsControlClassName } from "../shared/control-styles"
import ScaledGridPreview from "./scaled-grid-preview"
import SettingRange from "../shared/setting-range"
import AppearanceResetButton from "./appearance-reset-button"
import ColorPicker from "@/components/ui/color-picker"
import type { FolderBorder } from "@/lib/folder-border"

const appIcon = `${import.meta.env.BASE_URL}icons/icon-128.png`

function previewTab(name: string): TabEntry {
  return {
    id: crypto.randomUUID(),
    name,
    url: "https://oh-my-tab.example",
    icon: appIcon,
  }
}

// Two 4x4 folders in the 8x4 area: one overflowing (scrolls), one single tab.
function buildPreview(t: (key: string) => string) {
  const many: FolderItem = {
    ...createFolderItem({
      name: t("settings.previews.favorites"),
      tabs: [
        previewTab("Oh My Tab"),
        previewTab(t("settings.previews.newTab")),
        previewTab(t("settings.previews.extensions")),
        previewTab(t("settings.previews.settings")),
        previewTab(t("settings.previews.bookmarks")),
        previewTab(t("settings.previews.history")),
        previewTab(t("settings.previews.downloads")),
        previewTab(t("settings.previews.print")),
      ],
    }),
  }
  const single: FolderItem = {
    ...createFolderItem({
      name: t("settings.previews.readLater"),
      tabs: [previewTab(t("settings.previews.designDoc"))],
    }),
  }
  return {
    items: [many, single] satisfies GridItem[],
    area: { columns: 8, rows: 4 },
    positions: {
      [many.id]: { x: 0, y: 0 },
      [single.id]: { x: 4, y: 0 },
    },
  }
}

const folderStyleKeys = {
  classic: "settings.folders.classic",
  noise: "settings.folders.noise",
  none: "settings.folders.none",
} as const

function homeGridTrackWidth() {
  return (
    document.querySelector("[data-tab-grid-track]")?.getBoundingClientRect()
      .width ?? 0
  )
}

export default function FolderPane() {
  const { t } = useTranslation()
  const folderStyle = useHomeSettingsStore((state) => state.folderStyle)
  const setFolderStyle = useHomeSettingsStore((state) => state.setFolderStyle)
  const border = useHomeSettingsStore((state) => state.folderBorder)
  const setBorder = useHomeSettingsStore((state) => state.setFolderBorder)
  const resetStyle = useHomeSettingsStore((state) => state.resetFolderStyle)
  const [trackWidth, setTrackWidth] = useState(homeGridTrackWidth)
  const preview = useMemo(() => buildPreview(t), [t])

  useLayoutEffect(() => {
    const measure = () => setTrackWidth(homeGridTrackWidth())
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  return (
    <>
      {trackWidth > 0 && (
        <ScaledGridPreview
          items={preview.items}
          trackWidth={trackWidth}
          area={preview.area}
          positions={preview.positions}
        />
      )}
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
      <SettingItem
        label={t("settings.tabs.appearance.borderStyle")}
        htmlFor="folder-border-style"
      >
        <Select
          value={border.style}
          onValueChange={(value) => {
            if (
              value === "none" ||
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
            {(
              [
                "none",
                "solid",
                "dashed",
                "dotted",
              ] satisfies FolderBorder["style"][]
            ).map((value) => (
              <SelectItem key={value} value={value}>
                {t(`settings.folders.borderStyles.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingItem>
      {border.style !== "none" && (
        <>
          <SettingItem
            label={t("settings.tabs.appearance.borderWidth")}
            htmlFor="folder-border-width"
          >
            <SettingRange
              id="folder-border-width"
              label={t("settings.tabs.appearance.borderWidth")}
              value={border.width}
              min={0}
              max={8}
              unit="px"
              onChange={(width) => setBorder({ width })}
            />
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
          <SettingItem
            label={t("settings.tabs.appearance.borderOpacity")}
            htmlFor="folder-border-opacity"
          >
            <SettingRange
              id="folder-border-opacity"
              label={t("settings.tabs.appearance.borderOpacity")}
              value={border.opacity}
              min={0}
              max={100}
              unit="%"
              onChange={(opacity) => setBorder({ opacity })}
            />
          </SettingItem>
        </>
      )}
      <AppearanceResetButton
        label={t("settings.folders.resetStyle")}
        onReset={resetStyle}
      />
    </>
  )
}
