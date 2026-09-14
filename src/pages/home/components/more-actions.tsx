import { useTabGridStore } from "@/stores/tab-grid-store"
import { placeItems, positionsOnly } from "@/components/tab-grid/grid-layout"
import { toast } from "@/stores/toast-store"
import { useState } from "react"
import {
  SquaresFour,
  GridFour,
  Plus,
  BookmarkSimple,
  FolderPlus,
  Checks,
  Sun,
  Moon,
  Desktop,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import ComponentConfiguration from "@/components/tab-grid/component-configuration"
import GridItemDialog from "@/components/tab-grid/grid-item-dialog"
import { useGridSelectionStore } from "@/stores/grid-selection-store"
import { useThemeStore } from "@/stores/theme-store"

const themeOptions = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "系统", ariaLabel: "跟随系统", icon: Desktop },
] as const
export default function MoreActions({
  compact = false,
}: {
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState<"tab" | "folder" | "component" | null>(
    null
  )
  const selecting = useGridSelectionStore((state) => state.active)
  const toggleSelection = useGridSelectionStore((state) => state.toggleMode)
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          data-tour="more"
          aria-label="更多操作"
          title="更多操作"
          render={
            <Button
              variant={selecting ? "secondary" : "ghost"}
              size="icon"
              className={
                compact
                  ? "size-10 rounded-full border-border bg-card/70 bg-clip-padding backdrop-blur-xl"
                  : undefined
              }
            />
          }
        >
          <SquaresFour className="size-5" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          aria-label="更多操作菜单"
          className="w-56 gap-1 p-2"
        >
          <div className="mb-1 pb-1">
            <ToggleGroup
              aria-label="深浅色模式"
              value={[theme]}
              onValueChange={(values) => {
                const value = values[0]
                if (value === "light" || value === "dark" || value === "system")
                  setTheme(value)
              }}
            >
              {themeOptions.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  aria-label={
                    "ariaLabel" in option ? option.ariaLabel : option.label
                  }
                  title={
                    "ariaLabel" in option ? option.ariaLabel : option.label
                  }
                >
                  <option.icon weight="bold" />
                  <span>{option.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
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
            onClick={() => {
              setOpen(false)
              const state = useTabGridStore.getState()
              const columns = state.lastLayoutColumns
              if (!columns || !state.items.length) return
              const previous = state.layouts[columns] ?? {}
              const ordered = [...state.items].sort((a, b) => {
                const left = previous[a.id] ?? { x: 0, y: 0 }
                const right = previous[b.id] ?? { x: 0, y: 0 }
                return left.y - right.y || left.x - right.x
              })
              state.setLayout(
                columns,
                positionsOnly(placeItems(ordered, columns, {}))
              )
              toast("已整理网格", "success", {
                label: "撤销",
                run: () =>
                  useTabGridStore.getState().setLayout(columns, previous),
              })
            }}
          >
            <GridFour />
            一键整理
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
