import { useState } from "react"
import { useTranslation } from "react-i18next"
import SettingItem from "@/components/settings/shared/setting-item"
import ColorPicker from "@/components/ui/color-picker"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { configureComponent } from "@/lib/grid/factory"
import {
  componentDefaultName,
  componentLabel,
  getComponentDefinition,
  getComponentSize,
  getComponentSizeOptions,
  isComponentSize,
  type GridItemSize,
} from "@/lib/grid/registry"
import type { GridItem } from "@/lib/grid/types"
import {
  isSystemActionOnSurface,
  systemActionIdsFor,
  systemActionRegistry,
  type SystemActionId,
} from "@/lib/system-actions"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { toast } from "@/stores/toast-store"
import ActionButton from "./action-button"
import Calendar from "./calendar"
import ComponentEditorFrame from "./component-editor-frame"
import TemplateTile from "./template/tile"
import Todo from "./todo"

type GeneralItem = Extract<
  GridItem,
  { kind: "todo" | "calendar" | "template" | "button" }
>

const buttonActions = systemActionIdsFor("grid-button")

function GeneralPreview({ item }: { item: GeneralItem }) {
  switch (item.kind) {
    case "todo":
      return <Todo item={item} preview />
    case "calendar":
      return <Calendar item={item} preview />
    case "template":
      return <TemplateTile item={item} preview />
    case "button":
      return <ActionButton item={item} preview />
  }
}

export default function ComponentConfiguration({
  item,
  onClose,
  onSaved,
}: {
  item: GeneralItem
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const kind = item.kind
  const definition = getComponentDefinition(kind)
  const [name, setName] = useState(item.name)
  const [action, setAction] = useState<SystemActionId>(
    item.kind === "button" ? item.action : "toggle-theme"
  )
  const [size, setSize] = useState<GridItemSize>(item.size)
  const [color, setColor] = useState(item.color)
  const saveItem = useTabGridStore((state) => state.saveItem)
  const sizeOptions = getComponentSizeOptions(kind, "editor", item.size)
  const currentSize = getComponentSize(kind, size) ?? definition.sizes[0]
  const resolvedSize = isComponentSize(kind, size)
    ? size
    : definition.defaultSize
  const resolvedName = definition.showNameInEditor
    ? name.trim()
    : item.name || componentDefaultName(kind, t)
  const previewItem = configureComponent({
    existing: item,
    id: item.id,
    kind,
    name: resolvedName || componentDefaultName(kind, t),
    size: resolvedSize,
    color,
    action,
  }) as GeneralItem

  function save() {
    if (!resolvedName) {
      toast(t("grid.editor.invalidTab"), "error")
      return
    }
    saveItem(
      configureComponent({
        existing: item,
        id: item.id,
        kind,
        name: resolvedName,
        size: resolvedSize,
        color,
        action,
      })
    )
    onSaved()
  }

  return (
    <ComponentEditorFrame
      title={t("grid.editor.editTitle", { label: componentLabel(kind, t) })}
      description={t(
        definition.showNameInEditor
          ? "grid.editor.descriptionWithName"
          : "grid.editor.descriptionOptions"
      )}
      width={currentSize.width}
      height={currentSize.height}
      preview={<GeneralPreview item={previewItem} />}
      previewBorder={definition.tileBorder}
      sizeOptions={sizeOptions}
      size={size}
      onSizeChange={(value) => {
        if (isComponentSize(kind, value)) setSize(value)
      }}
      submitLabel={t("grid.editor.save")}
      onSubmit={save}
      onClose={onClose}
    >
      {definition.showNameInEditor && (
        <SettingItem
          label={t("grid.editor.name")}
          htmlFor="component-editor-name"
        >
          <Input
            id="component-editor-name"
            autoFocus
            required
            maxLength={40}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </SettingItem>
      )}
      {kind === "button" && (
        <SettingItem
          label={t("grid.editor.buttonAction")}
          htmlFor="component-editor-action"
        >
          <Select
            value={action}
            onValueChange={(value) => {
              if (isSystemActionOnSurface(value, "grid-button"))
                setAction(value)
            }}
          >
            <SelectTrigger id="component-editor-action" className="w-full">
              <SelectValue>
                {t(systemActionRegistry[action].labelKey)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {buttonActions.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(systemActionRegistry[option].labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingItem>
      )}
      <SettingItem label={t("grid.editor.backgroundColor")}>
        <ColorPicker
          label={t("grid.editor.backgroundColor")}
          value={color}
          onChange={setColor}
        />
      </SettingItem>
    </ComponentEditorFrame>
  )
}
