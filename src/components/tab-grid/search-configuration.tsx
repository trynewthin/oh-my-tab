import { useState } from "react"
import { useTranslation } from "react-i18next"

import {
  componentLabel,
  getComponentSize,
  getComponentSizeOptions,
  isComponentSize,
} from "@/lib/grid/registry"
import type { GridItem, MinimalSearchItem } from "@/lib/grid/types"
import { useTabGridStore } from "@/stores/tab-grid-store"
import ComponentEditorFrame from "./component-editor-frame"
import SearchTile from "./search-tile"

type SearchItem = Extract<GridItem, { kind: "search-minimal" }>

export default function SearchConfiguration({
  item,
  onClose,
  onSaved,
}: {
  item: SearchItem
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [size, setSize] = useState<MinimalSearchItem["size"]>(item.size)
  const saveItem = useTabGridStore((state) => state.saveItem)
  const currentSize = getComponentSize(item.kind, size)!
  const sizeOptions = getComponentSizeOptions(item.kind, "editor", item.size)
  const previewItem: SearchItem = { ...item, size }

  function save() {
    saveItem(previewItem)
    onSaved()
  }

  return (
    <ComponentEditorFrame
      title={t("grid.editor.editTitle", {
        label: componentLabel(item.kind, t),
      })}
      description={t("grid.editor.descriptionOptions")}
      width={currentSize.width}
      height={currentSize.height}
      preview={<SearchTile item={previewItem} preview />}
      previewBorder={false}
      sizeOptions={sizeOptions}
      size={size}
      onSizeChange={(value) => {
        if (isComponentSize(item.kind, value))
          setSize(value as MinimalSearchItem["size"])
      }}
      submitLabel={t("grid.editor.save")}
      onSubmit={save}
      onClose={onClose}
    />
  )
}
