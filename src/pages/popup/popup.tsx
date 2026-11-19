import { flushStorage } from "@/lib/storage"
import { rehydrateData } from "@/application/hydrate"
import { findBookmarkByUrl } from "@/lib/bookmark-lookup"
import PopupSurface from "@/components/popup/popup-surface"
import PopupBookmarkForm from "@/components/popup/popup-bookmark-form"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
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
  async function submit() {
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
  const submitAction = success
    ? "success"
    : saving
      ? existing
        ? "updating"
        : "adding"
      : existing
        ? "update"
        : "add"
  return (
    <PopupSurface>
      <PopupBookmarkForm
        name={name}
        url={url}
        submitLabel={t(`shell.popup.${submitAction}`)}
        onNameChange={(value) => {
          setName(value)
          setSuccess(false)
        }}
        onUrlChange={(value) => {
          setUrl(value)
          setSuccess(false)
        }}
        onSave={() => void submit()}
        fieldsDisabled={saving}
        submitDisabled={
          saving || success || !name.trim() || !normalizeTabUrl(url)
        }
        success={success}
        error={error ? t(`shell.popup.${error}`) : undefined}
      />
    </PopupSurface>
  )
}
