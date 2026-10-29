import { afterEach, beforeEach, describe, expect, test } from "vitest"
import * as storage from "@/lib/storage"
import {
  importConfig,
  snapshot,
  validateConfig,
} from "@/application/config-transfer"
import { rehydrateData } from "@/application/hydrate"
import {
  DEFAULT_TAB_APPEARANCE,
  DEFAULT_SQUARE_TAB_APPEARANCE,
  sanitizeTabAppearance,
} from "@/lib/tab-appearance"
import { sanitizeHomeSettings } from "@/lib/home-settings"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

beforeEach(async () => {
  await storage.flushStorage().catch(() => {})
  await storage.clearAllData()
  useHomeSettingsStore.setState({
    tabAppearance: DEFAULT_TAB_APPEARANCE,
    squareTabAppearance: DEFAULT_SQUARE_TAB_APPEARANCE,
    squareTabTexture: "burning",
    squareTabEffectCoverage: 65,
    gridScale: 1,
    wideGridColumns: 8,
    narrowGridColumns: 4,
  })
})

afterEach(() => {
  useHomeSettingsStore.setState({
    tabAppearance: DEFAULT_TAB_APPEARANCE,
    squareTabAppearance: DEFAULT_SQUARE_TAB_APPEARANCE,
    squareTabTexture: "burning",
    squareTabEffectCoverage: 65,
  })
})

describe("tab appearance model", () => {
  test("defaults every field and ignores unusable records", () => {
    for (const value of [undefined, null, "corrupt", [], 42])
      expect(sanitizeTabAppearance(value)).toEqual(DEFAULT_TAB_APPEARANCE)
  })
  test("missing masks reveal the background while saved mask choices survive hydration", () => {
    expect(sanitizeHomeSettings({}).tabAppearance).toMatchObject({
      backgroundMode: "transparent",
      backgroundBlur: 0,
      backgroundRotation: 0,
      backgroundFlipX: false,
      backgroundFlipY: false,
    })
    for (const backgroundMode of ["default", "solid", "gradient"] as const) {
      const mask = { backgroundMode, backgroundOpacity: 75, backgroundBlur: 4 }
      expect(
        sanitizeHomeSettings({ tabAppearance: mask }).tabAppearance
      ).toMatchObject(mask)
    }
  })

  test("clamps numbers and replaces values outside their domain", () => {
    expect(
      sanitizeTabAppearance({
        direction: "up",
        display: "weird",
        justify: "around",
        align: "baseline",
        paddingX: -5,
        paddingY: 99,
        gap: Infinity,
        borderStyle: "double",
        borderWidth: Number.NaN,
        borderColor: "red",
        borderOpacity: -1,
        radius: 100,
        backgroundMode: "glass",
        backgroundColor: "#ABCDEF",
        backgroundEndColor: "blue",
        backgroundOpacity: 101,
        gradientAngle: 720,
        backgroundBlur: -2,
        fontFamily: "comic",
        fontSize: 100,
        fontWeight: 450,
        textColor: "#12345",
        textOpacity: -20,
        textAlign: "justify",
        lineHeight: 0.5,
        letterSpacing: -9,
        maxLines: 3.6,
        textOverflow: "fade",
        iconScale: 1,
        iconOpacity: 200,
        iconRadius: 80,
        iconFit: "fill",
      })
    ).toMatchObject({
      direction: "right",
      display: "both",
      justify: "between",
      align: "center",
      paddingX: 0,
      paddingY: 48,
      gap: 12,
      borderStyle: "solid",
      borderWidth: 1,
      borderColor: "theme",
      borderOpacity: 0,
      radius: 48,
      backgroundColor: "#ABCDEF",
      backgroundEndColor: "#8b5cf6",
      backgroundOpacity: 100,
      gradientAngle: 360,
      backgroundBlur: 0,
      fontFamily: "system",
      fontSize: 40,
      fontWeight: 500,
      textColor: "theme",
      textOpacity: 0,
      textAlign: "left",
      lineHeight: 1,
      letterSpacing: -2,
      maxLines: 4,
      textOverflow: "ellipsis",
      iconScale: 25,
      iconOpacity: 100,
      iconRadius: 50,
      iconFit: "contain",
    })
  })

  test("converts version 3 padding and icon size instead of preserving dead keys", () => {
    const migrated = sanitizeTabAppearance({
      padding: 20,
      fontSize: 18,
      iconSize: 48,
      borderRadius: 99,
    })
    expect(migrated).toMatchObject({
      paddingX: 20,
      paddingY: 20,
      fontSize: 18,
      iconScale: 171,
    })
    expect(migrated).not.toHaveProperty("padding")
    expect(migrated).not.toHaveProperty("iconSize")
    expect(migrated).not.toHaveProperty("borderRadius")
    expect(
      sanitizeTabAppearance({ padding: 10, paddingX: 4, iconSize: 20 })
    ).toMatchObject({ paddingX: 4, paddingY: 10, iconScale: 71 })
  })
})

describe("tab appearance store", () => {
  test("merges partial patches and clamps the result", () => {
    useHomeSettingsStore.getState().setTabAppearance({
      display: "icon",
      paddingX: 4,
      radius: 24,
      backgroundColor: "#112233",
    })
    expect(useHomeSettingsStore.getState().tabAppearance).toMatchObject({
      display: "icon",
      paddingX: 4,
      paddingY: 8,
      radius: 24,
      backgroundColor: "#112233",
    })

    useHomeSettingsStore.getState().setTabAppearance({ radius: 100 })
    expect(useHomeSettingsStore.getState().tabAppearance).toMatchObject({
      display: "icon",
      paddingX: 4,
      radius: 48,
    })
  })

  test("resets a group with picked defaults and the whole record with defaults", () => {
    useHomeSettingsStore.getState().setTabAppearance({
      display: "text",
      paddingX: 2,
      paddingY: 2,
      gap: 2,
      radius: 4,
      textColor: "#ffffff",
    })
    useHomeSettingsStore.getState().setTabAppearance({
      display: DEFAULT_TAB_APPEARANCE.display,
      paddingX: DEFAULT_TAB_APPEARANCE.paddingX,
      paddingY: DEFAULT_TAB_APPEARANCE.paddingY,
      gap: DEFAULT_TAB_APPEARANCE.gap,
      radius: DEFAULT_TAB_APPEARANCE.radius,
    })
    expect(useHomeSettingsStore.getState().tabAppearance).toEqual({
      ...sanitizeTabAppearance({ textColor: "#ffffff" }),
    })

    useHomeSettingsStore.getState().setTabAppearance(DEFAULT_TAB_APPEARANCE)
    expect(useHomeSettingsStore.getState().tabAppearance).toEqual(
      DEFAULT_TAB_APPEARANCE
    )
  })
})

describe("tab appearance persistence and backups", () => {
  test("defaults missing fields on hydration, including legacy records", () => {
    const merge = useHomeSettingsStore.persist.getOptions().merge
    const current = useHomeSettingsStore.getState()
    expect(merge?.({ text: "KEEP" }, current)).toMatchObject({
      text: "KEEP",
      tabAppearance: DEFAULT_TAB_APPEARANCE,
    })
    expect(
      merge?.({ tabAppearance: { padding: 20, iconSize: 48 } }, current)
        ?.tabAppearance
    ).toMatchObject({ paddingX: 20, paddingY: 20, iconScale: 171 })

    expect(
      merge?.(
        { tabAppearance: { paddingX: -10, radius: 999, direction: "up" } },
        current
      )?.tabAppearance
    ).toMatchObject({
      paddingX: 0,
      radius: 48,
      direction: "right",
    })
  })

  test("fills missing appearance in current backups and rejects corrupt values", () => {
    const current = JSON.parse(JSON.stringify(snapshot()))
    delete current.home.tabAppearance
    expect(validateConfig(current).home.tabAppearance).toEqual(
      DEFAULT_TAB_APPEARANCE
    )

    const partial = JSON.parse(JSON.stringify(snapshot()))
    partial.home.tabAppearance = { display: "icon", radius: 22 }
    expect(validateConfig(partial).home.tabAppearance).toEqual(
      sanitizeTabAppearance({ display: "icon", radius: 22 })
    )

    for (const invalid of [
      { direction: "up" },
      { paddingX: 49 },
      { maxLines: 2.5 },
      { fontWeight: 450 },
      { backgroundEndColor: "blue" },
      { iconScale: Number.NaN },
      { iconScale: Number.POSITIVE_INFINITY },
      { lineHeight: 3 },
      { backgroundRotation: 45 },
      { backgroundRotation: "90" },
      { backgroundFlipX: "true" },
      { backgroundFlipY: 1 },
      "corrupt",
      [],
    ]) {
      const config = JSON.parse(JSON.stringify(snapshot()))
      config.home.tabAppearance = invalid
      expect(() => validateConfig(config)).toThrow()
    }
  })

  test("roundtrips through storage without touching unrelated layout settings", async () => {
    useHomeSettingsStore.getState().setTabAppearance({
      direction: "top",
      display: "icon",
      paddingX: 4,
      radius: 20,
      backgroundMode: "gradient",
      backgroundColor: "#112233",
      backgroundEndColor: "#abcdef",
      maxLines: 3,
      iconFit: "cover",
      backgroundRotation: 90,
      backgroundFlipX: true,
      backgroundFlipY: true,
    })
    useHomeSettingsStore.setState({ gridScale: 1.6, wideGridColumns: 8 })
    const config = snapshot()
    const appearance = config.home.tabAppearance
    const grid = JSON.parse(JSON.stringify(config.grid))
    expect(appearance).toMatchObject({
      direction: "top",
      display: "icon",
      paddingX: 4,
      radius: 20,
      maxLines: 3,
      backgroundRotation: 90,
      backgroundFlipX: true,
      backgroundFlipY: true,
    })

    useHomeSettingsStore.getState().setTabAppearance(DEFAULT_TAB_APPEARANCE)
    await importConfig(config, await storage.storageRevision())
    await rehydrateData()

    expect(useHomeSettingsStore.getState().tabAppearance).toEqual(appearance)
    expect(snapshot().home).toMatchObject({
      tabAppearance: appearance,
      gridScale: 1.6,
      wideGridColumns: 8,
    })
    expect(snapshot().grid).toEqual(grid)
  })

  test("normalizes the appearance from historical backups", () => {
    const legacy = JSON.parse(JSON.stringify(snapshot()))
    legacy.version = 1
    legacy.home.tabAppearance = { padding: 12, fontSize: 18, iconSize: 32 }
    expect(validateConfig(legacy).home.tabAppearance).toMatchObject({
      paddingX: 12,
      paddingY: 12,
      fontSize: 18,
      iconScale: 114,
    })
  })
})

test("sanitizeHomeSettings always exposes a complete appearance", () => {
  expect(sanitizeHomeSettings(null).tabAppearance).toEqual(
    DEFAULT_TAB_APPEARANCE
  )
  expect(
    sanitizeHomeSettings({ tabAppearance: { display: "text" } }).tabAppearance
  ).toEqual(sanitizeTabAppearance({ display: "text" }))
})

test("square styles persist independently through storage and backup restore", async () => {
  const state = useHomeSettingsStore.getState()
  state.setTabAppearance({ radius: 31, backgroundRotation: 180 })
  const strip = snapshot().home
  state.setSquareTabAppearance({
    radius: 4,
    backgroundRotation: 90,
    backgroundFlipX: true,
  })
  state.setSquareTabTexture("particles")
  state.setSquareTabEffectCoverage(84)
  await storage.flushStorage()
  const saved = snapshot()
  useHomeSettingsStore.setState({
    squareTabAppearance: DEFAULT_SQUARE_TAB_APPEARANCE,
    squareTabTexture: "none",
    squareTabEffectCoverage: 20,
  })
  await importConfig(
    validateConfig(JSON.parse(JSON.stringify(saved))),
    await storage.storageRevision()
  )
  await rehydrateData()
  expect(snapshot().home).toMatchObject({
    tabAppearance: strip.tabAppearance,
    tabTexture: strip.tabTexture,
    tabEffectCoverage: strip.tabEffectCoverage,
    squareTabAppearance: {
      direction: "top",
      radius: 4,
      backgroundRotation: 90,
      backgroundFlipX: true,
    },
    squareTabTexture: "particles",
    squareTabEffectCoverage: 84,
  })
  useHomeSettingsStore
    .getState()
    .setSquareTabAppearance(DEFAULT_SQUARE_TAB_APPEARANCE)
  expect(snapshot().home.tabAppearance).toEqual(strip.tabAppearance)
  expect(snapshot().home.squareTabAppearance).toEqual(
    DEFAULT_SQUARE_TAB_APPEARANCE
  )
  expect(snapshot().grid).toEqual(saved.grid)
})

test("older backups default square styles without copying strip styles and reject invalid square settings", () => {
  const old = JSON.parse(JSON.stringify(snapshot()))
  old.home.tabAppearance.radius = 37
  delete old.home.squareTabAppearance
  delete old.home.squareTabTexture
  delete old.home.squareTabEffectCoverage
  expect(validateConfig(old).home).toMatchObject({
    squareTabAppearance: DEFAULT_SQUARE_TAB_APPEARANCE,
    squareTabTexture: "burning",
    squareTabEffectCoverage: 65,
  })
  for (const patch of [
    { squareTabAppearance: null },
    { squareTabAppearance: { backgroundRotation: 45 } },
    { squareTabTexture: "invalid" },
    { squareTabEffectCoverage: 0 },
    { squareTabEffectCoverage: "65" },
  ]) {
    const config = JSON.parse(JSON.stringify(snapshot()))
    Object.assign(config.home, patch)
    expect(() => validateConfig(config)).toThrow()
  }
})
