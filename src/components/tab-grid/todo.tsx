import { useStackScroll } from "./collection/use-stack-scroll"
import { Checkbox } from "@/components/ui/checkbox"
import EffectSurface from "@/components/effects/effect-surface"
import {
  useCallback,
  useState,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type FormEvent,
} from "react"
import { Plus, ListChecks, Tray, Check, X, Trash } from "@phosphor-icons/react"
import ComponentBackground from "./shared/component-background"
import { useTabGridStore } from "@/stores/tab-grid-store"
import CollectionExpansion from "./collection/expansion"
import { CollectionGrid, CollectionViewport } from "./collection/layout"
import {
  CollectionCardHeader,
  CollectionHeaderAction,
  CollectionTitleButton,
} from "./collection/header"
import type { TodoItem, TodoTask } from "@/lib/grid/types"
import { useDraggable } from "@dnd-kit/core"
import type { TodoTaskDragData } from "./drag-types"
import { TODO_GAP_ID } from "./use-grid-drag"
import { useTranslation } from "react-i18next"

function focusDraft(node: HTMLInputElement | null) {
  if (node) {
    node.focus()
    node.scrollIntoView({ block: "nearest" })
  }
}

function TodoTaskRow({
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
      style={style}
      {...attributes}
      onMouseDown={(event) => {
        if (!sortable || event.button !== 0) return
        event.stopPropagation()
        listeners?.onMouseDown?.(event)
      }}
      onKeyDown={(event) => {
        if (sortable && event.target === event.currentTarget) {
          event.stopPropagation()
          listeners?.onKeyDown?.(event)
        }
      }}
      onDragStart={(event) => event.preventDefault()}
    >
      {children}
    </div>
  )
}

function TodoList({
  item,
  preview,
  showInput = true,
  showDelete = false,
  draftRow,
}: {
  item: TodoItem
  preview: boolean
  showInput?: boolean
  showDelete?: boolean
  draftRow?: ReactNode
}) {
  const cards = item.size === "large" && !showInput && !showDelete
  const { t } = useTranslation()
  const topBleed = cards ? 28 : 0
  const viewportRef = useRef<HTMLDivElement>(null)
  const [rowHeight, setRowHeight] = useState(44)
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!cards || !viewport) return
    const resize = () =>
      setRowHeight(Math.max(1, (viewport.clientHeight - topBleed - 24) / 4))
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [cards, topBleed])
  useStackScroll(viewportRef, {
    enabled: cards,
    topBleed,
    rowHeight,
    rowStep: rowHeight + 8,
    revision: `${item.tasks.map((task) => task.id).join(",")}:${!!draftRow}`,
  })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [text, setText] = useState("")
  const update = useTabGridStore((state) => state.updateTodoTasks)
  function add(event: FormEvent) {
    event.preventDefault()
    const title = text.trim()
    if (!title || preview || item.tasks.length >= 200) return
    update(item.id, (tasks) => [
      { id: crypto.randomUUID(), text: title, done: false },
      ...tasks,
    ])
    setText("")
  }
  return (
    <>
      <CollectionViewport
        ref={viewportRef}
        expanded={showDelete}
        label={showDelete ? t("grid.todo.listLabel", { name: item.name }) : undefined}
        style={
          cards ? { marginTop: -topBleed, paddingTop: topBleed } : undefined
        }
        className="relative"
      >
        <CollectionGrid
          expanded={showDelete}
          data-expanded-collection-grid={showDelete ? "" : undefined}
          data-todo-surface={
            showDelete ? "dialog" : cards ? "preview" : undefined
          }
          data-todo-id={showDelete || cards ? item.id : undefined}
          style={
            cards && (item.tasks.length > 0 || draftRow)
              ? { paddingBottom: "var(--stack-bottom, 0px)" }
              : undefined
          }
          className={
            item.tasks.length === 0 && !draftRow ? "h-full" : undefined
          }
        >
          {item.tasks.length === 0 && !draftRow && (
            <div
              role="status"
              aria-label={t("grid.todo.empty")}
              className="flex h-full items-center justify-center text-muted-foreground/50"
            >
              <Tray size={40} aria-hidden="true" />
            </div>
          )}
          {draftRow && (
            <div
              role="listitem"
              data-stack-row={cards || showDelete ? "" : undefined}
              data-tab-id="__todo-draft__"
              style={{
                height: cards ? rowHeight : showDelete ? 48 : 44,
                marginBottom: showDelete ? 0 : 8,
              }}
              className="relative"
            >
              {draftRow}
            </div>
          )}
          {item.tasks.map((task) => (
            <TodoTaskRow
              key={task.id}
              id={task.id}
              todoId={item.id}
              surface={showDelete ? "dialog" : "preview"}
              sortable={
                !preview && (showDelete || cards) && task.id !== TODO_GAP_ID
              }
              stacked={cards || showDelete}
              className={
                task.id === TODO_GAP_ID
                  ? `relative ${showDelete ? "h-12 min-w-0" : "mb-2 min-h-11"}`
                  : `group/task relative isolate flex items-center gap-2 ${cards || showDelete ? `${showDelete ? "h-12 min-w-0" : "mb-2 min-h-11"} overflow-hidden rounded-2xl border border-border/60 px-3 py-2` : "py-1.5"}`
              }
              style={cards ? { height: rowHeight, minHeight: 0 } : undefined}
              done={task.done}
            >
              {task.id !== TODO_GAP_ID && (
                <>
                  {(cards || showDelete) && (
                    <div
                      className={`pointer-events-none absolute inset-0 -z-10 ${task.done ? "grayscale" : ""}`}
                    >
                      <EffectSurface
                        color={item.color}
                        textureId={task.id}
                        animated={
                          !preview && !!item.dynamicEffect && !task.done
                        }
                      />
                    </div>
                  )}
                  <Checkbox
                    aria-label={t("grid.todo.completeTask", {
                      text: task.text,
                    })}
                    checked={task.done}
                    disabled={preview}
                    onCheckedChange={() =>
                      update(item.id, (tasks) =>
                        tasks.map((t) =>
                          t.id === task.id ? { ...t, done: !t.done } : t
                        )
                      )
                    }
                    className="size-4 shrink-0 cursor-pointer"
                  />
                  <span
                    className={`min-w-0 flex-1 truncate text-[13px] font-medium sm:text-sm ${task.done ? "text-muted-foreground" : ""}`}
                  >
                    {task.text}
                  </span>
                  {showDelete && (
                    <button
                      type="button"
                      aria-label={
                        confirmDelete === task.id
                          ? t("grid.todo.confirmDeleteTask", {
                              text: task.text,
                            })
                          : t("grid.todo.deleteTask", { text: task.text })
                      }
                      disabled={preview}
                      onClick={() => {
                        if (confirmDelete !== task.id) {
                          setConfirmDelete(task.id)
                          return
                        }
                        update(item.id, (tasks) =>
                          tasks.filter((t) => t.id !== task.id)
                        )
                        setConfirmDelete(null)
                      }}
                      onBlur={() =>
                        setConfirmDelete((current) =>
                          current === task.id ? null : current
                        )
                      }
                      className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      {confirmDelete === task.id ? (
                        <span className="px-1 text-xs font-medium text-destructive">
                          {t("grid.todo.confirmDelete")}
                        </span>
                      ) : (
                        <Trash size={16} />
                      )}
                    </button>
                  )}
                </>
              )}
            </TodoTaskRow>
          ))}
        </CollectionGrid>
      </CollectionViewport>
      {showInput && (
        <form
          onSubmit={add}
          className="mt-1 flex shrink-0 items-center gap-1 border-t border-border/50 pt-2"
        >
          <input
            aria-label={t("grid.todo.newTodo")}
            placeholder={
              item.tasks.length >= 200
                ? t("grid.todo.limitReached")
                : t("grid.todo.addPlaceholder")
            }
            disabled={preview || item.tasks.length >= 200}
            value={text}
            maxLength={200}
            onChange={(e) => setText(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring sm:text-sm"
          />
          <button
            type="submit"
            aria-label={t("grid.todo.addTodo")}
            disabled={preview || !text.trim() || item.tasks.length >= 200}
            className="rounded p-1 hover:bg-muted disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </form>
      )}
    </>
  )
}

export default function Todo({
  item,
  preview = false,
  tasks,
}: {
  item: TodoItem
  preview?: boolean
  tasks?: TodoTask[]
}) {
  const displayItem = tasks ? { ...item, tasks } : item
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState("")
  const update = useTabGridStore((state) => state.updateTodoTasks)
  const remaining = displayItem.tasks.filter((t) => !t.done)
  const next = remaining[0]
  const draftRow = adding ? (
    <form
      className="relative isolate flex h-full min-h-0 items-center gap-1 overflow-hidden rounded-2xl border border-border/60 px-3 py-2"
      onSubmit={(event) => {
        event.preventDefault()
        const text = draft.trim()
        if (!text || item.tasks.length >= 200) return
        update(item.id, (tasks) =>
          tasks.length < 200
            ? [{ id: crypto.randomUUID(), text, done: false }, ...tasks]
            : tasks
        )
        setAdding(false)
        setDraft("")
      }}
    >
      <EffectSurface color={item.color} textureId={`${item.id}-draft`} />
      <input
        ref={focusDraft}
        aria-label={t("grid.todo.newTodo")}
        maxLength={200}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            (event.nativeEvent.isComposing || event.keyCode === 229)
          )
            event.preventDefault()
          if (event.key === "Escape") {
            event.stopPropagation()
            setAdding(false)
            setDraft("")
          }
        }}
        className="relative z-10 min-w-0 flex-1 border-0 bg-transparent text-[13px] font-medium caret-foreground shadow-none ring-0 outline-none focus-visible:ring-0 sm:text-sm"
      />
      <button
        type="submit"
        aria-label={t("grid.todo.confirmAdd")}
        disabled={!draft.trim()}
        className="relative z-10 rounded-full p-1 hover:bg-muted disabled:opacity-40"
      >
        <Check size={16} className="text-green-600 dark:text-green-400" />
      </button>
      <button
        type="button"
        aria-label={t("grid.todo.cancelAdd")}
        onClick={() => {
          setAdding(false)
          setDraft("")
        }}
        className="relative z-10 rounded-full p-1 hover:bg-muted"
      >
        <X size={16} className="text-red-600 dark:text-red-400" />
      </button>
    </form>
  ) : undefined

  return (
    <>
      <div className="relative isolate h-full w-full overflow-hidden rounded-[inherit]">
        <ComponentBackground
          color={item.color}
          animated={!preview && !!item.dynamicEffect}
        />
        <section
          aria-label={item.name}
          className={`relative z-10 flex h-full min-h-0 cursor-default text-card-foreground ${item.size === "small" ? "items-center gap-2 px-3" : "flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-3"}`}
          onClick={(event) => {
            if (
              preview ||
              (event.target as HTMLElement).closest(
                "input, button, form, [data-slot=checkbox]"
              )
            )
              return
            setOpen(true)
          }}
          onMouseDown={(event) => {
            if (
              (event.target as HTMLElement).closest(
                "input, textarea, button:not([data-todo-drag-surface])"
              )
            )
              event.stopPropagation()
          }}
        >
          {item.size === "small" ? (
            <>
              {next && (
                <Checkbox
                  aria-label={t("grid.todo.completeTask", { text: next.text })}
                  checked={false}
                  disabled={preview}
                  onCheckedChange={() =>
                    update(item.id, (tasks) =>
                      tasks.map((t) =>
                        t.id === next.id ? { ...t, done: true } : t
                      )
                    )
                  }
                  className="size-4 shrink-0"
                />
              )}
              <button
                type="button"
                disabled={preview}
                onClick={() => setOpen(true)}
                data-todo-drag-surface
                aria-label={t("grid.todo.openTodo", { name: item.name })}
                className="min-w-0 flex-1 truncate text-left text-[13px] font-medium sm:text-sm"
              >
                {next?.text ??
                  (item.tasks.length
                    ? t("grid.todo.allDone")
                    : t("grid.todo.addPlaceholder"))}
              </button>
              <button
                type="button"
                disabled={preview}
                onClick={() => setOpen(true)}
                aria-label={t("grid.todo.viewList")}
                className="flex shrink-0 items-center gap-1 rounded p-1 text-xs text-muted-foreground hover:bg-muted"
              >
                <ListChecks size={16} />
                {remaining.length}
              </button>
            </>
          ) : (
            <>
              <CollectionCardHeader className="pr-0.5 pl-0.5 sm:pr-1 sm:pl-1">
                <CollectionTitleButton
                  data-todo-drag-surface
                  disabled={preview}
                  onClick={() => setOpen(true)}
                  className="font-semibold"
                  aria-label={t("grid.todo.openTodo", { name: item.name })}
                >
                  {item.name}
                </CollectionTitleButton>
                {item.size === "large" ? (
                  <CollectionHeaderAction
                    label={t("grid.todo.addTodo")}
                    disabled={preview || item.tasks.length >= 200}
                    onClick={() => {
                      if (!adding) setDraft("")
                      setAdding(true)
                    }}
                    className="size-5 p-0"
                  >
                    <Plus size={16} />
                  </CollectionHeaderAction>
                ) : (
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {t("grid.todo.tasksRemaining", {
                      count: remaining.length,
                    })}
                  </span>
                )}
              </CollectionCardHeader>
              <TodoList
                item={displayItem}
                preview={preview}
                showInput={item.size !== "large"}
                draftRow={
                  item.size === "large" && adding && !open
                    ? draftRow
                    : undefined
                }
              />
            </>
          )}
        </section>
      </div>
      {open && (
        <CollectionExpansion
          itemId={item.id}
          onClose={() => {
            setOpen(false)
            setAdding(false)
          }}
          headerActions={
            <CollectionHeaderAction
              label={t("grid.todo.addTodo")}
              disabled={preview || item.tasks.length >= 200}
              onClick={() => {
                if (!adding) setDraft("")
                setAdding(true)
              }}
              className="size-8"
            >
              <Plus size={16} />
            </CollectionHeaderAction>
          }
        >
          <div
            className="flex min-h-0 flex-1 flex-col"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <TodoList
              item={displayItem}
              preview={preview}
              showDelete
              showInput={false}
              draftRow={draftRow}
            />
          </div>
        </CollectionExpansion>
      )}
    </>
  )
}
