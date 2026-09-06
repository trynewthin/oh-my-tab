import { findBookmarkByUrl } from "@/lib/bookmark-lookup"
import PopupBackground from "./popup-background"
import { useEffect, useState, type ReactNode, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { normalizeTabUrl } from "@/components/tab-grid/types"

interface TabAPI {
  tabs: {
    query(options: {
      active: boolean
      currentWindow: boolean
    }): Promise<Array<{ url?: string; title?: string }>>
  }
}

function PopupSurface({
  children,
  loading = false,
}: {
  children?: ReactNode
  loading?: boolean
}) {
  return (
    <main
      className="relative isolate min-h-28 w-[360px] overflow-hidden p-5"
      aria-busy={loading}
    >
      <PopupBackground />
      {children}
    </main>
  )
}

export default function Popup() {
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const items = useTabGridStore((state) => state.items)
  const existing = findBookmarkByUrl(items, url)
  const [unsupported, setUnsupported] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const api = (globalThis as typeof globalThis & { chrome?: TabAPI })
          .chrome
        if (!api?.tabs) throw new Error("请从浏览器扩展图标打开")
        const [tab] = await api.tabs.query({
          active: true,
          currentWindow: true,
        })
        if (cancelled) return
        const address =
          tab?.url && /^https?:\/\//i.test(tab.url)
            ? normalizeTabUrl(tab.url)
            : null
        if (!address) {
          setUnsupported(true)
          return
        }
        await useTabGridStore.persist.rehydrate()
        if (cancelled) return
        const match = findBookmarkByUrl(
          useTabGridStore.getState().items,
          address
        )
        setUrl(address)
        setName(
          match?.entry.name || tab.title?.trim() || new URL(address).hostname
        )
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "读取当前页面失败")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])
  async function submit(event: FormEvent) {
    event.preventDefault()
    const address = normalizeTabUrl(url)
    if (!address || !name.trim() || saving || success) return
    setSaving(true)
    setError("")
    try {
      await useTabGridStore.persist.rehydrate()
      useTabGridStore.getState().upsertBookmark(name, address)
      setSuccess(true)
    } catch {
      setError("保存失败，请重试")
    } finally {
      setSaving(false)
    }
  }
  if (unsupported) {
    return (
      <PopupSurface>
        <p
          role="status"
          className="flex min-h-[72px] items-center justify-center text-sm text-muted-foreground"
        >
          当前标签不支持
        </p>
      </PopupSurface>
    )
  }
  if (loading) return <PopupSurface loading />
  return (
    <PopupSurface>
      <form className="space-y-4" onSubmit={(event) => void submit(event)}>
        <div className="space-y-3">
          <label htmlFor="tab-name" className="block text-sm">
            名称
          </label>
          <Input
            id="tab-name"
            className="border-border bg-popover dark:bg-popover"
            value={name}
            disabled={loading || saving}
            maxLength={120}
            onChange={(event) => {
              setName(event.target.value)
              setSuccess(false)
            }}
          />
        </div>
        <div className="space-y-3">
          <label htmlFor="tab-url" className="block text-sm">
            链接
          </label>
          <Input
            id="tab-url"
            className="border-border bg-popover dark:bg-popover"
            value={url}
            disabled={loading || saving}
            placeholder="https://"
            onChange={(event) => {
              setUrl(event.target.value)
              setSuccess(false)
            }}
          />
        </div>
        <Button
          type="submit"
          className={
            success
              ? "w-full border-border bg-emerald-600 text-white disabled:opacity-100"
              : "w-full border-border"
          }
          disabled={
            loading ||
            saving ||
            success ||
            !name.trim() ||
            !normalizeTabUrl(url)
          }
          aria-live="polite"
        >
          {success
            ? "成功"
            : loading
              ? "读取中…"
              : saving
                ? existing
                  ? "更新中…"
                  : "添加中…"
                : existing
                  ? "更新"
                  : "添加"}
        </Button>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </form>
    </PopupSurface>
  )
}
