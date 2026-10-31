import { useCallback, useRef, type CSSProperties, type ReactNode } from "react"
import { useDraggable } from "@dnd-kit/core"
import type { TodoTaskDragData } from "../drag-types"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export default function TodoTaskRow({
  id,
  todoId,
  surface,
  sortable,
  stacked,
  className,
  style,
  done,
  children,
}: {
  id: string
  todoId: string
  surface: "preview" | "dialog"
  sortable: boolean
  stacked: boolean
  className: string
  style?: CSSProperties
  done: boolean
  children: ReactNode
}) {
  const radius = useHomeSettingsStore((state) => state.tabAppearance.radius)
  const node = useRef<HTMLDivElement | null>(null)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `todo-task:${surface}:${todoId}:${id}`,
    disabled: !sortable,
    data: {
      type: "todo-task",
      taskId: id,
      todoId,
      surface,
      getElement: () => node.current,
    } satisfies TodoTaskDragData,
  })
  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      node.current = element
      setNodeRef(element)
    },
    [setNodeRef]
  )
  return (
    <div
      ref={ref}
      data-stack-row={stacked ? "" : undefined}
      data-tab-id={id}
      data-todo-done={done}
      className={`${className} ${sortable ? "cursor-grab" : ""} ${isDragging ? "invisible" : ""}`}
      style={{ ...style, borderRadius: radius }}
      {...attributes}
      onMouseDown={(event) => {
        if (!sortable || event.button !== 0) return
        event.stopPropagation()
        listeners?.onMouseDown?.(event)
      }}
      onKeyDown={(event) => {
        if (!sortable || event.target !== event.currentTarget) return
        // Capture only the drag-activation keys, and stop them from also
        // starting a drag on the surrounding tile. Everything else — Escape in
        // particular — must bubble to document-level listeners.
        if (event.key !== " " && event.key !== "Enter") return
        event.stopPropagation()
        listeners?.onKeyDown?.(event)
      }}
      onDragStart={(event) => event.preventDefault()}
    >
      {children}
    </div>
  )
}
