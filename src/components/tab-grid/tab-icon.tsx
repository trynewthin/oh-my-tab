import { useEffect, useRef, useState } from "react"
import {
  faviconKey,
  getCachedFavicon,
  subscribeFavicon,
} from "@/lib/favicon-cache"

export default function TabIcon({
  url,
  className = "size-4",
}: {
  url: string
  className?: string
}) {
  const element = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)
  const [icon, setIcon] = useState<{ key: string | null; src: string | null }>({
    key: null,
    src: null,
  })
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const key = faviconKey(url)

  useEffect(() => {
    const node = element.current
    if (!node || visible) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "160px" }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [visible])

  useEffect(() => {
    if (!visible || !key) return
    let cancelled = false
    let request = 0
    const load = () => {
      const current = ++request
      void getCachedFavicon(url).then((src) => {
        if (!cancelled && current === request) setIcon({ key, src })
      })
    }
    load()
    const unsubscribe = subscribeFavicon((changed) => {
      if (changed === key) load()
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [key, url, visible])

  const src = icon.key === key ? icon.src : null
  return (
    <span
      ref={element}
      className={`${className} inline-flex shrink-0 items-center justify-center`}
      aria-hidden="true"
    >
      {src && failedSrc !== src && (
        <img
          src={src}
          className="h-full w-full object-contain"
          alt=""
          onError={() => setFailedSrc(src)}
        />
      )}
    </span>
  )
}
