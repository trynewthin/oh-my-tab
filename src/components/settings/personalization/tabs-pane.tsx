import { useLayoutEffect, useMemo, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import TabGrid from "@/components/tab-grid/tab-grid"
import { createTabItem } from "@/components/tab-grid/factory"
import { getComponentSize } from "@/lib/grid/registry"
import type { GridItem, TabItem } from "@/lib/grid/types"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { settingsControlClassName } from "../shared/control-styles"

function homeGridTrackWidth() {
  return (
    document.querySelector("[data-tab-grid-track]")?.getBoundingClientRect()
      .width ?? 0
  )
}

function sampleTab(items: GridItem[]): TabItem {
  return (
    items.find((item): item is TabItem => item.kind === "tab") ??
    createTabItem({ name: "标签", url: "https://example.com" })
  )
}

export default function TabsPane() {
  const items = useTabGridStore((state) => state.items)
  const folderStyle = useHomeSettingsStore((state) => state.folderStyle)
  const setFolderStyle = useHomeSettingsStore((state) => state.setFolderStyle)
  const [trackWidth, setTrackWidth] = useState(homeGridTrackWidth)
  const tab = useMemo(() => sampleTab(items), [items])
  const occupancy = getComponentSize("tab", tab.size)

  useLayoutEffect(() => {
    const measure = () => setTrackWidth(homeGridTrackWidth())
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  return (
    <>
      {occupancy && trackWidth > 0 && (
        <TabGrid
          preview
          items={[tab]}
          trackWidth={trackWidth}
          area={{ columns: occupancy.width, rows: occupancy.height }}
        />
      )}
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <label htmlFor="folder-style" className="text-sm">
          文件夹样式
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
            <SelectValue>
              {
                {
                  classic: "经典光晕",
                  noise: "噪点渐变",
                  none: "无效果",
                }[folderStyle]
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="classic">经典光晕</SelectItem>
            <SelectItem value="noise">噪点渐变</SelectItem>
            <SelectItem value="none">无效果</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  )
}
