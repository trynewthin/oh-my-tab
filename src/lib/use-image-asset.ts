import { useEffect, useState } from "react"
import { getAsset } from "./storage"
export function useImageAsset(id: string | null) {
  const [loaded, setLoaded] = useState<{ id: string; url: string } | null>(null)
  useEffect(() => {
    if (!id?.startsWith("asset:")) return
    let cancelled = false
    let url: string | undefined
    void getAsset(id)
      .then((blob) => {
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setLoaded({ id, url })
      })
      .catch(() => {})
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [id])
  return id?.startsWith("asset:") ? (loaded?.id === id ? loaded.url : null) : id
}
