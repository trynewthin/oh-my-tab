import { useStackScroll } from "../collection/use-stack-scroll"
import { Checkbox } from "@/components/ui/checkbox"
import EffectSurface from "@/components/effects/effect-surface"
import {
  useState,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type FormEvent,
} from "react"
import { Plus, Tray, Trash } from "@phosphor-icons/react"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { CollectionGrid, CollectionViewport } from "../collection/layout"
import type { TodoItem } from "@/lib/grid/types"
import { TODO_GAP_ID } from "../drag/model"
import { useTranslation } from "react-i18next"
import TodoTaskRow from "./task-row"

export default function TodoList({
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
