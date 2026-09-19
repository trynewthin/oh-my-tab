import { settingsControlClassName } from "../shared/control-styles"
import { useState } from "react"
import { Info } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  readBrowserBookmarks,
  supportsBrowserBookmarks,
} from "@/lib/browser-bookmarks"
import { flushStorage } from "@/lib/storage"
import { rehydrateData } from "@/lib/hydrate"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { toast } from "@/stores/toast-store"

export default function BookmarkImport() {
  const [busy, setBusy] = useState(false)
  const supported = supportsBrowserBookmarks()
  async function importBookmarks() {
    if (busy) return
    setBusy(true)
    try {
      const parsed = await readBrowserBookmarks()
      if (!parsed.bookmarks.length && !parsed.invalid) {
        toast("浏览器中没有可导入的书签", "info")
        return
      }
      await rehydrateData(["omt.tab-grid"])
      const result = useTabGridStore
        .getState()
        .importBookmarks(parsed.bookmarks)
      await flushStorage()
      toast(
        `新增 ${result.added} 个书签，跳过 ${result.duplicates} 个重复、${parsed.invalid} 个无效链接`,
        result.added ? "success" : "info"
      )
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "导入失败，请重试",
        "error"
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <div className="flex items-center gap-1">
          <span className="text-sm">从浏览器书签导入</span>
          <Popover>
            <PopoverTrigger
              openOnHover
              delay={150}
              closeDelay={100}
              aria-label="从浏览器书签导入说明"
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-full text-muted-foreground"
                />
              }
            >
              <Info className="size-4" aria-hidden="true" />
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-64 rounded-xl p-3"
              aria-label="从浏览器书签导入说明"
            >
              <PopoverDescription className="text-xs leading-5">
                {supported
                  ? "授权后读取当前浏览器书签并添加到首页，重复网址自动跳过。"
                  : "请在 Chrome 或 Edge 扩展中导入浏览器书签。"}
              </PopoverDescription>
            </PopoverContent>
          </Popover>
        </div>
        <Button
          variant="outline"
          className={settingsControlClassName}
          disabled={busy || !supported}
          onClick={() => void importBookmarks()}
        >
          {busy ? "正在导入…" : "导入"}
        </Button>
      </div>
    </div>
  )
}
