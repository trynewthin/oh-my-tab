import { useState } from "react"
import { Plus } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import GridItemDialog from "@/components/tab-grid/grid-item-dialog"

export default function AddGridItemButton() {
  const [open, setOpen] = useState(false)
  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        data-tour="add"
        aria-label="添加标签或文件夹"
        title="添加标签或文件夹"
        onClick={() => setOpen(true)}
      >
        <Plus />
      </Button>
      {open && <GridItemDialog onClose={() => setOpen(false)} />}
    </div>
  )
}
