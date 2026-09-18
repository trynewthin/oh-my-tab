import { validGardenPlant } from "@/lib/garden"
import { isComponentSize, isGridItemKind } from "@/lib/grid/registry"
import { normalizeTabUrl, type GridItem, type TabEntry } from "@/lib/grid/types"

function validDynamicEffect(value: unknown) {
  return value === undefined || typeof value === "boolean"
}

export function validTabEntry(value: unknown): value is TabEntry {
  if (!value || typeof value !== "object") return false
  const entry = value as TabEntry
  return (
    validDynamicEffect(entry.dynamicEffect) &&
    typeof entry.id === "string" &&
    typeof entry.name === "string" &&
    (entry.size === undefined || isComponentSize("tab", entry.size)) &&
    (entry.color === undefined || /^#[0-9a-f]{6}$/i.test(entry.color)) &&
    typeof entry.url === "string" &&
    /^https?:\/\//i.test(entry.url) &&
    normalizeTabUrl(entry.url) !== null
  )
}

export function validGridItem(value: unknown): value is GridItem {
  if (!value || typeof value !== "object") return false
  const item = value as Partial<GridItem>
  if (
    typeof item.id !== "string" ||
    typeof item.name !== "string" ||
    typeof item.color !== "string" ||
    !/^#[0-9a-f]{6}$/i.test(item.color) ||
    !isGridItemKind(item.kind) ||
    !isComponentSize(item.kind, item.size) ||
    !validDynamicEffect(item.dynamicEffect)
  )
    return false

  const typed = item as GridItem
  if (typed.kind === "todo")
    return (
      Array.isArray(typed.tasks) &&
      typed.tasks.length <= 200 &&
      typed.tasks.every(
        (task) =>
          task &&
          typeof task.id === "string" &&
          typeof task.text === "string" &&
          task.text.trim().length > 0 &&
          task.text.length <= 200 &&
          typeof task.done === "boolean"
      ) &&
      new Set(typed.tasks.map((task) => task.id)).size === typed.tasks.length
    )
  if (typed.kind === "calendar") return true
  if (typed.kind === "ecosystem")
    return (
      ["flowers", "ferns"].includes(typed.species) &&
      Array.isArray(typed.plants) &&
      typed.plants.length <= 8 &&
      new Set(typed.plants.map((plant) => plant?.slot)).size ===
        typed.plants.length &&
      typed.plants.every(validGardenPlant) &&
      (typed.lastCheckIn === undefined ||
        (typeof typed.lastCheckIn === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(typed.lastCheckIn))) &&
      (typed.pointsUpdatedAt === undefined ||
        (Number.isFinite(typed.pointsUpdatedAt) &&
          typed.pointsUpdatedAt >= 0)) &&
      (typed.points === undefined ||
        (Number.isInteger(typed.points) && typed.points >= 0)) &&
      (typed.album === undefined ||
        (Array.isArray(typed.album) && typed.album.every(validGardenPlant)))
    )
  if (typed.kind === "dot-canvas")
    return (
      Array.isArray(typed.pixels) &&
      [384, 576, 1024, 1152, 2304].includes(typed.pixels.length) &&
      typed.pixels.every(
        (pixel) =>
          typeof pixel === "string" &&
          (pixel === "" || /^#[0-9a-f]{6}$/i.test(pixel))
      )
    )
  if (typed.kind === "tab") return validTabEntry(typed)
  if (typed.kind === "template") return true
  return Array.isArray(typed.tabs) && typed.tabs.every(validTabEntry)
}
