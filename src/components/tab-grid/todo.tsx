import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import AddIcon from "@/components/ui/add-icon"
import EffectSurface from "@/components/effects/effect-surface"
import { useState } from "react"
import { Plus, ListChecks, Check, X } from "@phosphor-icons/react"
import ComponentBackground from "./shared/component-background"
import { useTabGridStore } from "@/stores/tab-grid-store"
import CollectionExpansion from "./collection/expansion"
import {
  CollectionCardHeader,
  CollectionHeaderAction,
  CollectionTitleButton,
} from "./collection/header"
import type { TodoItem, TodoTask } from "@/lib/grid/types"
import { useTranslation } from "react-i18next"
import TodoList from "./todo/list"

function focusDraft(node: HTMLInputElement | null) {
  if (node) {
    node.focus()
    node.scrollIntoView({ block: "nearest" })
  }
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
          collection={displayItem}
          closeLabel={t("grid.chrome.closeComponent", {
            label: t("grid.component.todo.label"),
          })}
          onClose={() => {
            setOpen(false)
            setAdding(false)
          }}
          headerActions={
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("grid.todo.addTodo")}
              disabled={preview || item.tasks.length >= 200}
              onClick={() => {
                if (!adding) setDraft("")
                setAdding(true)
              }}
              className="text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
            >
              <AddIcon />
            </Button>
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
