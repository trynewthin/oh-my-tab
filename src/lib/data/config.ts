import { z } from "zod"
import { CONFIG_VERSION } from "@/lib/data-version"
import { uiDepthOptions, uiRadiusOptions } from "@/lib/ui-appearance"
import { isBackgroundPaletteId } from "@/lib/background-palette-model"
import { sanitizeFolderBorder, validFolderBorder } from "@/lib/folder-border"
import { folderShadowOptions } from "@/lib/tile-appearance"
import { fairIsleSettingsSchema } from "@/lib/fair-isle-settings"
import { liquidGlassSchema } from "@/lib/liquid-glass"
import {
  defaultPopupAppearance,
  popupAppearanceSchema,
} from "@/lib/popup-appearance"
import {
  clampGridScale,
  GRID_COLUMNS,
  isGridComponentColumnCount,
  itemWidth,
} from "@/lib/grid/grid-layout"
import { validGridItem } from "@/lib/grid/validation"
import { type GridItem } from "@/lib/grid/types"
import {
  DEFAULT_TAB_EFFECT_COVERAGE,
  MAX_FOLDER_RADIUS,
  MAX_TAB_EFFECT_COVERAGE,
  MIN_TAB_EFFECT_COVERAGE,
  sanitizeHomeSettings,
} from "@/lib/home-settings"
import { isTraditionalTopSpacing } from "@/lib/home-top-spacing"
import { isMatrixPet } from "@/lib/matrix-pets"
import { validQuickBarConfig } from "@/lib/quick-bar"
import { defaultSearchEngines, isSearchUrl } from "@/lib/search-engines"
import { validSearchShortcuts } from "@/lib/search-shortcuts"
import { validSharedGarden, type SharedGarden } from "@/lib/shared-garden"
import {
  sanitizeSquareTabAppearance,
  sanitizeTabAppearance,
  validTabAppearance,
  type TabAppearance,
} from "@/lib/tab-appearance"

const color = z.string().regex(/^#[0-9a-f]{6}$/i)
const texture = z.enum(["none", "burning", "particles"])
const coverage = z
  .number()
  .min(MIN_TAB_EFFECT_COVERAGE)
  .max(MAX_TAB_EFFECT_COVERAGE)

const homeFields = z.object({
  layoutMode: z.enum(["traditional", "free"]),
  quickBar:
    z.custom<ReturnType<typeof sanitizeHomeSettings>["quickBar"]>(
      validQuickBarConfig
    ),
  wideGridColumns: z.custom<
    ReturnType<typeof sanitizeHomeSettings>["wideGridColumns"]
  >(isGridComponentColumnCount),
  narrowGridColumns: z.custom<
    ReturnType<typeof sanitizeHomeSettings>["narrowGridColumns"]
  >(isGridComponentColumnCount),
  gridScale: z.number().refine((value) => clampGridScale(value) !== null),
  backgroundType: z.enum(["solid", "image"]),
  backgroundImage: z.string().nullable(),
  backgroundPalette: z.custom<
    ReturnType<typeof sanitizeHomeSettings>["backgroundPalette"]
  >(isBackgroundPaletteId),
  searchBoxStyle: z.enum(["full", "minimal"]),
  searchShortcuts:
    z.custom<ReturnType<typeof sanitizeHomeSettings>["searchShortcuts"]>(
      validSearchShortcuts
    ),
  folderStyle: z.enum(["classic", "noise", "none"]),
  folderRadius: z.number().min(0).max(MAX_FOLDER_RADIUS).optional(),
  folderBorder: z
    .custom<Parameters<typeof sanitizeFolderBorder>[0]>(validFolderBorder)
    .optional(),
  folderShadow: z.enum(folderShadowOptions).optional(),
  tabTexture: texture,
  tabEffectCoverage: coverage,
  newTabsDynamicEffect: z.boolean(),
  topComponent: z.enum(["none", "dot-matrix"]),
  traditionalTopSpacing: z.custom<
    ReturnType<typeof sanitizeHomeSettings>["traditionalTopSpacing"]
  >(isTraditionalTopSpacing),
  content: z.enum(["time", "text", "pet", "breathing"]),
  text: z.string().max(80),
  pet: z.custom<ReturnType<typeof sanitizeHomeSettings>["pet"]>(isMatrixPet),
  color,
  burningAmplitude: z.number().min(0).max(2),
  fairIsle: fairIsleSettingsSchema.optional(),
  liquidGlass: liquidGlassSchema.optional(),
  popupAppearance: popupAppearanceSchema.optional(),
  transitionsEnabled: z.boolean(),
  tabAppearance: z.custom<TabAppearance>(validTabAppearance).optional(),
  squareTabAppearance: z.custom<TabAppearance>(validTabAppearance).optional(),
  squareTabTexture: texture.optional(),
  squareTabEffectCoverage: coverage.optional(),
})

export const homeSchema = homeFields
  .refine((home) => home.narrowGridColumns <= home.wideGridColumns, {
    path: ["narrowGridColumns"],
  })
  .transform((home) => {
    const tabAppearance = sanitizeTabAppearance({
      ...home.tabAppearance,
      radius: home.tabAppearance?.radius ?? home.folderRadius,
    })
    return {
      ...home,
      popupAppearance: home.popupAppearance ?? { ...defaultPopupAppearance },
      tabAppearance,
      squareTabAppearance: {
        ...sanitizeSquareTabAppearance(home.squareTabAppearance),
        radius: tabAppearance.radius,
      },
      folderRadius: tabAppearance.radius,
      folderBorder: sanitizeFolderBorder(home.folderBorder),
      folderShadow: home.folderShadow ?? ("auto" as const),
      squareTabTexture: home.squareTabTexture ?? ("burning" as const),
      squareTabEffectCoverage:
        home.squareTabEffectCoverage ?? DEFAULT_TAB_EFFECT_COVERAGE,
      text: home.text.replace(/[^\x20-\x7e]/g, ""),
    }
  })

export const homePatchSchema = homeFields.partial().strict()

export const searchSchema = z
  .object({
    engines: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          url: z.string().refine(isSearchUrl),
          icon: z
            .string()
            .refine((icon) =>
              defaultSearchEngines.some((preset) => preset.icon === icon)
            )
            .optional(),
        })
      )
      .min(1),
    selectedId: z.string(),
    openInNewTab: z.boolean(),
  })
  .refine(
    (search) =>
      search.engines.some((engine) => engine.id === search.selectedId) &&
      new Set(search.engines.map((engine) => engine.id)).size ===
        search.engines.length
  )

export const gridSchema = z
  .object({
    items: z.array(z.custom<GridItem>(validGridItem)),
    layouts: z.record(
      z.string(),
      z.record(
        z.string(),
        z.object({
          x: z.number().int(),
          y: z.number().int().min(0).max(500),
        })
      )
    ),
    mockDataVersion: z.number().int().nonnegative().default(0),
  })
  .superRefine((grid, ctx) => {
    if (!grid.items.every(validGridItem)) return
    const ids = grid.items.flatMap((item) =>
      item.kind === "folder"
        ? [item.id, ...item.tabs.map((tab) => tab.id)]
        : item.kind === "button-slot"
          ? [item.id, ...item.controls.map((control) => control.id)]
          : [item.id]
    )
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: "custom", message: "duplicateIds", path: ["items"] })
    for (const [columns, positions] of Object.entries(grid.layouts)) {
      if (
        !GRID_COLUMNS.some((value) => String(value) === columns) ||
        Object.entries(positions).some(([id, position]) => {
          const item = grid.items.find((entry) => entry.id === id)
          return (
            position.x < 0 ||
            position.x >
              Number(columns) - (item ? itemWidth(item, Number(columns)) : 4)
          )
        })
      )
        ctx.addIssue({
          code: "custom",
          message: "invalidGrid",
          path: ["layouts", columns],
        })
    }
  })

export const themeSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  uiRadius: z.enum(uiRadiusOptions).optional(),
  uiBorder: z.enum(uiDepthOptions).optional(),
  uiShadow: z.enum(uiDepthOptions).optional(),
})

export const configSchema = z.object({
  version: z.literal(CONFIG_VERSION),
  onboarding: z.object({ seen: z.boolean() }),
  garden: z.custom<SharedGarden>(validSharedGarden),
  home: homeSchema,
  theme: themeSchema,
  search: searchSchema,
  grid: gridSchema,
})

export type Config = z.infer<typeof configSchema>

export function defaultGarden(now = Date.now()) {
  return {
    points: 6,
    pointsUpdatedAt: now,
    album: [] as import("@/lib/grid/types").GardenPlant[],
    initialized: true,
  }
}

export function defaultSearch(): Config["search"] {
  return {
    engines: defaultSearchEngines
      .filter((engine) => ["google", "bing", "bingcn"].includes(engine.id))
      .map((engine) => ({ ...engine })),
    selectedId: "google",
    openInNewTab: true,
  }
}

export function defaultConfig(now = Date.now()): Config {
  return {
    version: CONFIG_VERSION,
    onboarding: { seen: false },
    garden: defaultGarden(now),
    home: sanitizeHomeSettings(null),
    theme: { theme: "light" },
    search: defaultSearch(),
    grid: { items: [], layouts: {}, mockDataVersion: 0 },
  }
}
