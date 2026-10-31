import { Check } from "@phosphor-icons/react"
import { useMemo } from "react"
import { createPortal } from "react-dom"
import {
  DragOverlay,
  defaultDropAnimationSideEffects,
  type Modifier,
} from "@dnd-kit/core"

import { itemHeight, itemWidth } from "@/lib/grid/grid-layout"
import { getComponentDefinition } from "@/lib/grid/registry"
import EffectSurface from "@/components/effects/effect-surface"
import GridTileContent from "../grid-tile-content"
import { mixHexColor } from "../folder-drop"
import type { DragSession, Intent } from "./model"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

// Fractional translates rasterize the 8px texture cells and the icon at
// half-pixel offsets, which reads as a slide on grab and drop.
const snapToWholePixels: Modifier = ({ transform }) => ({
  ...transform,
  x: Math.round(transform.x),
  y: Math.round(transform.y),
})
const ignoreOpen = () => {}

// Floating drag preview, portalled into document.body to escape clipping.
export default function GridDragOverlay({
  dragging,
  intent,
  preview,
  columns,
  columnStep,
  rowStep,
  gridGap,
  contentScale = 1,
}: {
  dragging: DragSession | null
  intent: Intent
  preview: boolean
  columns: number
  columnStep: number
  rowStep: number
  gridGap: number
  contentScale?: number
}) {
  const folderRadius = useHomeSettingsStore((state) =>
    dragging?.item.kind === "folder" ? state.folderRadius : undefined
  )
  const releaseProgress =
    dragging &&
    (intent.kind === "grid" ||
      intent.kind === "folder" ||
      intent.kind === "reorder" ||
      intent.kind === "todo-reorder")
      ? intent.releaseProgress
      : dragging?.sourceFolderId
        ? 0
        : 1
  const folderColor = intent.kind === "folder" ? intent.color : undefined
  const folderProgress = intent.kind === "folder" ? intent.progress : 0
  const overlayItem = useMemo(
    () =>
      !dragging
        ? undefined
        : folderColor !== undefined && dragging.item.kind === "tab"
          ? {
              ...dragging.item,
              color: mixHexColor(
                dragging.item.color,
                folderColor,
                folderProgress
              ),
            }
          : dragging.sourceFolderId &&
              dragging.sourceFolderColor &&
              dragging.item.kind === "tab"
            ? {
                ...dragging.item,
                color: mixHexColor(
                  dragging.sourceFolderColor,
                  dragging.item.color,
                  releaseProgress
                ),
              }
            : dragging.item,
    [dragging, folderColor, folderProgress, releaseProgress]
  )
  // A folder tab starts as its source row and only grows (releaseProgress);
  // grid items keep their grab size for the whole drag.
  const compactSize = dragging?.sourceFolderId
    ? { width: dragging.width, height: dragging.height }
    : undefined
  const fullWidth = dragging
    ? columnStep * itemWidth(dragging.item, columns) - gridGap
    : undefined
  const fullHeight = dragging
    ? itemHeight(dragging.item) * rowStep - gridGap
    : undefined
  const overlayWidth =
    dragging && compactSize && fullWidth !== undefined
      ? compactSize.width + (fullWidth - compactSize.width) * releaseProgress
      : dragging?.width
  const overlayHeight =
    dragging && compactSize && fullHeight !== undefined
      ? compactSize.height + (fullHeight - compactSize.height) * releaseProgress
      : dragging?.height
  const searchWidget = dragging?.item.kind === "search-minimal"
  const contentWidth =
    overlayWidth === undefined ? undefined : overlayWidth / contentScale
  const contentHeight =
    overlayHeight === undefined ? undefined : overlayHeight / contentScale

  return createPortal(
    <DragOverlay
      zIndex={1000}
      modifiers={preview ? [snapToWholePixels] : undefined}
      dropAnimation={
        dragging?.sourceFolderId ||
        (intent.kind === "folder" && intent.ready) ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? null
          : {
              duration: 280,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              sideEffects: defaultDropAnimationSideEffects({
                styles: { active: { opacity: "0" } },
              }),
            }
      }
    >
      {dragging && (
        <div
          aria-hidden="true"
          data-tab-grid-overlay
          className="pointer-events-none relative cursor-grabbing"
          style={{ width: overlayWidth, height: overlayHeight }}
        >
          <div
            className={`absolute top-0 left-0 isolate ${dragging.item.kind === "tab" ? "" : searchWidget ? "overflow-hidden rounded-full [&_[data-search-input-shell]]:border-transparent [&_[data-search-input-shell]]:ring-0" : "overflow-hidden rounded-2xl"}`}
            style={{
              borderRadius: folderRadius,
              width: contentWidth,
              height: contentHeight,
              transform: `scale(${contentScale})`,
              transformOrigin: "top left",
              // No lift shadow while previewing. The settled tile's 1px border
              // must stay, or the padding box shifts and children slide.
              boxShadow:
                !preview &&
                releaseProgress > 0 &&
                getComponentDefinition(dragging.item.kind).tileBorder
                  ? `0 10px 15px -3px rgb(0 0 0 / ${0.1 * releaseProgress}), 0 4px 6px -4px rgb(0 0 0 / ${0.1 * releaseProgress})`
                  : undefined,
              borderWidth:
                searchWidget ||
                !getComponentDefinition(dragging.item.kind).tileBorder
                  ? 0
                  : preview
                    ? getComponentDefinition(dragging.item.kind).tileBorder
                      ? 1
                      : 0
                    : releaseProgress > 0
                      ? 1
                      : 0,
              borderStyle: "solid",
              borderColor:
                dragging.item.kind === "folder"
                  ? "transparent"
                  : preview
                    ? "var(--tile-border)"
                    : `color-mix(in srgb, var(--tile-border) ${releaseProgress * 100}%, transparent)`,
            }}
          >
            {dragging.todoTask ? (
              <div className="relative flex h-full items-center gap-2 px-3 py-2">
                <EffectSurface
                  color={dragging.item.color}
                  textureId={dragging.todoTask.id}
                />
                <span className="relative z-10 flex size-4 shrink-0 items-center justify-center rounded-sm border border-foreground/50">
                  {dragging.todoTask.done && <Check size={12} />}
                </span>
                <span className="relative z-10 min-w-0 flex-1 truncate text-sm font-medium">
                  {dragging.todoTask.text}
                </span>
              </div>
            ) : (
              <GridTileContent
                item={overlayItem ?? dragging.item}
                onOpen={ignoreOpen}
                preview
                compactTab={releaseProgress < 1}
              />
            )}
          </div>
        </div>
      )}
    </DragOverlay>,
    document.body
  )
}
