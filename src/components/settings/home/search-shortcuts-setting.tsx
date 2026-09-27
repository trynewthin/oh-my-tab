import { Plus, Trash } from "@phosphor-icons/react"
import { useRef, useState, type DragEvent, type PointerEvent } from "react"
import { useTranslation } from "react-i18next"

import { searchShortcutIcons } from "@/components/search/search-shortcut-icons"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  MAX_SEARCH_SHORTCUTS,
  type SearchShortcutControl,
} from "@/lib/search-shortcuts"
import { systemActionIdsFor, systemActionRegistry } from "@/lib/system-actions"
import { cn } from "@/lib/utils"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import SettingItem from "../shared/setting-item"
import { settingsControlSurface } from "../shared/control-styles"

const availableActions = systemActionIdsFor("grid-button")
const SLOT_WIDTH = 24
const SLOT_GAP = 4
const TRACK_PADDING = 8

function boundaryLeft(index: number) {
  return TRACK_PADDING - SLOT_GAP / 2 + index * (SLOT_WIDTH + SLOT_GAP)
}

function AddShortcut({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const add = useHomeSettingsStore((state) => state.addSearchShortcut)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="size-6 rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
            disabled={disabled}
            aria-label={t("settings.home.searchShortcutAdd")}
            title={t("settings.home.searchShortcutAdd")}
          />
        }
      >
        <Plus className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 gap-1 p-2">
        {availableActions.map((action) => {
          const Icon = searchShortcutIcons[action]
          return (
            <Button
              key={action}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                add(action)
                setOpen(false)
              }}
            >
              <Icon />
              {t(systemActionRegistry[action].labelKey)}
            </Button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

export default function SearchShortcutsSetting() {
  const { t } = useTranslation()
  const track = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const config = useHomeSettingsStore((state) => state.searchShortcuts)
  const addBoundary = useHomeSettingsStore(
    (state) => state.setSearchShortcutBoundary
  )
  const move = useHomeSettingsStore((state) => state.moveSearchShortcut)
  const remove = useHomeSettingsStore((state) => state.removeSearchShortcut)

  function insertionIndex(clientX: number) {
    const slots = track.current?.querySelectorAll<HTMLElement>(
      "[data-shortcut-slot]"
    )
    if (!slots) return 0
    const index = Array.from(slots).findIndex((slot) => {
      const bounds = slot.getBoundingClientRect()
      return clientX < bounds.left + bounds.width / 2
    })
    return index < 0 ? slots.length : index
  }

  function moveBoundary(event: PointerEvent<HTMLDivElement>) {
    const index = insertionIndex(event.clientX)
    if (
      index !== useHomeSettingsStore.getState().searchShortcuts.collapseBefore
    )
      addBoundary(index)
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    if (!draggingId) return
    event.preventDefault()
    const id = event.dataTransfer.getData("text/plain") || draggingId
    const from = config.controls.findIndex((control) => control.id === id)
    const before = insertionIndex(event.clientX)
    if (from >= 0) move(id, before - (from < before ? 1 : 0))
    setDraggingId(null)
    setDropIndex(null)
  }

  return (
    <SettingItem
      label={t("settings.home.searchShortcuts")}
      labelId="search-shortcuts-label"
      description={t("settings.home.searchShortcutHint")}
      wide
    >
      <div className="min-w-0 py-1">
        <div
          role="group"
          aria-labelledby="search-shortcuts-label"
          className={cn(
            "ml-auto flex w-max max-w-full min-w-0 items-center overflow-hidden rounded-2xl",
            settingsControlSurface
          )}
          onDragOver={(event) => {
            if (!draggingId) return
            event.preventDefault()
            event.dataTransfer.dropEffect = "move"
            setDropIndex(insertionIndex(event.clientX))
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node))
              setDropIndex(null)
          }}
          onDrop={drop}
        >
          <div className="min-w-0 [scrollbar-width:thin] overflow-x-auto">
            <div
              ref={track}
              className="relative flex w-max items-center gap-1 px-2 py-1"
            >
              {config.controls.map((control: SearchShortcutControl, index) => {
                const Icon = searchShortcutIcons[control.action]
                const label = t(systemActionRegistry[control.action].labelKey)
                return (
                  <ContextMenu key={control.id}>
                    <ContextMenuTrigger
                      render={
                        <button
                          type="button"
                          draggable
                          data-shortcut-slot
                          aria-label={label}
                          title={label}
                          className={cn(
                            "flex size-6 shrink-0 cursor-grab items-center justify-center rounded-full border border-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing",
                            index < config.collapseBefore
                              ? "text-muted-foreground hover:bg-background/70"
                              : "bg-background text-foreground shadow-sm hover:bg-background/80",
                            draggingId === control.id && "opacity-40"
                          )}
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "move"
                            event.dataTransfer.setData("text/plain", control.id)
                            setDraggingId(control.id)
                          }}
                          onDragEnd={() => {
                            setDraggingId(null)
                            setDropIndex(null)
                          }}
                          onKeyDown={(event) => {
                            if (
                              event.altKey &&
                              (event.key === "ArrowLeft" ||
                                event.key === "ArrowRight")
                            ) {
                              event.preventDefault()
                              move(
                                control.id,
                                index + (event.key === "ArrowLeft" ? -1 : 1)
                              )
                            }
                            if (
                              event.key === "Delete" ||
                              event.key === "Backspace"
                            ) {
                              event.preventDefault()
                              remove(control.id)
                            }
                          }}
                        />
                      }
                    >
                      <Icon className="size-4" />
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        variant="destructive"
                        onClick={() => remove(control.id)}
                      >
                        <Trash />
                        {t("settings.home.searchShortcutRemove")}
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                )
              })}
              {dropIndex !== null && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 bottom-0 w-0.5 -translate-x-1/2 rounded-full bg-foreground/60"
                  style={{ left: boundaryLeft(dropIndex) }}
                />
              )}
              <div
                role="slider"
                tabIndex={0}
                aria-label={t("settings.home.searchShortcutBoundary")}
                aria-orientation="horizontal"
                aria-valuemin={0}
                aria-valuemax={config.controls.length}
                aria-valuenow={config.collapseBefore}
                aria-valuetext={t("settings.home.searchShortcutHiddenCount", {
                  count: config.collapseBefore,
                })}
                className="absolute top-0 bottom-0 z-10 w-3 -translate-x-1/2 cursor-ew-resize touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ left: boundaryLeft(config.collapseBefore) }}
                onPointerDown={(event) => {
                  event.preventDefault()
                  event.currentTarget.setPointerCapture(event.pointerId)
                  moveBoundary(event)
                }}
                onPointerMove={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId))
                    moveBoundary(event)
                }}
                onPointerUp={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId))
                    event.currentTarget.releasePointerCapture(event.pointerId)
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                    event.preventDefault()
                    addBoundary(
                      config.collapseBefore +
                        (event.key === "ArrowLeft" ? -1 : 1)
                    )
                  }
                  if (event.key === "Home" || event.key === "End") {
                    event.preventDefault()
                    addBoundary(
                      event.key === "Home" ? 0 : config.controls.length
                    )
                  }
                }}
              >
                <span className="absolute inset-y-1 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-primary" />
              </div>
            </div>
          </div>
          <div className="shrink-0 border-l border-border/70 p-1">
            <AddShortcut
              disabled={config.controls.length >= MAX_SEARCH_SHORTCUTS}
            />
          </div>
        </div>
      </div>
    </SettingItem>
  )
}
