import { Globe } from "@phosphor-icons/react"

export default function EngineIcon({
  icon,
  size = 16,
}: {
  icon?: string
  size?: 16 | 20
}) {
  const sizeClass = size === 20 ? "size-5" : "size-4"
  if (!icon)
    return <Globe className={`${sizeClass} shrink-0`} aria-hidden="true" />
  return (
    <img
      src={`${import.meta.env.BASE_URL}icons/search-engines/${icon}`}
      alt=""
      className={`${sizeClass} shrink-0 ${icon.endsWith(".svg") ? "dark:invert" : ""}`}
      width={size}
      height={size}
    />
  )
}
