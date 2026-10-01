import { bookmarkHost } from "@/lib/bookmark-display"
import type { TabItem } from "@/lib/grid/types"
import "./bookmark-presentation.css"

export default function TabUI({
  item,
  preview = false,
}: {
  item: TabItem
  preview?: boolean
}) {
  const host = item.size === "medium" ? bookmarkHost(item.url) : ""
  const content = (
    <span className="bookmark-copy">
      <span className="bookmark-name">{item.name}</span>
      {host && <span className="bookmark-host">{host}</span>}
    </span>
  )
  // A preview is not a second link or a native drag source.
  if (preview)
    return (
      <div className="bookmark-link" data-bookmark-size={item.size}>
        {content}
      </div>
    )
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.name}
      className="bookmark-link"
      data-bookmark-size={item.size}
      title={item.name}
    >
      {content}
    </a>
  )
}
