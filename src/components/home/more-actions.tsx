import { useState } from "react"
import { useTranslation } from "react-i18next"
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
import { useGridSelectionStore } from "@/stores/grid-selection-store"
import { useThemeStore } from "@/stores/theme-store"
import { useComponentsApplicationStore } from "@/stores/components-application-store"
import { runSystemAction } from "@/application/system-actions"

const themeOptions = [
  { value: "light", labelKey: "themeLight", icon: Sun },
  { value: "dark", labelKey: "themeDark", icon: Moon },
  {
    value: "system",
    labelKey: "themeSystem",
    ariaKey: "themeSystemAria",
    icon: Desktop,
  },
] as const
export default function MoreActions({
  compact = false,
}: {
  compact?: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState<"tab" | "folder" | null>(null)
  const selecting = useGridSelectionStore((state) => state.active)
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          data-tour="more"
          aria-label={t("shell.moreActions.trigger")}
          title={t("shell.moreActions.trigger")}
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
          aria-label={t("shell.moreActions.menuLabel")}
          className="w-56 gap-1 p-2"
        >
          <div className="mb-1 pb-1">
            <ToggleGroup
              aria-label={t("shell.moreActions.themeGroup")}
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
                  aria-label={t(
                    `shell.moreActions.${"ariaKey" in option ? option.ariaKey : option.labelKey}`
                  )}
                  title={t(
                    `shell.moreActions.${"ariaKey" in option ? option.ariaKey : option.labelKey}`
                  )}
                >
                  <option.icon weight="bold" />
                  <span>{t(`shell.moreActions.${option.labelKey}`)}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          {(
            [
              { kind: "tab", labelKey: "addTab", icon: BookmarkSimple },
              { kind: "folder", labelKey: "addFolder", icon: FolderPlus },
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
              {t(`shell.moreActions.${entry.labelKey}`)}
            </Button>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              setOpen(false)
              useComponentsApplicationStore.getState().setOpen(true)
            }}
          >
            <Plus />
            {t("shell.moreActions.addComponent")}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              setOpen(false)
              runSystemAction("tidy-grid")
            }}
          >
            <GridFour />
            {t("shell.moreActions.tidy")}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            aria-pressed={selecting}
            onClick={() => {
              setOpen(false)
              runSystemAction("toggle-selection")
            }}
          >
            <Checks />
            {t("shell.moreActions.batch")}
            {selecting && (
              <span className="ml-auto text-xs text-muted-foreground">
                {t("shell.moreActions.batchOn")}
              </span>
            )}
          </Button>
        </PopoverContent>
      </Popover>
      {adding && (
        <ComponentConfiguration
          initialKind={adding}
          onClose={() => setAdding(null)}
          onSaved={() => setAdding(null)}
        />
      )}
    </div>
  )
}
