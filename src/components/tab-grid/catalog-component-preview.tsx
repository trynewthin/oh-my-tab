import Todo from "./todo"
import Calendar from "./calendar"
import Ecosystem from "./ecosystem"
import DotArt from "./dot-art"
import SearchTile from "./search-tile"
import type { ComponentProps } from "react"
import {
  componentDefaultName,
  getComponentDefinition,
  type CatalogComponentKind,
  type GridItemSize,
} from "@/lib/grid/registry"
import { useTranslation } from "react-i18next"

function PreviewContent({
  kind,
  detail = false,
  size,
}: {
  kind: CatalogComponentKind
  size?: GridItemSize
  detail?: boolean
}) {
  const { t } = useTranslation()
  const resolved = size ?? getComponentDefinition(kind).defaultSize
  if (kind === "search-minimal" || kind === "search-full") {
    const item =
      kind === "search-minimal"
        ? ({
            id: `${kind}-preview`,
            kind,
            name: componentDefaultName(kind, t),
            size: "small",
            color: getComponentDefinition(kind).defaultColor,
          } as const)
        : ({
            id: `${kind}-preview`,
            kind,
            name: componentDefaultName(kind, t),
            size: "medium",
            color: getComponentDefinition(kind).defaultColor,
          } as const)
    return (
      <div
        className={`${detail ? "w-full" : "mx-auto w-full max-w-60"} overflow-hidden rounded-2xl`}
        style={{
          height: detail
            ? kind === "search-minimal"
              ? 56
              : 112
            : kind === "search-minimal"
              ? 40
              : 80,
        }}
      >
        <SearchTile preview item={item} />
      </div>
    )
  }
  if (kind === "todo")
    return (
      <div
        className={`mx-auto w-full max-w-60 overflow-hidden rounded-2xl border ${resolved === "small" ? "aspect-[4/1]" : resolved === "medium" ? "aspect-[2/1]" : "aspect-square"}`}
      >
        <Todo
          preview
          item={{
            id: "todo-preview",
            kind: "todo",
            name: componentDefaultName(kind, t),
            size:
              resolved === "small" || resolved === "medium"
                ? resolved
                : "large",
            color: getComponentDefinition(kind).defaultColor,
            tasks: [
              { id: "1", text: t("grid.dialog.previewTaskPlan"), done: true },
              { id: "2", text: t("grid.dialog.previewTaskRead"), done: false },
            ],
          }}
        />
      </div>
    )
  if (kind === "calendar")
    return (
      <div
        className={`mx-auto w-full overflow-hidden rounded-2xl border ${!detail ? "aspect-square max-w-60" : resolved === "small" ? "aspect-[4/1] max-w-60" : resolved === "medium" ? "aspect-square max-w-28" : "aspect-square max-w-60"}`}
      >
        <Calendar
          preview
          item={{
            id: "calendar-preview",
            kind: "calendar",
            name: componentDefaultName(kind, t),
            size:
              resolved === "small" || resolved === "medium"
                ? resolved
                : "large",
            color: getComponentDefinition(kind).defaultColor,
          }}
        />
      </div>
    )
  return kind === "ecosystem" ? (
    <div
      className={
        detail
          ? "size-40 [&>div]:p-0"
          : "mx-auto aspect-square w-full max-w-60 [&>div]:p-0"
      }
    >
      <Ecosystem
        preview
        animated={false}
        item={{
          id: "ecosystem-preview",
          kind: "ecosystem",
          name: componentDefaultName(kind, t),
          size: "large",
          color: getComponentDefinition(kind).defaultColor,
          species: "flowers",
          plants: [],
        }}
      />
    </div>
  ) : (
    <div
      className={
        detail
          ? "flex size-40 items-center justify-center"
          : "mx-auto flex aspect-square w-full max-w-60 items-center justify-center"
      }
    >
      <div className="aspect-square w-full">
        <DotArt
          pixels={Array.from({ length: 576 }, (_, i) => {
            const x = i % 24
            const y = Math.floor(i / 24)
            if (x < 3 || x > 20 || y < 3 || y > 20) return ""
            if (x >= 16 && x <= 18 && y >= 5 && y <= 7) return "#f4c76b"
            if (y >= 12 + Math.abs(x - 15) && y <= 20) return "#3291ff"
            if (y >= 8 + Math.abs(x - 8) && y <= 20) return "#75c8e8"
            return ""
          })}
        />
      </div>
    </div>
  )
}

export default function CatalogComponentPreview(
  props: ComponentProps<typeof PreviewContent>
) {
  if (props.detail) return <PreviewContent {...props} />
  return (
    <div className="[container-type:inline-size] mx-auto aspect-square w-full max-w-48">
      <div className="size-60 origin-top-left [transform:scale(calc(100cqw/240px))]">
        <PreviewContent {...props} />
      </div>
    </div>
  )
}
