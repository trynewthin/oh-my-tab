import { afterEach, beforeEach, expect, test } from "vitest"
import {
  DEFAULT_FOLDER_RADIUS,
  MAX_FOLDER_RADIUS,
  sanitizeHomeSettings,
} from "@/lib/home-settings"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import {
  importConfig,
  snapshot,
  validateConfig,
} from "@/application/config-transfer"
import { rehydrateData } from "@/application/hydrate"
import * as storage from "@/lib/storage"
import {
  DEFAULT_FOLDER_BORDER,
  sanitizeFolderBorder,
} from "@/lib/folder-border"

beforeEach(async () => {
  await storage.flushStorage()
  await storage.clearAllData()
  useHomeSettingsStore.getState().resetFolderStyle()
})

afterEach(() => {
  useHomeSettingsStore.getState().resetFolderStyle()
})

test("old settings retain the original folder corners and malformed values are bounded", () => {
  expect(sanitizeHomeSettings({}).folderRadius).toBe(DEFAULT_FOLDER_RADIUS)
  expect(sanitizeHomeSettings({ folderRadius: -1 }).folderRadius).toBe(0)
  expect(sanitizeHomeSettings({ folderRadius: 100 }).folderRadius).toBe(
    MAX_FOLDER_RADIUS
  )
  for (const value of [NaN, Infinity, "24", null]) {
    expect(sanitizeHomeSettings({ folderRadius: value }).folderRadius).toBe(
      DEFAULT_FOLDER_RADIUS
    )
  }
})

test("radius changes and reset never change tab appearance or grid dimensions", () => {
  const before = snapshot()
  for (const radius of [0, 24, 48, 90, -10, DEFAULT_FOLDER_RADIUS]) {
    useHomeSettingsStore.getState().setFolderRadius(radius)
    const next = snapshot()
    expect(next.home.folderRadius).toBe(
      Math.min(MAX_FOLDER_RADIUS, Math.max(0, radius))
    )
    expect(next.home.tabAppearance).toEqual(before.home.tabAppearance)
    expect(next.home.gridScale).toBe(before.home.gridScale)
    expect(next.grid).toEqual(before.grid)
  }
  useHomeSettingsStore.getState().setFolderRadius(NaN)
  expect(useHomeSettingsStore.getState().folderRadius).toBe(
    DEFAULT_FOLDER_RADIUS
  )
})

test("backups default a missing radius and reject invalid supplied radii", () => {
  const old = JSON.parse(JSON.stringify(snapshot()))
  delete old.home.folderRadius
  expect(validateConfig(old).home.folderRadius).toBe(DEFAULT_FOLDER_RADIUS)
  for (const radius of [-1, 49, NaN, Infinity, "24", null]) {
    const invalid = JSON.parse(JSON.stringify(snapshot()))
    invalid.home.folderRadius = radius
    expect(() => validateConfig(invalid)).toThrow()
  }
})

test("folder radius survives backup restore and storage rehydration", async () => {
  useHomeSettingsStore.getState().setFolderRadius(32)
  const backup = validateConfig(JSON.parse(JSON.stringify(snapshot())))
  useHomeSettingsStore.getState().setFolderRadius(0)
  await importConfig(backup, await storage.storageRevision())
  await rehydrateData()
  expect(useHomeSettingsStore.getState().folderRadius).toBe(32)
  expect(snapshot().grid).toEqual(backup.grid)
})

test("folder border sanitization and backup validation preserve safe partial settings", () => {
  expect(
    sanitizeFolderBorder({
      width: 99,
      opacity: -4,
      color: "url(evil)",
      style: "double",
    })
  ).toEqual({ ...DEFAULT_FOLDER_BORDER, width: 8, opacity: 0 })
  expect(sanitizeHomeSettings({}).folderBorder).toEqual(DEFAULT_FOLDER_BORDER)
  const old = JSON.parse(JSON.stringify(snapshot()))
  delete old.home.folderBorder
  expect(validateConfig(old).home.folderBorder).toEqual(DEFAULT_FOLDER_BORDER)
  for (const invalid of [
    null,
    [],
    { width: NaN },
    { width: 9 },
    { opacity: 101 },
    { color: "red" },
    { style: "double" },
  ]) {
    const backup = JSON.parse(JSON.stringify(snapshot()))
    backup.home.folderBorder = invalid
    expect(() => validateConfig(backup)).toThrow()
  }
})

test("reset style restores border radius and texture without touching folder contents or tabs", async () => {
  const before = snapshot()
  const state = useHomeSettingsStore.getState()
  state.setFolderStyle("classic")
  state.setFolderRadius(32)
  state.setFolderBorder({
    style: "dotted",
    width: 6,
    color: "#123456",
    opacity: 45,
  })
  const saved = validateConfig(JSON.parse(JSON.stringify(snapshot())))
  state.resetFolderStyle()
  await importConfig(saved, await storage.storageRevision())
  await rehydrateData()
  expect(useHomeSettingsStore.getState().folderBorder).toEqual(
    saved.home.folderBorder
  )
  useHomeSettingsStore.getState().resetFolderStyle()
  const after = snapshot()
  expect(after.home.folderStyle).toBe("noise")
  expect(after.home.folderRadius).toBe(DEFAULT_FOLDER_RADIUS)
  expect(after.home.folderBorder).toEqual(DEFAULT_FOLDER_BORDER)
  expect(after.home.tabAppearance).toEqual(before.home.tabAppearance)
  expect(after.grid).toEqual(before.grid)
})
