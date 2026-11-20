import { z } from "zod"
import {
  gridSchema,
  homePatchSchema,
  homeSchema,
  searchSchema,
  themeSchema,
  type Config,
  defaultConfig,
} from "./config"
import { transferTab } from "@/lib/grid/tab-transfer"
import { GRID_COLUMNS } from "@/lib/grid/grid-layout"
import { validSharedGarden, type SharedGarden } from "@/lib/shared-garden"
import { DataError } from "./errors"
import { validGridItem } from "@/lib/grid/validation"
import type { EcosystemItem } from "@/lib/grid/types"

export const writeRequestSchema = z.object({
  requestId: z.string().min(1).max(128),
  issuedAt: z.number().int().nonnegative(),
  expectedRevision: z.string().optional(),
})

export const workspaceCommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("workspace.reset"),
    categories: z
      .array(z.enum(["preferences", "background", "bookmarks", "garden"]))
      .min(1),
  }),
  z.object({ type: z.literal("settings.patch"), patch: homePatchSchema }),
  themeSchema.extend({
    type: z.literal("theme.set"),
  }),
  z.object({ type: z.literal("search.configure"), search: searchSchema }),
  z.object({ type: z.literal("grid.replace"), grid: gridSchema }),
  z.object({
    type: z.literal("grid.move"),
    move: z.object({
      tabId: z.string().min(1),
      fromFolderId: z.string().optional(),
      toFolderId: z.string().optional(),
      index: z.number().int().nonnegative().optional(),
      columns: z
        .number()
        .refine((value) =>
          GRID_COLUMNS.includes(value as (typeof GRID_COLUMNS)[number])
        ),
      position: z
        .object({
          x: z.number().int().nonnegative(),
          y: z.number().int().nonnegative(),
        })
        .optional(),
    }),
  }),
  z.object({
    type: z.literal("bookmark.rename"),
    id: z.string().min(1),
    name: z.string().trim().min(1).max(200),
  }),
  z.object({
    type: z.literal("task.set-completed"),
    widgetId: z.string().min(1),
    taskId: z.string().min(1),
    done: z.boolean(),
  }),
  z.object({
    type: z.literal("garden.configure"),
    garden: z.custom<SharedGarden>(validSharedGarden),
  }),
  z.object({
    type: z.literal("garden.update-widget"),
    garden: z.custom<SharedGarden>(validSharedGarden),
    widget: z.custom<EcosystemItem>(
      (value) => validGridItem(value) && value.kind === "ecosystem"
    ),
  }),
  z.object({ type: z.literal("onboarding.set-seen"), seen: z.boolean() }),
])

export type WorkspaceCommand = z.infer<typeof workspaceCommandSchema>

// These commands contain business data only: no store methods, closures,
// persistence keys or transport-specific values cross the service boundary.
export function applyWorkspaceCommand(
  config: Config,
  command: WorkspaceCommand
): Config {
  switch (command.type) {
    case "workspace.reset": {
      const defaults = defaultConfig()
      let next = config
      if (command.categories.includes("preferences"))
        next = {
          ...next,
          home: {
            ...defaults.home,
            backgroundImage: config.home.backgroundImage,
            backgroundType: config.home.backgroundType,
          },
          theme: defaults.theme,
          search: defaults.search,
        }
      if (command.categories.includes("background"))
        next = {
          ...next,
          home: {
            ...next.home,
            backgroundImage: null,
            backgroundType: "solid",
          },
        }
      if (command.categories.includes("bookmarks"))
        next = {
          ...next,
          grid: {
            items: [],
            layouts: {},
            mockDataVersion: config.grid.mockDataVersion,
          },
        }
      if (command.categories.includes("garden"))
        next = { ...next, garden: defaults.garden }
      return next
    }
    case "settings.patch": {
      const next = { ...config.home, ...command.patch }
      if (
        command.patch.folderRadius !== undefined &&
        command.patch.tabAppearance === undefined
      )
        next.tabAppearance = {
          ...config.home.tabAppearance,
          radius: command.patch.folderRadius,
        }
      return { ...config, home: homeSchema.parse(next) }
    }
    case "theme.set": {
      const { theme, uiRadius, uiBorder, uiShadow, settingsAppearance } =
        command
      return {
        ...config,
        theme: {
          ...config.theme,
          theme,
          ...(uiRadius === undefined ? {} : { uiRadius }),
          ...(uiBorder === undefined ? {} : { uiBorder }),
          ...(uiShadow === undefined ? {} : { uiShadow }),
          ...(settingsAppearance === undefined ? {} : { settingsAppearance }),
        },
      }
    }
    case "search.configure":
      return { ...config, search: command.search }
    case "grid.replace":
      return { ...config, grid: command.grid }
    case "grid.move":
      return {
        ...config,
        grid: { ...config.grid, ...transferTab(config.grid, command.move) },
      }
    case "garden.configure":
      return { ...config, garden: command.garden }
    case "garden.update-widget": {
      if (
        !config.grid.items.some(
          (item) => item.id === command.widget.id && item.kind === "ecosystem"
        )
      )
        throw new DataError("NOT_FOUND", { id: command.widget.id })
      return {
        ...config,
        garden: command.garden,
        grid: {
          ...config.grid,
          items: config.grid.items.map((item) =>
            item.id === command.widget.id ? command.widget : item
          ),
        },
      }
    }
    case "onboarding.set-seen":
      return { ...config, onboarding: { seen: command.seen } }
    case "bookmark.rename": {
      let found = false
      const items = config.grid.items.map((item) => {
        if (item.id === command.id) {
          found = true
          return { ...item, name: command.name }
        }
        if (item.kind !== "folder") return item
        return {
          ...item,
          tabs: item.tabs.map((tab) => {
            if (tab.id !== command.id) return tab
            found = true
            return { ...tab, name: command.name }
          }),
        }
      })
      if (!found) throw new DataError("NOT_FOUND", { id: command.id })
      return { ...config, grid: { ...config.grid, items } }
    }
    case "task.set-completed": {
      let found = false
      const items = config.grid.items.map((item) =>
        item.id === command.widgetId && item.kind === "todo"
          ? {
              ...item,
              tasks: item.tasks.map((task) => {
                if (task.id !== command.taskId) return task
                found = true
                return { ...task, done: command.done }
              }),
            }
          : item
      )
      if (!found) throw new DataError("NOT_FOUND", { id: command.taskId })
      return { ...config, grid: { ...config.grid, items } }
    }
  }
}
