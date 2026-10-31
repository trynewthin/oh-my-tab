import { useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Shuffle } from "@phosphor-icons/react"
import SettingItem from "@/components/settings/shared/setting-item"
import { settingsControlClassName } from "@/components/settings/shared/control-styles"
import { Button } from "@/components/ui/button"
import CloseIcon from "@/components/ui/close-icon"
import ColorPicker from "@/components/ui/color-picker"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTitle } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { normalizeTabUrl, type TabItem } from "@/lib/grid/types"
import { useTabGridStore } from "@/stores/tab-grid-store"
import TabIconControls from "./tab-icon-controls"

const controlClassName = `h-8 rounded-xl ${settingsControlClassName}`

export default function TabEditPopover({
  item,
  anchor,
  onClose,
}: {
  item: TabItem
  anchor: HTMLElement
  onClose: () => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const nameRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(item.name)
  const [url, setUrl] = useState(item.url)
  const [iconDialogOpen, setIconDialogOpen] = useState(false)
  const nameValid = name.trim().length > 0
  const normalizedUrl = normalizeTabUrl(url)

  function update(
    changes: Partial<
      Pick<TabItem, "name" | "url" | "color" | "icon" | "dynamicEffect">
    >
  ) {
    // Read the latest card so changing a field cannot undo a concurrent resize.
    const store = useTabGridStore.getState()
    const current = store.items.find((entry) => entry.id === item.id)
    if (current?.kind === "tab") store.saveItem({ ...current, ...changes })
  }

  return (
    <Popover
      open
      modal={false}
      onOpenChange={(open, details) => {
        if (open) return
        const target = details.event.target
        if (
          iconDialogOpen ||
          details.reason === "focus-out" ||
          (target instanceof Node && anchor.contains(target))
        ) {
          details.cancel()
          return
        }
        onClose()
      }}
    >
      <PopoverContent
        anchor={anchor}
        side="right"
        align="start"
        sideOffset={12}
        animateFromAnchor
        initialFocus={nameRef}
        finalFocus={false}
        className="max-h-[min(36rem,var(--available-height))] w-80 max-w-[calc(100vw-2rem)] gap-4 overflow-x-hidden overflow-y-auto data-open:animate-none data-closed:animate-none"
      >
        <div className="flex items-center justify-between gap-3">
          <PopoverTitle>
            {t("grid.editor.editTitle", {
              label: t("grid.component.tab.label"),
            })}
          </PopoverTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label={t("shell.common.close")}
          >
            <CloseIcon />
          </Button>
        </div>
        <SettingItem label={t("grid.editor.name")} htmlFor={`${id}-name`}>
          <Input
            ref={nameRef}
            id={`${id}-name`}
            className={controlClassName}
            maxLength={40}
            value={name}
            aria-invalid={!nameValid}
            onChange={(event) => {
              const value = event.target.value
              setName(value)
              if (value.trim()) update({ name: value.trim() })
            }}
          />
        </SettingItem>
        <SettingItem label={t("grid.editor.url")} htmlFor={`${id}-url`}>
          <Input
            id={`${id}-url`}
            className={controlClassName}
            placeholder="https://example.com"
            value={url}
            aria-invalid={!normalizedUrl}
            onChange={(event) => {
              const value = event.target.value
              setUrl(value)
              const normalized = normalizeTabUrl(value)
              if (normalized) update({ url: normalized })
            }}
          />
        </SettingItem>
        {(!nameValid || !normalizedUrl) && (
          <p role="status" className="text-xs text-destructive">
            {t("grid.editor.invalidTab")}
          </p>
        )}
        <SettingItem label={t("grid.editor.backgroundColor")}>
          <div className="flex min-w-0 items-center gap-2">
            <ColorPicker
              className={`w-auto min-w-0 flex-1 shrink ${controlClassName}`}
              label={t("grid.editor.backgroundColor")}
              value={item.color}
              onChange={(color) => update({ color })}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={controlClassName}
              aria-label={t("grid.menu.randomColor")}
              onClick={() =>
                useTabGridStore.getState().randomizeItemColor(item.id)
              }
            >
              <Shuffle />
            </Button>
          </div>
        </SettingItem>
        <TabIconControls
          url={url}
          icon={item.icon}
          onIconChange={(icon) => update({ icon })}
          onDialogOpenChange={setIconDialogOpen}
          controlClassName={controlClassName}
        />
        <SettingItem
          label={t("grid.menu.dynamicEffect")}
          htmlFor={`${id}-effect`}
        >
          <div className="flex h-8 min-w-0 items-center justify-end">
            <Switch
              id={`${id}-effect`}
              checked={!!item.dynamicEffect}
              onCheckedChange={(dynamicEffect) => update({ dynamicEffect })}
            />
          </div>
        </SettingItem>
      </PopoverContent>
    </Popover>
  )
}
