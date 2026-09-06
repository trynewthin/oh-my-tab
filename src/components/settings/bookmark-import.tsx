import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { parseBookmarkHtml } from "@/lib/bookmark-import"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { toast } from "@/stores/toast-store"

export default function BookmarkImport() {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <h3 className="text-sm font-normal">浏览器书签</h3>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {busy ? "正在导入…" : "导入书签 HTML"}
        </Button>
      </div>
      <input
        ref={input}
        type="file"
        accept=".html,.htm,text/html"
        aria-label="书签 HTML 文件"
        className="sr-only"
        disabled={busy}
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ""
          if (!file) return
          setBusy(true)
          try {
            if (file.size > 10 * 1024 * 1024)
              throw new Error("请选择小于 10 MB 的书签文件")
            const parsed = parseBookmarkHtml(await file.text())
            const result = useTabGridStore
              .getState()
              .importBookmarks(parsed.bookmarks)
            const message = `新增 ${result.added} 个书签，跳过 ${result.duplicates} 个重复、${parsed.invalid} 个无效链接`
            toast(message, result.added ? "success" : "info")
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "导入失败，请重试"
            toast(message, "error")
          } finally {
            setBusy(false)
          }
        }}
      />
    </div>
  )
}
