import { beforeEach, describe, expect, test } from "vitest"
import { snapshot, validateConfig } from "@/application/config-transfer"
import {
  DEFAULT_TAB_EFFECT_COVERAGE,
  MAX_TAB_EFFECT_COVERAGE,
  MIN_TAB_EFFECT_COVERAGE,
  useHomeSettingsStore,
} from "@/stores/home-settings-store"

beforeEach(() => {
  useHomeSettingsStore.setState({
    tabEffectCoverage: DEFAULT_TAB_EFFECT_COVERAGE,
  })
})

describe("tab effect coverage", () => {
  test("keeps the previous surface coverage as the default and clamps updates", () => {
    expect(DEFAULT_TAB_EFFECT_COVERAGE).toBe(65)

    useHomeSettingsStore.getState().setTabEffectCoverage(42.6)
    expect(useHomeSettingsStore.getState().tabEffectCoverage).toBe(43)

    useHomeSettingsStore.getState().setTabEffectCoverage(0)
    expect(useHomeSettingsStore.getState().tabEffectCoverage).toBe(
      MIN_TAB_EFFECT_COVERAGE
    )

    useHomeSettingsStore.getState().setTabEffectCoverage(200)
    expect(useHomeSettingsStore.getState().tabEffectCoverage).toBe(
      MAX_TAB_EFFECT_COVERAGE
    )
  })

  test("exports valid coverage and defaults older backups", () => {
    const current = JSON.parse(JSON.stringify(snapshot()))
    current.home.tabEffectCoverage = 80
    expect(validateConfig(current).home.tabEffectCoverage).toBe(80)

    const legacy = JSON.parse(JSON.stringify(snapshot()))
    delete legacy.home.tabEffectCoverage
    expect(validateConfig(legacy).home.tabEffectCoverage).toBe(
      DEFAULT_TAB_EFFECT_COVERAGE
    )

    for (const invalid of [19, 101, Number.NaN]) {
      const config = JSON.parse(JSON.stringify(snapshot()))
      config.home.tabEffectCoverage = invalid
      expect(() => validateConfig(config)).toThrow()
    }
  })
})
