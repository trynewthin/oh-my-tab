import { flushStorage } from "@/lib/storage"
import { rehydrateData } from "@/lib/hydrate"
import { findBookmarkByUrl } from "@/lib/bookmark-lookup"
import PopupBackground from "./popup-background"
import { useEffect, useState, type ReactNode, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { normalizeTabUrl } from "@/lib/grid/types"

interface TabAPI {
  tabs: {
    query(options: {
      active: boolean
      currentWindow: boolean
    }): Promise<Array<{ url?: string; title?: string }>>
  }
}

type PopupError = "" | "extensionOnly" | "readCurrentPageFailed" | "saveFailed"

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
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const items = useTabGridStore((state) => state.items)
  const existing = findBookmarkByUrl(items, url)
  const [unsupported, setUnsupported] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<PopupError>("")
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const api = (globalThis as typeof globalThis & { chrome?: TabAPI })
          .chrome
        if (!api?.tabs) {
          if (!cancelled) {
            setError("extensionOnly")
            setLoading(false)
          }
          return
        }
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
        await rehydrateData(["omt.tab-grid"])
        if (cancelled) return
        const match = findBookmarkByUrl(
          useTabGridStore.getState().items,
          address
        )
        setUrl(address)
        setName(
          match?.entry.name || tab.title?.trim() || new URL(address).hostname
        )
      } catch {
        if (!cancelled) setError("readCurrentPageFailed")
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
      await rehydrateData(["omt.tab-grid"])
      useTabGridStore.getState().upsertBookmark(name, address)
      await flushStorage()
      setSuccess(true)
    } catch {
      setError("saveFailed")
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
          {t("shell.popup.unsupported")}
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
            {t("shell.popup.nameLabel")}
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
            {t("shell.popup.urlLabel")}
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
            ? t("shell.popup.success")
            : loading
              ? t("shell.popup.loading")
              : saving
                ? existing
                  ? t("shell.popup.updating")
                  : t("shell.popup.adding")
                : existing
                  ? t("shell.popup.update")
                  : t("shell.popup.add")}
        </Button>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {t(`shell.popup.${error}`)}
          </p>
        )}
      </form>
    </PopupSurface>
  )
}
