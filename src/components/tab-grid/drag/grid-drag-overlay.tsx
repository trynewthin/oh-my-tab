import { Check } from "@phosphor-icons/react"
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

// Fractional overlay transforms make the 8px texture cells and the icon
// rasterize at half-pixel offsets (the slight slide visible on grab and
// drop). Preview drags snap the translate to whole pixels.
const snapToWholePixels: Modifier = ({ transform }) => ({
  ...transform,
  x: Math.round(transform.x),
  y: Math.round(transform.y),
})

// The floating drag preview: derives the overlay tile from the frozen drag
// session (source-row growth, folder color mixing) and renders it through a
// portal into document.body so it escapes every clipping ancestor.
export default function GridDragOverlay({
  dragging,
  intent,
  preview,
  columns,
  columnStep,
  rowStep,
  gridGap,
  previewScale = 1,
}: {
  dragging: DragSession | null
  intent: Intent
  preview: boolean
  columns: number
  columnStep: number
  rowStep: number
  gridGap: number
  previewScale?: number
}) {
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
  const overlayItem = !dragging
    ? undefined
    : intent.kind === "folder" && dragging.item.kind === "tab"
      ? {
          ...dragging.item,
          color: mixHexColor(
            dragging.item.color,
            intent.color,
            intent.progress
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
        : dragging.item
  // A tab dragged out of a folder starts as its source row and only ever
  // grows into the full tile (releaseProgress). Grid items keep their grab
  // size for the whole drag — approaching a folder never resizes the overlay.
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
  const contentScale = preview ? previewScale : 1
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
            className="absolute top-0 left-0 isolate overflow-hidden rounded-2xl"
            style={{
              width: contentWidth,
              height: contentHeight,
              transform: `scale(${contentScale})`,
              transformOrigin: "top left",
              // Previews keep the resting look: no lift shadow, and the
              // overlay carries the same border as the settled tile so the
              // padding box (and every inset-0/right-anchored child) stays
              // pixel-identical while dragging — a missing 1px border reads
              // as the icon and texture sliding on grab and drop.
              boxShadow:
                !preview && releaseProgress > 0
                  ? `0 10px 15px -3px rgb(0 0 0 / ${0.1 * releaseProgress}), 0 4px 6px -4px rgb(0 0 0 / ${0.1 * releaseProgress})`
                  : undefined,
              borderWidth: preview
                ? getComponentDefinition(dragging.item.kind).tileBorder
                  ? 1
                  : 0
                : releaseProgress > 0
                  ? 1
                  : 0,
              borderStyle: "solid",
              borderColor: preview
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
                onOpen={() => {}}
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
