import { useLayoutEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import TabGrid from "@/components/tab-grid/tab-grid"
import { createFolderItem } from "@/components/tab-grid/factory"
import type { FolderItem, GridItem, TabEntry } from "@/lib/grid/types"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { settingsControlClassName } from "../shared/control-styles"

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
const preview = (() => {
  const many: FolderItem = {
    ...createFolderItem({
      name: "收藏",
      tabs: [
        previewTab("Oh My Tab"),
        previewTab("新标签页"),
        previewTab("扩展"),
        previewTab("设置"),
        previewTab("书签"),
        previewTab("历史记录"),
        previewTab("下载内容"),
        previewTab("打印"),
      ],
    }),
  }
  const single: FolderItem = {
    ...createFolderItem({
      name: "稍后阅读",
      tabs: [previewTab("设计稿")],
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
})()

function homeGridTrackWidth() {
  return (
    document.querySelector("[data-tab-grid-track]")?.getBoundingClientRect()
      .width ?? 0
  )
}

export default function FolderPane() {
  const folderStyle = useHomeSettingsStore((state) => state.folderStyle)
  const setFolderStyle = useHomeSettingsStore((state) => state.setFolderStyle)
  const [trackWidth, setTrackWidth] = useState(homeGridTrackWidth)

  useLayoutEffect(() => {
    const measure = () => setTrackWidth(homeGridTrackWidth())
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  return (
    <>
      {trackWidth > 0 && (
        <div className="flex justify-center">
          <TabGrid
            preview
            items={preview.items}
            trackWidth={trackWidth}
            area={preview.area}
            previewPositions={preview.positions}
          />
        </div>
      )}
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <label htmlFor="folder-style" className="text-sm">
          文件夹纹理
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
