import { Globe } from "@phosphor-icons/react"

export default function EngineIcon({ icon }: { icon?: string }) {
  if (!icon) return <Globe className="size-4 shrink-0" aria-hidden="true" />
  return (
    <img
      src={`${import.meta.env.BASE_URL}icons/search-engines/${icon}`}
      alt=""
      className={`size-4 shrink-0 ${icon.endsWith(".svg") ? "dark:invert" : ""}`}
      width={16}
      height={16}
    />
  )
}
