import { useLayoutEffect, useRef, useState } from "react"
import { useStackScroll } from "./use-stack-scroll"
import DraggableFolderTab from "./draggable-folder-tab"
import FolderTabRow from "./folder-tab-row"
import type { FolderItem } from "./types"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export default function FolderTabStack({
  folder,
  className = "",
  topBleed = 0,
  surface = "preview",
  draggable = true,
}: {
  folder: FolderItem
  className?: string
  topBleed?: number
  surface?: "preview" | "dialog"
  draggable?: boolean
}) {
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)
  const glass = backgroundType !== "solid"
  const wide =
    surface === "preview" &&
    (folder.size === "wide" || folder.size === "wide-tall")
  const [innerColumns, setInnerColumns] = useState(1)
  const [rowHeight, setRowHeight] = useState(44)
  const rowGap = 8
  const rowStep = rowHeight + rowGap
  const viewportRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const update = () => {
      setInnerColumns(wide && viewport.clientWidth >= 400 ? 2 : 1)
      const count =
        folder.size === "tall" || folder.size === "wide-tall"
          ? 8
          : folder.size === "small"
            ? 1
            : 4
      const parentStyle = viewport.parentElement
        ? getComputedStyle(viewport.parentElement)
        : null
      const padding = parentStyle
        ? parseFloat(parentStyle.paddingTop) +
          parseFloat(parentStyle.paddingBottom)
        : 24
      const grid = viewport
        .closest<HTMLElement>("[data-tour=grid]")
        ?.querySelector<HTMLElement>(".grid")
      const outerGap = grid
        ? parseFloat(getComputedStyle(grid).rowGap) || 16
        : 16
      // Eight-row folders use the same row height as four-row folders at this grid width.
      const heightAdjustment =
        count === 8 ? topBleed + padding + outerGap - rowGap : 0
      const availableHeight = viewport.clientHeight - topBleed
      const commonHeight =
        (availableHeight * 2 + topBleed + padding + outerGap - 3 * rowGap) / 4
      setRowHeight(
        surface === "preview"
          ? Math.max(
              1,
              count === 1
                ? Math.min(availableHeight, commonHeight)
                : (availableHeight - (count - 1) * rowGap - heightAdjustment) /
                    count
            )
          : 44
      )
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [folder.size, surface, topBleed, rowGap, wide])

  useStackScroll(viewportRef, {
    revision: folder.tabs,
    singleRow: surface === "preview" && folder.size === "small",
    topBleed,
    rowStep,
    rowHeight,
    innerColumns,
  })

  return (
    <div
      ref={viewportRef}
      data-folder-surface={draggable ? surface : undefined}
      data-folder-id={draggable ? folder.id : undefined}
      role="region"
      aria-label={`${folder.name}内的标签`}
      tabIndex={0}
      style={{ marginTop: -topBleed, paddingTop: topBleed }}
      className={`relative min-h-0 [scrollbar-width:none] overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl outline-none [overflow-anchor:none] focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-scrollbar]:hidden ${className}`}
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return
        const amount =
          event.key === "ArrowDown"
            ? rowStep
            : event.key === "ArrowUp"
              ? -rowStep
              : 0
        if (!amount && event.key !== "Home" && event.key !== "End") return
        event.preventDefault()
        event.stopPropagation()
        const viewport = event.currentTarget
        const top =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? viewport.scrollHeight
              : viewport.scrollTop + amount
        viewport.scrollTo({
          top,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        })
      }}
    >
      <div
        role="list"
        className="relative grid"
        style={{
          gridTemplateColumns: `repeat(${innerColumns}, minmax(0, 1fr))`,
          columnGap: rowGap,
          paddingBottom: "var(--stack-bottom, 0px)",
        }}
      >
        {folder.tabs.map((tab, index) => (
          <div
            key={tab.id}
            data-stack-row
            data-tab-id={tab.id}
            role="listitem"
            className={`relative rounded-2xl after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-[inherit] after:opacity-[var(--stack-shade,0)] ${glass ? "bg-transparent after:bg-card/55" : "bg-card after:bg-card"}`}
            style={{
              height: rowHeight,
              marginBottom: index < folder.tabs.length - 1 ? rowGap : 0,
            }}
          >
            {draggable ? (
              <DraggableFolderTab
                tab={tab}
                color={folder.color}
                folderId={folder.id}
                index={index}
                animated={!!folder.dynamicEffect}
                surface={surface}
              />
            ) : (
              <FolderTabRow
                tab={tab}
                color={folder.color}
                folderId={folder.id}
                index={index}
                animated={!!folder.dynamicEffect}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
