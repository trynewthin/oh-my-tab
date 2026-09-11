import type { TabItem } from "./types"

export default function TabUI({ item }: { item: TabItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative z-10 flex h-full min-w-0 items-center rounded-[inherit] py-2 pr-12 pl-3 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:pr-16 sm:pl-4"
      title={item.name}
    >
      <span className="truncate text-[13px] font-medium sm:text-sm">
        {item.name}
      </span>
    </a>
  )
}
