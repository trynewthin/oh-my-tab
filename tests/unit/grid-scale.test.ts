import { beforeEach, describe, expect, test } from "vitest"
import { snapshot, validateConfig } from "@/application/config-transfer"
import { DEFAULT_GRID_SCALE, GRID_COLUMNS } from "@/lib/grid/grid-layout"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { sanitizePersisted } from "@/lib/grid/persisted"

beforeEach(() => {
  useHomeSettingsStore.setState({
    gridScale: DEFAULT_GRID_SCALE,
    wideGridColumns: 4,
    narrowGridColumns: 2,
  })
})

describe("grid scale persistence", () => {
  test("defaults a missing scale and keeps a valid wide column count", () => {
    const merged = useHomeSettingsStore.persist
      .getOptions()
      .merge?.({ wideGridColumns: 8 }, useHomeSettingsStore.getState())
    expect(merged?.gridScale).toBe(1)
    expect(merged?.wideGridColumns).toBe(8)
  })

  test("falls back to 100 percent for an illegal persisted scale", () => {
    const merged = useHomeSettingsStore.persist
      .getOptions()
      .merge?.({ gridScale: 1.15 }, useHomeSettingsStore.getState())
    expect(merged?.gridScale).toBe(1)

    useHomeSettingsStore.getState().setGridScale(0.5)
    expect(useHomeSettingsStore.getState().gridScale).toBe(1)
    useHomeSettingsStore.getState().setGridScale(0.6)
    expect(useHomeSettingsStore.getState().gridScale).toBeCloseTo(0.6)
    useHomeSettingsStore.getState().setGridScale(2.1)
    expect(useHomeSettingsStore.getState().gridScale).toBeCloseTo(0.6)
  })
})

describe("grid scale backups", () => {
  test("snapshots the scale, fills older backups, and rejects illegal values", () => {
    useHomeSettingsStore.setState({ gridScale: 1.5 })
    expect(snapshot().home.gridScale).toBe(1.5)

    const legacy = JSON.parse(JSON.stringify(snapshot()))
    legacy.version = 1
    delete legacy.home.gridScale
    expect(validateConfig(legacy).home.gridScale).toBe(DEFAULT_GRID_SCALE)

    for (const invalid of [0.5, 1.15, 2.1, 3, Number.NaN]) {
      const config = JSON.parse(JSON.stringify(snapshot()))
      config.home.gridScale = invalid
      expect(() => validateConfig(config)).toThrow()
    }
  })

  test("accepts a 32-column layout introduced by the wider grid", () => {
    const config = JSON.parse(JSON.stringify(snapshot()))
    config.grid.layouts["32"] = {}
    expect(validateConfig(config).grid.layouts["32"]).toEqual({})
    expect(
      sanitizePersisted({ layouts: { 32: { a: { x: 0, y: 0 } } } }).layouts[32]
    ).toEqual({
      a: { x: 0, y: 0 },
    })
    expect(GRID_COLUMNS).toContain(32)
  })
})
