import { useStackScroll } from "./use-stack-scroll"
import { Checkbox } from "@/components/ui/checkbox"
import EffectSurface from "@/components/effects/effect-surface"
import {
  useState,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type FormEvent,
} from "react"
import { Plus, ListChecks, Tray, Check, X, Trash } from "@phosphor-icons/react"
import FolderBackground from "./folder-background"
import { useTabGridStore } from "@/stores/tab-grid-store"
import FolderExpansion from "./folder-expansion"
import type { TodoItem } from "./types"

function focusDraft(node: HTMLInputElement | null) {
  if (node) {
    node.focus()
    node.scrollIntoView({ block: "nearest" })
  }
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
      <div
        ref={viewportRef}
        style={
          cards ? { marginTop: -topBleed, paddingTop: topBleed } : undefined
        }
        className="relative min-h-0 flex-1 [scrollbar-width:none] overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl [overflow-anchor:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          style={
            cards && (item.tasks.length > 0 || draftRow)
              ? { paddingBottom: "var(--stack-bottom, 0px)" }
              : undefined
          }
          className={
            item.tasks.length === 0 && !draftRow
              ? "h-full"
              : showDelete
                ? "grid grid-cols-1 gap-3 lg:grid-cols-2"
                : undefined
          }
        >
          {item.tasks.length === 0 && !draftRow && (
            <div
              role="status"
              aria-label="暂无待办"
              className="flex h-full items-center justify-center text-muted-foreground/50"
            >
              <Tray size={40} aria-hidden="true" />
            </div>
          )}
          {draftRow && (
            <div
              data-stack-row={cards ? "" : undefined}
              style={{
                height: cards ? rowHeight : 44,
                marginBottom: showDelete ? 0 : 8,
              }}
              className="relative"
            >
              {draftRow}
            </div>
          )}
          {item.tasks.map((task) => (
            <div
              key={task.id}
              data-stack-row={cards ? "" : undefined}
              className={`group/task relative isolate flex items-center gap-2 ${cards || showDelete ? `${showDelete ? "h-11 min-w-0" : "mb-2 min-h-11"} overflow-hidden rounded-2xl border border-border/60 px-3 py-2` : "py-1.5"}`}
              style={cards ? { height: rowHeight, minHeight: 0 } : undefined}
              data-todo-done={task.done}
            >
              {(cards || showDelete) && (
                <div
                  className={`pointer-events-none absolute inset-0 -z-10 ${task.done ? "grayscale" : ""}`}
                >
                  <EffectSurface
                    color={item.color}
                    textureId={task.id}
                    animated={!preview && !!item.dynamicEffect && !task.done}
                  />
                </div>
              )}
              <Checkbox
                aria-label={`完成 ${task.text}`}
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
                  aria-label={`${confirmDelete === task.id ? "确认删除" : "删除"} ${task.text}`}
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
                      确认删除
                    </span>
                  ) : (
                    <Trash size={16} />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      {showInput && (
        <form
          onSubmit={add}
          className="mt-1 flex shrink-0 items-center gap-1 border-t border-border/50 pt-2"
        >
          <input
            aria-label="新待办"
            placeholder={
              item.tasks.length >= 200 ? "已达到 200 项上限" : "添加待办…"
            }
            disabled={preview || item.tasks.length >= 200}
            value={text}
            maxLength={200}
            onChange={(e) => setText(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring sm:text-sm"
          />
          <button
            type="submit"
            aria-label="添加待办"
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
}: {
  item: TodoItem
  preview?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState("")
  const update = useTabGridStore((state) => state.updateTodoTasks)
  const remaining = item.tasks.filter((t) => !t.done)
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
        aria-label="新待办"
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
        aria-label="确认添加"
        disabled={!draft.trim()}
        className="relative z-10 rounded-full p-1 hover:bg-muted disabled:opacity-40"
      >
        <Check size={16} className="text-green-600 dark:text-green-400" />
      </button>
      <button
        type="button"
        aria-label="取消添加"
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
        <FolderBackground
          color={item.color}
          animated={!preview && !!item.dynamicEffect}
        />
        <section
          aria-label={item.name}
          className={`relative z-10 flex h-full min-h-0 cursor-default text-card-foreground ${item.size === "small" ? "items-center gap-2 px-3" : "flex-col p-3"}`}
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
                  aria-label={`完成 ${next.text}`}
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
                aria-label={`打开${item.name}`}
                className="min-w-0 flex-1 truncate text-left text-[13px] font-medium sm:text-sm"
              >
                {next?.text ?? (item.tasks.length ? "全部完成" : "添加待办…")}
              </button>
              <button
                type="button"
                disabled={preview}
                onClick={() => setOpen(true)}
                aria-label="查看待办清单"
                className="flex shrink-0 items-center gap-1 rounded p-1 text-xs text-muted-foreground hover:bg-muted"
              >
                <ListChecks size={16} />
                {remaining.length}
              </button>
            </>
          ) : (
            <>
              <header className="relative z-20 mb-1 flex shrink-0 items-center justify-between gap-2">
                <button
                  type="button"
                  data-todo-drag-surface
                  disabled={preview}
                  onClick={() => setOpen(true)}
                  className="truncate text-left text-sm font-semibold"
                  aria-label={`打开${item.name}`}
                >
                  {item.name}
                </button>
                {item.size === "large" ? (
                  <button
                    type="button"
                    aria-label="添加待办"
                    disabled={preview || item.tasks.length >= 200}
                    onClick={() => {
                      if (!adding) setDraft("")
                      setAdding(true)
                    }}
                    className="shrink-0 rounded p-1 text-foreground hover:bg-muted disabled:opacity-40"
                  >
                    <Plus size={16} />
                  </button>
                ) : (
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {remaining.length} 项待办
                  </span>
                )}
              </header>
              <TodoList
                item={item}
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
        <FolderExpansion
          folderId={item.id}
          onClose={() => {
            setOpen(false)
            setAdding(false)
          }}
          headerActions={
            <button
              type="button"
              aria-label="添加待办"
              disabled={preview || item.tasks.length >= 200}
              onClick={() => {
                if (!adding) setDraft("")
                setAdding(true)
              }}
              className="flex size-8 items-center justify-center rounded-full text-foreground hover:bg-muted disabled:opacity-40"
            >
              <Plus size={16} />
            </button>
          }
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <TodoList
              item={item}
              preview={preview}
              showDelete
              showInput={false}
              draftRow={draftRow}
            />
          </div>
        </FolderExpansion>
      )}
    </>
  )
}
