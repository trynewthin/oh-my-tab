import { useLayoutEffect, useRef, useState } from "react"
import gsap from "gsap"
import { useStackScroll } from "./collection/use-stack-scroll"
import DraggableFolderTab from "./draggable-folder-tab"
import FolderTabRow from "./folder-tab-row"
import type { FolderItem, TabEntry } from "@/lib/grid/types"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export default function FolderTabStack({
  folder,
  className = "",
  topBleed = 0,
  surface = "preview",
  draggable = true,
  tabs,
}: {
  folder: FolderItem
  className?: string
  topBleed?: number
  surface?: "preview" | "dialog"
  draggable?: boolean
  tabs?: TabEntry[]
}) {
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)
  const glass = backgroundType !== "solid"
  const visibleTabs = tabs ?? folder.tabs
  const wide =
    surface === "preview" &&
    (folder.size === "wide" || folder.size === "wide-tall")
  const [innerColumns, setInnerColumns] = useState(1)
  const [rowHeight, setRowHeight] = useState(44)
  // Row heights snap to a whole number of texture cells (9px pitch = 8px
  // cell + 1px gap) so the burning texture never clips mid-cell; leftover
  // viewport height flows into the gap between rows instead.
  const [stackGap, setStackGap] = useState(8)
  // Vertical centering: the height left over after snapping rows to whole
  // texture cells is split evenly above and below the stack so the rows
  // sit centered instead of hugging the top.
  const [stackInset, setStackInset] = useState(0)
  const rowGap = 8
  const rowStep = rowHeight + stackGap
  const viewportRef = useRef<HTMLDivElement>(null)
  const previousRows = useRef<Map<string, number>>(new Map())
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const rows = Array.from(
      viewport.querySelectorAll<HTMLElement>("[data-stack-row]")
    )
    const next = new Map(
      rows.map((row) => [row.dataset.tabId ?? "", row.offsetTop] as const)
    )
    const previous = previousRows.current
    previousRows.current = next
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    rows.forEach((row) => {
      const before = previous.get(row.dataset.tabId ?? "")
      const after = next.get(row.dataset.tabId ?? "")
      if (before === undefined || after === undefined) return
      const delta = before - after
      if (!delta) return
      gsap.fromTo(
        row,
        { y: delta },
        { y: 0, duration: 0.22, ease: "power2.out", overwrite: true }
      )
    })
  }, [visibleTabs])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const update = () => {
      setInnerColumns(wide && viewport.clientWidth >= 400 ? 2 : 1)
      const availableHeight = viewport.clientHeight - topBleed
      // Fixed row height: border-box 46px = five whole texture cells (44px
      // content) + 2px border. Preview folders then show as many rows as
      // fit — the 9px cell pitch never divides evenly into an arbitrary
      // viewport, so the row count adapts instead of the row height.
      const rowTarget = 46
      const snapDownToCells = (height: number) =>
        Math.max(10, Math.floor((height - 1) / 9) * 9 + 1)
      if (surface !== "preview") {
        setRowHeight(rowTarget)
        setStackGap(rowGap)
        setStackInset(0)
      } else if (folder.size === "small") {
        const height = snapDownToCells(Math.min(availableHeight, rowTarget))
        setRowHeight(height)
        setStackGap(rowGap)
        setStackInset(Math.max(0, (availableHeight - height) / 2))
      } else {
        let fitted = Math.max(
          1,
          Math.floor((availableHeight + rowGap) / (rowTarget + rowGap))
        )
        let gap = rowGap
        // One more row often misses by a few pixels; before giving up on
        // it, try tightening the inter-row gap (never below 4px) — a 4~7px
        // seam reads identical to 8px and beats hiding a row entirely.
        const tightGap = (availableHeight - (fitted + 1) * rowTarget) / fitted
        if (fitted >= 1 && tightGap >= 4) {
          fitted += 1
          gap = tightGap
        }
        const filled = fitted * rowTarget + (fitted - 1) * gap
        // Scrollable stacks keep the top-aligned layout.
        const slack =
          visibleTabs.length <= fitted
            ? Math.max(0, availableHeight - filled) / 2
            : 0
        setRowHeight(rowTarget)
        setStackGap(gap)
        setStackInset(slack)
      }
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [folder.size, surface, topBleed, rowGap, wide, visibleTabs.length])

  useStackScroll(viewportRef, {
    revision: visibleTabs,
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
      data-folder-columns={draggable ? innerColumns : undefined}
      data-folder-row-height={draggable ? rowHeight : undefined}
      role="region"
      aria-label={`${folder.name}内的标签`}
      tabIndex={0}
      style={{ marginTop: -topBleed, paddingTop: topBleed }}
      className={`relative min-h-0 [scrollbar-width:none] overflow-x-hidden overflow-y-auto overscroll-contain outline-none [overflow-anchor:none] focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-scrollbar]:hidden ${className}`}
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
        const visibleHeight = viewport.clientHeight - topBleed
        const lines = Math.ceil(visibleTabs.length / innerColumns)
        const visibleLines = Math.max(
          1,
          Math.floor((visibleHeight - rowHeight) / rowStep) + 1
        )
        const maxScroll = Math.max(0, (lines - visibleLines) * rowStep)
        if (maxScroll <= 0) return
        const top =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? maxScroll
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
          marginTop: stackInset,
          paddingBottom: "var(--stack-bottom, 0px)",
        }}
      >
        {visibleTabs.map((tab, index) => (
          <div
            key={tab.id}
            data-stack-row
            data-tab-id={tab.id}
            role="listitem"
            className={`relative rounded-2xl after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-[inherit] after:opacity-[var(--stack-shade,0)] ${
              tab.id === "__folder-gap__"
                ? ""
                : glass
                  ? "bg-transparent after:bg-card/55"
                  : "bg-card after:bg-card"
            }`}
            style={{
              height: rowHeight,
              marginBottom: index < visibleTabs.length - 1 ? stackGap : 0,
            }}
          >
            {tab.id === "__folder-gap__" ? null : draggable ? (
              <DraggableFolderTab
                tab={tab}
                color={folder.color}
                folderId={folder.id}
                index={index}
                rowPitch={Math.round(rowStep / 9) * 9}
                animated={!!folder.dynamicEffect}
                surface={surface}
              />
            ) : (
              <FolderTabRow
                tab={tab}
                color={folder.color}
                folderId={folder.id}
                index={index}
                rowPitch={Math.round(rowStep / 9) * 9}
                animated={!!folder.dynamicEffect}
                preview={!draggable}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
