import { useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Shuffle } from "@phosphor-icons/react"
import SettingItem from "@/components/settings/shared/setting-item"
import { settingsControlClassName } from "@/components/settings/shared/control-styles"
import { Button } from "@/components/ui/button"
import ColorPicker from "@/components/ui/color-picker"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  componentLabel,
  getComponentDefinition,
  getItemResizeOptions,
} from "@/lib/grid/registry"
import { normalizeTabUrl, type GridItem, type TabItem } from "@/lib/grid/types"
import { isUtilityWidget } from "@/lib/grid/utility-types"
import {
  isSystemActionOnSurface,
  systemActionIdsFor,
  systemActionRegistry,
} from "@/lib/system-actions"
import { updateGridItem } from "@/stores/widget-actions"
import { useTabGridStore } from "@/stores/tab-grid-store"
import ItemEditPopover from "./item-edit-popover"
import TabIconControls from "./tab-icon-controls"
import UtilityWidgetFields from "./utility-widget-fields"
import DotCanvasFields from "./dot-canvas-fields"
import EcosystemFields from "./ecosystem-fields"

const controlClassName = `h-8 rounded-xl ${settingsControlClassName}`

function TabFields({
  item,
  onDialogOpenChange,
}: {
  item: TabItem
  onDialogOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const [url, setUrl] = useState(item.url)
  const normalized = normalizeTabUrl(url)
  return (
    <>
      <SettingItem label={t("grid.editor.url")} htmlFor={id}>
        <Input
          id={id}
          className={controlClassName}
          placeholder="https://example.com"
          value={url}
          aria-invalid={!normalized}
          onChange={(event) => {
            const value = event.target.value
            setUrl(value)
            const next = normalizeTabUrl(value)
            if (next)
              updateGridItem(item.id, (current) =>
                current.kind === "tab" ? { ...current, url: next } : current
              )
          }}
        />
      </SettingItem>
      {!normalized && (
        <p role="status" className="text-xs text-destructive">
          {t("grid.editor.invalidTab")}
        </p>
      )}
      <TabIconControls
        url={url}
        icon={item.icon}
        onIconChange={(icon) =>
          updateGridItem(item.id, (current) =>
            current.kind === "tab" ? { ...current, icon } : current
          )
        }
        onDialogOpenChange={onDialogOpenChange}
        controlClassName={controlClassName}
      />
    </>
  )
}

export default function ComponentEditPopover({
  item,
  anchor,
  onClose,
  columns,
  childDialogOpen = false,
}: {
  item: GridItem
  anchor: HTMLElement
  onClose: () => void
  columns: number
  childDialogOpen?: boolean
}) {
  const { t } = useTranslation()
  const id = useId()
  const nameRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(item.name)
  const [dialogOpen, setDialogOpen] = useState(false)
  const definition = getComponentDefinition(item.kind)
  const canResize =
    getItemResizeOptions(item).filter((size) => size.width <= columns).length >
    1
  const nameValid = name.trim().length > 0
  const colorLabel = t(
    item.kind === "folder"
      ? "grid.editor.folderColor"
      : item.kind === "clock"
        ? "widgets.clockColor"
        : "grid.editor.backgroundColor"
  )
  return (
    <ItemEditPopover
      title={t("grid.editor.editTitle", {
        label: componentLabel(item.kind, t),
      })}
      anchor={anchor}
      onClose={onClose}
      dialogOpen={dialogOpen || childDialogOpen}
      initialFocus={definition.showNameInEditor ? nameRef : undefined}
    >
      {definition.showNameInEditor && (
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
              if (value.trim())
                updateGridItem(item.id, (current) => ({
                  ...current,
                  name: value.trim(),
                }))
            }}
          />
        </SettingItem>
      )}
      {definition.showNameInEditor && !nameValid && (
        <p role="status" className="text-xs text-destructive">
          {t("grid.editor.invalidTab")}
        </p>
      )}
      {definition.actions.randomColor && (
        <SettingItem label={colorLabel}>
          <div className="flex min-w-0 items-center gap-2">
            <ColorPicker
              className={`w-auto min-w-0 flex-1 shrink ${controlClassName}`}
              label={colorLabel}
              value={item.color}
              onChange={(color) =>
                updateGridItem(item.id, (current) => ({ ...current, color }))
              }
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
      )}
      {item.kind === "tab" && (
        <TabFields item={item} onDialogOpenChange={setDialogOpen} />
      )}
      {item.kind === "button" && (
        <SettingItem
          label={t("grid.editor.buttonAction")}
          htmlFor={`${id}-action`}
        >
          <Select
            value={item.action}
            onValueChange={(action) => {
              if (isSystemActionOnSurface(action, "grid-button"))
                updateGridItem(item.id, (current) =>
                  current.kind === "button" ? { ...current, action } : current
                )
            }}
          >
            <SelectTrigger id={`${id}-action`} className="w-full">
              <SelectValue>
                {t(systemActionRegistry[item.action].labelKey)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {systemActionIdsFor("grid-button").map((action) => (
                <SelectItem key={action} value={action}>
                  {t(systemActionRegistry[action].labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingItem>
      )}
      {isUtilityWidget(item) && <UtilityWidgetFields item={item} />}
      {item.kind === "dot-canvas" && (
        <DotCanvasFields item={item} onDialogOpenChange={setDialogOpen} />
      )}
      {item.kind === "ecosystem" && (
        <EcosystemFields item={item} onDialogOpenChange={setDialogOpen} />
      )}
      {definition.actions.dynamicEffect && (
        <SettingItem
          label={t("grid.menu.dynamicEffect")}
          htmlFor={`${id}-effect`}
        >
          <div className="flex h-8 min-w-0 items-center justify-end">
            <Switch
              id={`${id}-effect`}
              checked={!!item.dynamicEffect}
              onCheckedChange={(dynamicEffect) =>
                updateGridItem(item.id, (current) => ({
                  ...current,
                  dynamicEffect,
                }))
              }
            />
          </div>
        </SettingItem>
      )}
      {canResize && (
        <p className="text-xs text-muted-foreground">
          {t("grid.editor.resizeHint")}
        </p>
      )}
    </ItemEditPopover>
  )
}
