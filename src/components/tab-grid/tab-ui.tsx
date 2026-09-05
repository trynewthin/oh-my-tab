import type { TabItem } from "./types"

export default function TabUI({ item }: { item: TabItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative z-10 flex h-full min-w-0 items-center rounded-[inherit] py-2 pr-16 pl-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title={item.name}
    >
      <span className="truncate text-sm font-medium">{item.name}</span>
    </a>
  )
}
