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
import { settingsControlClassName } from "../shared/control-styles"
import ScaledGridPreview from "./scaled-grid-preview"

const appIcon = `${import.meta.env.BASE_URL}icons/icon-128.png`

function previewTab(name: string): TabEntry {
  return {
    id: crypto.randomUUID(),
    name,
    url: "https://oh-my-tab.example",
    icon: appIcon,
  }
}

// Two 4x4 folders side by side in the 8x4 area. The left one carries enough
// tabs to overflow its four visible rows (it scrolls natively); the right
// one holds a single tab so the contrast reads at a glance.
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
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <label htmlFor="folder-style" className="text-sm">
          {t("settings.folders.texture")}
        </label>
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
      </div>
    </>
  )
}
