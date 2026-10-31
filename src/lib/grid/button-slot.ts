import {
  buttonSlotCapacity,
  getComponentDefinition,
  isComponentSize,
} from "./registry"
import type {
  GridItem,
  ButtonSlotItem,
  ButtonSlotControl,
  TabItem,
  TabEntry,
  ButtonItem,
} from "./types"
import { reconcileLayouts, type GridPositions } from "./grid-layout"
import { validQuickBarControl } from "@/lib/quick-bar"
import { isActiveSystemAction } from "@/lib/system-actions"
import { validTabIcon } from "./tab-icon"

export { buttonSlotCapacity } from "./registry"

export function appendButtonSlotControl(
  slot: ButtonSlotItem,
  control: ButtonSlotControl
): ButtonSlotItem | null {
  if (
    !validButtonSlotControl(control) ||
    slot.controls.length >= buttonSlotCapacity(slot.size) ||
    slot.controls.some((entry) => entry.id === control.id) ||
    (control.kind === "system" && !isActiveSystemAction(control.action))
  )
    return null
  return { ...slot, controls: [...slot.controls, control] }
}

export function validButtonSlotControl(
  value: unknown
): value is ButtonSlotControl {
  if (!validQuickBarControl(value)) return false
  const control = value as ButtonSlotControl
  if (control.kind === "site" && !validTabIcon(control.icon)) return false
  const origin = control.origin
  if (origin === undefined) return true
  return (
    !!origin &&
    typeof origin === "object" &&
    typeof origin.color === "string" &&
    /^#[0-9a-f]{6}$/i.test(origin.color) &&
    (origin.dynamicEffect === undefined ||
      typeof origin.dynamicEffect === "boolean") &&
    (control.kind === "site"
      ? isComponentSize("tab", control.origin?.size)
      : typeof control.origin?.name === "string" &&
        control.origin.name.trim().length > 0)
  )
}

function controlFromItem(
  item: TabItem | TabEntry | ButtonItem,
  fallbackColor = getComponentDefinition("tab").defaultColor
): ButtonSlotControl {
  return "action" in item
    ? {
        id: item.id,
        kind: "system",
        action: item.action,
        origin: {
          name: item.name,
          color: item.color,
          dynamicEffect: item.dynamicEffect,
        },
      }
    : {
        id: item.id,
        kind: "site",
        name: item.name,
        url: item.url,
        icon: item.icon,
        origin: {
          size: item.size ?? "small",
          color: item.color ?? fallbackColor,
          dynamicEffect: item.dynamicEffect,
        },
      }
}

export function acceptsButtonSlot(
  slot: ButtonSlotItem,
  item: GridItem
): boolean {
  if (item.kind !== "tab" && item.kind !== "button") return false
  const control = controlFromItem(item)
  return (
    slot.controls.length < buttonSlotCapacity(slot.size) &&
    !slot.controls.some((entry) => entry.id === control.id) &&
    validButtonSlotControl(control) &&
    (control.kind !== "system" || isActiveSystemAction(control.action))
  )
}

export type SlotTransfer = {
  itemId: string
  slotId: string
  fromFolderId?: string
}

export function transferIntoButtonSlot(
  state: { items: GridItem[]; layouts: Record<number, GridPositions> },
  move: SlotTransfer
) {
  const slot = state.items.find((item) => item.id === move.slotId)
  const folder = move.fromFolderId
    ? state.items.find((item) => item.id === move.fromFolderId)
    : undefined
  const source = move.fromFolderId
    ? folder?.kind === "folder"
      ? folder.tabs.find((tab) => tab.id === move.itemId)
      : undefined
    : state.items.find(
        (item) =>
          item.id === move.itemId &&
          (item.kind === "tab" || item.kind === "button")
      )
  if (slot?.kind !== "button-slot" || !source) return null
  const control = controlFromItem(
    source as TabEntry | ButtonItem,
    folder?.color
  )
  const updatedSlot = appendButtonSlotControl(slot, control)
  if (!updatedSlot) return null
  const items = state.items
    .filter((item) => move.fromFolderId || item.id !== source.id)
    .map((item): GridItem => {
      if (item.id === slot.id && item.kind === "button-slot") return updatedSlot
      if (item.id === move.fromFolderId && item.kind === "folder")
        return {
          ...item,
          tabs: item.tabs.filter((tab) => tab.id !== source.id),
        }
      return item
    })
  const layouts = Object.fromEntries(
    Object.entries(state.layouts).map(([columns, layout]) => [
      columns,
      Object.fromEntries(
        Object.entries(layout).filter(([id]) => id !== source.id)
      ),
    ])
  )
  return { items, layouts }
}

export type SlotRemoval = {
  slotId: string
  controlId: string
  mode: "delete" | "release"
  columns: number
  buttonName: string
}

export function removeButtonSlotControl(
  state: { items: GridItem[]; layouts: Record<number, GridPositions> },
  removal: SlotRemoval
) {
  const slot = state.items.find((item) => item.id === removal.slotId)
  if (slot?.kind !== "button-slot") return null
  const control = slot.controls.find((entry) => entry.id === removal.controlId)
  if (!control || !validButtonSlotControl(control)) return null
  if (
    removal.mode === "release" &&
    state.items.some(
      (item) =>
        item.id === control.id ||
        (item.kind === "folder" &&
          item.tabs.some((tab) => tab.id === control.id)) ||
        (item.kind === "button-slot" &&
          item.id !== slot.id &&
          item.controls.some((entry) => entry.id === control.id))
    )
  )
    return null
  const items = state.items.map((item): GridItem =>
    item.id === slot.id
      ? {
          ...slot,
          controls: slot.controls.filter((entry) => entry.id !== control.id),
        }
      : item
  )
  if (removal.mode === "delete") return { items, layouts: state.layouts }
  const released: TabItem | ButtonItem =
    control.kind === "site"
      ? {
          id: control.id,
          kind: "tab",
          name: control.name,
          url: control.url,
          icon: control.icon,
          size: control.origin?.size ?? "small",
          color: control.origin?.color ?? slot.color,
          dynamicEffect: control.origin?.dynamicEffect,
        }
      : {
          id: control.id,
          kind: "button",
          name: control.origin?.name ?? removal.buttonName,
          action: control.action,
          size: "small",
          color:
            control.origin?.color ??
            getComponentDefinition("button").defaultColor,
          dynamicEffect: control.origin?.dynamicEffect,
        }
  items.push(released)
  return {
    items,
    layouts: reconcileLayouts(items, {
      ...state.layouts,
      [removal.columns]: state.layouts[removal.columns] ?? {},
    }),
  }
}
