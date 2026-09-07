import { useState } from "react"
import {
  SquaresFour,
  Plus,
  BookmarkSimple,
  FolderPlus,
  Checks,
  Sun,
  Moon,
  Desktop,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import ComponentConfiguration from "@/components/tab-grid/component-configuration"
import GridItemDialog from "@/components/tab-grid/grid-item-dialog"
import { useGridSelectionStore } from "@/stores/grid-selection-store"
import { useThemeStore } from "@/stores/theme-store"

const themes = {
  light: { label: "浅色", icon: Sun },
  dark: { label: "深色", icon: Moon },
  system: { label: "跟随系统", icon: Desktop },
}
export default function MoreActions() {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState<"tab" | "folder" | "component" | null>(
    null
  )
  const selecting = useGridSelectionStore((state) => state.active)
  const toggleSelection = useGridSelectionStore((state) => state.toggleMode)
  const theme = useThemeStore((state) => state.theme)
  const cycleTheme = useThemeStore((state) => state.cycleTheme)
  const current = themes[theme]
  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          data-tour="more"
          aria-label="更多操作"
          title="更多操作"
          render={
            <Button variant={selecting ? "secondary" : "ghost"} size="icon" />
          }
        >
          <SquaresFour className="size-5" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          aria-label="更多操作菜单"
          className="w-56 gap-1 p-2"
        >
          {(
            [
              { kind: "tab", label: "添加标签", icon: BookmarkSimple },
              { kind: "folder", label: "添加文件夹", icon: FolderPlus },
            ] as const
          ).map((entry) => (
            <Button
              key={entry.kind}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setOpen(false)
                setAdding(entry.kind)
              }}
            >
              <entry.icon />
              {entry.label}
            </Button>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              setOpen(false)
              setAdding("component")
            }}
          >
            <Plus />
            添加组件
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            aria-pressed={selecting}
            onClick={() => {
              setOpen(false)
              toggleSelection()
            }}
          >
            <Checks />
            批量操作
            {selecting && (
              <span className="ml-auto text-xs text-muted-foreground">
                已开启
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            aria-label="深浅色模式"
            onClick={cycleTheme}
          >
            <current.icon />
            深浅色模式
            <span className="ml-auto text-xs text-muted-foreground">
              {current.label}
            </span>
          </Button>
        </PopoverContent>
      </Popover>
      {adding === "component" ? (
        <GridItemDialog onClose={() => setAdding(null)} />
      ) : (
        adding && (
          <ComponentConfiguration
            initialKind={adding}
            onClose={() => setAdding(null)}
            onSaved={() => setAdding(null)}
          />
        )
      )}
    </div>
  )
}
