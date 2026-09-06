import { useOnboardingStore } from "@/stores/onboarding-store"
import { useSettingsStore } from "@/stores/settings-store"
import { useEffect, useState } from "react"
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
  const [exported, setExported] = useState(false)
  const [imported, setImported] = useState(false)
  const successClass =
    "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white disabled:opacity-100 dark:border-emerald-500 dark:bg-emerald-500 dark:text-white"
  useEffect(() => {
    if (!exported) return
    const timer = window.setTimeout(() => setExported(false), 2000)
    return () => window.clearTimeout(timer)
  }, [exported])
  const [message, setMessage] = useState("")
  async function run(action: () => Promise<void>) {
    setBusy(true)
    setMessage("")
    try {
      await action()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败，请重试")
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="space-y-6" aria-labelledby="general-settings-title">
      <h2 id="general-settings-title" className="text-base font-medium">
        常规设置
      </h2>
      <div className="flex items-center justify-between gap-3 rounded-xl border p-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">新手教程</h3>
          <p className="text-xs text-muted-foreground">
            逐步了解按钮功能和主页操作。
          </p>
        </div>
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
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="config-text" className="text-sm">
            配置管理
          </label>
          <Button
            variant="outline"
            disabled={busy || imported}
            className={exported ? successClass : undefined}
            aria-live="polite"
            onClick={() =>
              void run(async () => {
                setExported(false)
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
                setExported(true)
              })
            }
          >
            {exported ? "成功" : "导出"}
          </Button>
        </div>
        <Textarea
          id="config-text"
          value={text}
          disabled={busy || imported}
          spellCheck={false}
          className="h-40 min-h-40 overflow-y-auto font-mono text-xs break-all"
          placeholder="粘贴要导入的配置文本"
          onChange={(event) => {
            setText(event.target.value)
            setPending(null)
            setMessage("")
          }}
        />
        <div className="flex justify-end gap-2">
          <Button
            disabled={busy || imported || !text.trim()}
            className={imported ? successClass : undefined}
            aria-live="polite"
            onClick={() =>
              void run(async () => {
                if (pending) {
                  importConfig(pending)
                  setImported(true)
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
            {imported ? "成功" : pending ? "确认覆盖并导入" : "导入"}
          </Button>
        </div>
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      </div>
    </section>
  )
}
