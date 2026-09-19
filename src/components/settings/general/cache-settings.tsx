import { useState } from "react"
import { Button } from "@/components/ui/button"
import { settingsControlClassName } from "../shared/control-styles"
import CacheDialog from "./cache-dialog"

export default function CacheSettings() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  return (
    <>
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <span className="text-sm">缓存</span>
        <Button
          variant="outline"
          className={settingsControlClassName}
          onClick={() => setOpen(true)}
        >
          管理
        </Button>
      </div>
      <CacheDialog
        open={open}
        onOpenChange={setOpen}
        busy={busy}
        setBusy={setBusy}
      />
    </>
  )
}
