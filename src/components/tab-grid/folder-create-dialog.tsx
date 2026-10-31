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
import ComponentCreateFrame from "./component-create-frame"
import FolderUI from "./folder-ui"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import FolderBorder from "./folder-border"

export default function FolderCreateDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const folderRadius = useHomeSettingsStore((state) => state.folderRadius)
  const [id] = useState(() => crypto.randomUUID())
  const definition = getComponentDefinition("folder")
  const [name, setName] = useState("")
  const [size, setSize] = useState<GridItemSize>(definition.defaultSize)
  const [color, setColor] = useState(definition.defaultColor)
  const saveItem = useTabGridStore((state) => state.saveItem)
  const sizeOptions = getComponentSizeOptions("folder", "editor")
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
    tabs: [],
    dynamicEffect: false,
  }

  function save() {
    const resolvedName = name.trim()
    if (!resolvedName) {
      toast(t("grid.editor.invalidTab"), "error")
      return
    }
    saveItem(
      configureComponent({
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
    <ComponentCreateFrame
      title={t("grid.editor.configTitle", {
        label: componentLabel("folder", t),
      })}
      description={t("grid.editor.descriptionWithName")}
      width={current.width}
      height={current.height}
      previewRadius={folderRadius}
      previewBorderTransparent
      preview={
        <>
          <ComponentBackground color={preview.color} />
          <FolderUI item={preview} preview onOpen={() => {}} />
          <FolderBorder />
        </>
      }
      sizeOptions={sizeOptions}
      size={size}
      onSizeChange={(value) => {
        if (isComponentSize("folder", value)) setSize(value)
      }}
      submitLabel={t("grid.editor.confirmAdd")}
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
    </ComponentCreateFrame>
  )
}
