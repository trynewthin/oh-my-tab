import { toast } from "@/stores/toast-store"
import { useState } from "react"
import SettingItem from "@/components/settings/shared/setting-item"
import ColorPicker from "@/components/ui/color-picker"
import { Input } from "@/components/ui/input"
import { useTabGridStore } from "@/stores/tab-grid-store"
import type { FolderItem } from "@/lib/grid/types"
import {
  componentDefaultName,
  componentLabel,
  getComponentDefinition,
  getComponentSize,
  getComponentSizeOptions,
  isComponentSize,
  type GridItemSize,
} from "@/lib/grid/registry"
import { configureComponent } from "@/lib/grid/factory"
import { useTranslation } from "react-i18next"
import ComponentBackground from "./shared/component-background"
import ComponentEditorFrame from "./component-editor-frame"
import FolderUI from "./folder-ui"

// Folder on the shared editor. The live preview is the folder tile itself,
// including the tabs it already holds; the frame owns the dialog chrome.
export default function FolderEditor({
  item,
  onClose,
  onSaved,
}: {
  item?: FolderItem
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [id] = useState(() => item?.id ?? crypto.randomUUID())
  const definition = getComponentDefinition("folder")
  const [name, setName] = useState(item?.name ?? "")
  const [size, setSize] = useState<GridItemSize>(
    item?.size ?? definition.defaultSize
  )
  const [color, setColor] = useState(item?.color ?? definition.defaultColor)
  const saveItem = useTabGridStore((state) => state.saveItem)
  const sizeOptions = getComponentSizeOptions("folder", "editor", item?.size)
  const current = getComponentSize("folder", size) ?? definition.sizes[0]
  const resolvedSize = (
    isComponentSize("folder", size) ? size : definition.defaultSize
  ) as FolderItem["size"]
  const preview: FolderItem = {
    id,
    kind: "folder",
    name: name.trim() || componentDefaultName("folder", t),
    size: resolvedSize,
    color,
    tabs: item?.tabs ?? [],
    dynamicEffect: item?.dynamicEffect,
  }

  function save() {
    const resolvedName = name.trim()
    if (!resolvedName) {
      toast(t("grid.editor.invalidTab"), "error")
      return
    }
    saveItem(
      configureComponent({
        existing: item,
        id,
        kind: "folder",
        name: resolvedName,
        size: resolvedSize,
        color,
      })
    )
    onSaved()
  }

  return (
    <ComponentEditorFrame
      title={
        item
          ? t("grid.editor.editTitle", { label: componentLabel("folder", t) })
          : t("grid.editor.configTitle", {
              label: componentLabel("folder", t),
            })
      }
      description={t("grid.editor.descriptionWithName")}
      width={current.width}
      height={current.height}
      preview={
        <>
          <ComponentBackground
            color={preview.color}
            animated={!!preview.dynamicEffect}
          />
          <FolderUI item={preview} preview onOpen={() => {}} />
        </>
      }
      sizeOptions={sizeOptions}
      size={size}
      onSizeChange={(value) => {
        if (isComponentSize("folder", value)) setSize(value)
      }}
      submitLabel={item ? t("grid.editor.save") : t("grid.editor.confirmAdd")}
      onSubmit={save}
      onClose={onClose}
    >
      <SettingItem label={t("grid.editor.name")} htmlFor="folder-editor-name">
        <Input
          id="folder-editor-name"
          autoFocus
          required
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </SettingItem>
      <SettingItem label={t("grid.editor.folderColor")}>
        <ColorPicker
          label={t("grid.editor.folderColor")}
          value={color}
          onChange={setColor}
        />
      </SettingItem>
    </ComponentEditorFrame>
  )
}
