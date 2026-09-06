import { toast } from "@/stores/toast-store"
import BookmarkImport from "./bookmark-import"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { useSettingsStore } from "@/stores/settings-store"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  exportConfig,
  parseConfig,
  importConfig,
  type Config,
} from "@/lib/config-transfer"

export default function GeneralSettings() {
  const [text, setText] = useState("")
  const [pending, setPending] = useState<Config | null>(null)
  const [busy, setBusy] = useState(false)
  const [imported, setImported] = useState(false)
  async function run(action: () => Promise<void>) {
    setBusy(true)
    try {
      await action()
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "操作失败，请重试",
        "error"
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="space-y-6" aria-labelledby="general-settings-title">
      <h2 id="general-settings-title" className="text-base font-medium">
        常规设置
      </h2>
      <div className="space-y-5">
        <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <span className="text-sm">新手教程</span>
          <Button
            variant="outline"
            onClick={() => {
              useSettingsStore.getState().setOpen(false)
              useOnboardingStore.getState().start()
            }}
          >
            重新开始教程
          </Button>
        </div>
        <BookmarkImport />
        <div className="space-y-3">
          <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <label htmlFor="config-text" className="text-sm">
              配置管理
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                disabled={busy || imported}
                aria-live="polite"
                onClick={() =>
                  void run(async () => {
                    if (
                      typeof ClipboardItem !== "undefined" &&
                      navigator.clipboard.write
                    ) {
                      await navigator.clipboard.write([
                        new ClipboardItem({
                          "text/plain": exportConfig().then(
                            (value) => new Blob([value], { type: "text/plain" })
                          ),
                        }),
                      ])
                    } else {
                      await navigator.clipboard.writeText(await exportConfig())
                    }
                    toast("配置已复制到剪贴板", "success")
                  })
                }
              >
                导出
              </Button>
              <Button
                disabled={busy || imported || !text.trim()}
                className="h-auto min-h-8 min-w-0 px-2 whitespace-normal"
                aria-live="polite"
                onClick={() =>
                  void run(async () => {
                    if (pending) {
                      importConfig(pending)
                      setImported(true)
                      toast("配置已导入", "success")
                      await new Promise((resolve) =>
                        window.setTimeout(resolve, 900)
                      )
                      window.location.reload()
                      return
                    }
                    setPending(await parseConfig(text))
                  })
                }
              >
                {pending ? "确认覆盖并导入" : "导入"}
              </Button>
            </div>
          </div>
          <div className="relative">
            <Textarea
              id="config-text"
              value={text}
              disabled={busy || imported}
              spellCheck={false}
              className="h-36 min-h-36 resize-none overflow-y-auto pb-12 font-mono text-xs break-all"
              placeholder="粘贴要导入的配置文本"
              onChange={(event) => {
                setText(event.target.value)
                setPending(null)
              }}
            />
            <div className="absolute right-2 bottom-2 flex gap-1 rounded-xl bg-muted p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy || imported}
                onClick={() =>
                  void run(async () => {
                    try {
                      const value = await navigator.clipboard.readText()
                      setText(value)
                      setPending(null)
                    } catch {
                      throw new Error("无法读取剪贴板，请直接粘贴到输入框")
                    }
                  })
                }
              >
                粘贴
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy || imported || !text}
                onClick={() => {
                  setText("")
                  setPending(null)
                }}
              >
                清除
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
