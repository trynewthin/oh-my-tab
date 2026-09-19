import type { TabItem } from "@/lib/grid/types"

export default function TabUI({
  item,
  preview = false,
}: {
  item: TabItem
  preview?: boolean
}) {
  const className = `relative z-10 flex h-full min-w-0 items-center rounded-[inherit] py-2 pr-12 pl-3 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:pr-16 sm:pl-4`
  // Previews render a plain span: an anchor would hijack pointer gestures
  // with the browser's native link drag and could navigate on click.
  if (preview) {
    return (
      <div className={className}>
        <span className="truncate text-[13px] font-medium sm:text-sm">
          {item.name}
        </span>
      </div>
    )
  }
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={item.name}
    >
      <span className="truncate text-[13px] font-medium sm:text-sm">
        {item.name}
      </span>
    </a>
  )
}
