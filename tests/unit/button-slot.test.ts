import { describe, expect, test } from "vitest"
import {
  createCatalogComponent,
  createFolderItem,
  createTabItem,
} from "@/lib/grid/factory"
import {
  acceptsButtonSlot,
  appendButtonSlotControl,
  buttonSlotCapacity,
  removeButtonSlotControl,
  transferIntoButtonSlot,
} from "@/lib/grid/button-slot"
import {
  getComponentSizeOptions,
  getItemResizeOptions,
} from "@/lib/grid/registry"
import { validGridItem } from "@/lib/grid/validation"
import { resizeItem, upsertBookmark } from "@/lib/grid/operations"
import type { ButtonSlotItem, GridItem } from "@/lib/grid/types"
import { decodeBackup, encodeBackup } from "@/lib/backup-codec"
import { snapshot, validateConfig } from "@/application/config-transfer"
import { CONFIG_VERSION } from "@/lib/data-version"

function slot(size: ButtonSlotItem["size"] = "wide"): ButtonSlotItem {
  const item = createCatalogComponent("button-slot", size)
  if (item.kind !== "button-slot") throw new Error("Expected slot")
  return item
}
const system = (id: string) => ({
  id,
  kind: "system" as const,
  action: "open-settings" as const,
})
const saved = (items: GridItem[]) => ({
  items,
  layouts: {
    16: Object.fromEntries(
      items.map((item, i) => [item.id, { x: i * 4, y: 0 }])
    ),
  },
})

describe("button slots", () => {
  test("releases dragged tabs with their original identity, dimensions, icon and appearance", () => {
    const target = slot()
    const tab = {
      ...createTabItem({
        name: "Original",
        url: "https://example.com",
        color: "#123456",
        dynamicEffect: true,
      }),
      size: "square-large" as const,
      icon: `data:image/webp;base64,${btoa("RIFF0000WEBP")}`,
    }
    const transferred = transferIntoButtonSlot(saved([target, tab]), {
      slotId: target.id,
      itemId: tab.id,
    })!
    const before = structuredClone(transferred)
    const released = removeButtonSlotControl(transferred, {
      slotId: target.id,
      controlId: tab.id,
      mode: "release",
      columns: 16,
      buttonName: "Button",
    })!
    expect(released.items.find((item) => item.id === tab.id)).toEqual(tab)
    expect(released.items[0]).toMatchObject({ controls: [] })
    expect(released.layouts[16][tab.id]).toBeDefined()
    expect(released.items.every(validGridItem)).toBe(true)
    expect(transferred).toEqual(before)
    expect(
      removeButtonSlotControl(released, {
        slotId: target.id,
        controlId: tab.id,
        mode: "release",
        columns: 16,
        buttonName: "Button",
      })
    ).toBeNull()
  })

  test("releases buttons as 1x1 components with their original action and appearance", () => {
    const target = slot()
    const button = {
      ...createCatalogComponent("button"),
      name: "My action",
      color: "#654321",
      dynamicEffect: true,
    }
    const transferred = transferIntoButtonSlot(saved([target, button]), {
      slotId: target.id,
      itemId: button.id,
    })!
    const released = removeButtonSlotControl(transferred, {
      slotId: target.id,
      controlId: button.id,
      mode: "release",
      columns: 16,
      buttonName: "Default",
    })!
    expect(released.items.find((item) => item.id === button.id)).toEqual(button)
    expect(released.items.every(validGridItem)).toBe(true)
  })

  test("deletes only the chosen entry and provides defaults for entries saved without origins", () => {
    const target = { ...slot(), controls: [system("one"), system("two")] }
    const before = saved([target])
    const deleted = removeButtonSlotControl(before, {
      slotId: target.id,
      controlId: "one",
      mode: "delete",
      columns: 16,
      buttonName: "Action",
    })!
    expect(deleted.items).toEqual([{ ...target, controls: [system("two")] }])
    expect(deleted.layouts).toEqual(before.layouts)
    const released = removeButtonSlotControl(deleted, {
      slotId: target.id,
      controlId: "two",
      mode: "release",
      columns: 16,
      buttonName: "Settings",
    })!
    expect(released.items[1]).toMatchObject({
      id: "two",
      kind: "button",
      name: "Settings",
      size: "small",
      action: "open-settings",
    })
    expect(released.items.every(validGridItem)).toBe(true)
  })

  test("does not consume a shortcut when releasing would duplicate an existing grid identity", () => {
    const target = { ...slot(), controls: [system("duplicate")] }
    const button = { ...createCatalogComponent("button"), id: "duplicate" }
    const before = saved([target, button])
    expect(
      removeButtonSlotControl(before, {
        slotId: target.id,
        controlId: "duplicate",
        mode: "release",
        columns: 16,
        buttonName: "Action",
      })
    ).toBeNull()
    expect(target.controls).toHaveLength(1)
    expect(
      validGridItem({
        ...target,
        controls: [
          { ...system("bad"), origin: { name: "Bad", color: "invalid" } },
        ],
      })
    ).toBe(false)
    expect(
      validGridItem({
        ...target,
        controls: [
          {
            id: "bad-site",
            kind: "site",
            name: "Site",
            url: "https://example.com",
            origin: { size: "invalid", color: "#123456" },
          },
        ],
      })
    ).toBe(false)
  })

  test("adds valid controls without mutating the dock and rejects full or invalid additions", () => {
    const target = slot("small")
    const first = appendButtonSlotControl(target, system("one"))!
    expect(target.controls).toEqual([])
    expect(first.controls).toEqual([system("one")])
    expect(appendButtonSlotControl(first, system("one"))).toBeNull()
    const full = appendButtonSlotControl(first, system("two"))!
    expect(appendButtonSlotControl(full, system("three"))).toBeNull()
    expect(
      appendButtonSlotControl(target, {
        id: "old",
        kind: "system",
        action: "add-folder",
      })
    ).toBeNull()
    expect(
      appendButtonSlotControl(target, {
        id: "bad",
        kind: "site",
        name: "Bad",
        url: "javascript:alert(1)",
      })
    ).toBeNull()
  })
  test("offers only 4x1, 2x1 and 2x2", () => {
    expect(
      getComponentSizeOptions("button-slot", "catalog").map((size) => [
        size.width,
        size.height,
      ])
    ).toEqual([
      [4, 1],
      [2, 1],
      [2, 2],
    ])
    for (const size of ["wide", "small", "medium"] as const)
      expect(validGridItem(slot(size))).toBe(true)
    expect(
      ["wide", "small", "medium"].map((size) =>
        buttonSlotCapacity(size as ButtonSlotItem["size"])
      )
    ).toEqual([4, 2, 4])
  })

  test("fills a 2x2 dock with four controls and refuses a fifth", () => {
    const target = {
      ...slot("medium"),
      controls: [system("one"), system("two"), system("three")],
    }
    const tab = createTabItem({ name: "Fourth", url: "https://example.com" })
    expect(acceptsButtonSlot(target, tab)).toBe(true)
    const next = transferIntoButtonSlot(saved([target, tab]), {
      itemId: tab.id,
      slotId: target.id,
    })!
    const full = next.items[0] as ButtonSlotItem
    expect(full.controls).toHaveLength(4)
    expect(validGridItem(full)).toBe(true)
    const fifth = createTabItem({ name: "Fifth", url: "https://example.org" })
    expect(acceptsButtonSlot(full, fifth)).toBe(false)
    expect(
      transferIntoButtonSlot(saved([full, fifth]), {
        itemId: fifth.id,
        slotId: full.id,
      })
    ).toBeNull()
    expect(
      validGridItem({ ...full, controls: [...full.controls, system("five")] })
    ).toBe(false)
  })

  test("moves a tab with its icon and removes its original grid placement without changing the source snapshot", () => {
    const target = slot()
    const tab = {
      ...createTabItem({ name: "KEEP", url: "https://example.com" }),
      icon: `data:image/webp;base64,${btoa("RIFF0000WEBP")}`,
    }
    const before = saved([target, tab])
    const original = structuredClone(before)
    const next = transferIntoButtonSlot(before, {
      itemId: tab.id,
      slotId: target.id,
    })!
    expect(next.items).toEqual([
      {
        ...target,
        controls: [
          {
            id: tab.id,
            kind: "site",
            name: tab.name,
            url: tab.url,
            icon: tab.icon,
            origin: {
              size: tab.size,
              color: tab.color,
              dynamicEffect: tab.dynamicEffect,
            },
          },
        ],
      },
    ])
    expect(next.layouts[16][tab.id]).toBeUndefined()
    expect(before).toEqual(original)
    expect(next.items.every(validGridItem)).toBe(true)
  })

  test("moves system buttons and folder entries into slots", () => {
    const target = slot()
    const button = createCatalogComponent("button")
    const folderTab = createTabItem({
      name: "Site",
      url: "https://example.com",
    })
    const folder = createFolderItem({ name: "Folder", tabs: [folderTab] })
    const first = transferIntoButtonSlot(saved([target, button, folder]), {
      itemId: button.id,
      slotId: target.id,
    })!
    const second = transferIntoButtonSlot(first, {
      itemId: folderTab.id,
      slotId: target.id,
      fromFolderId: folder.id,
    })!
    const result = second.items.find(
      (item) => item.id === target.id
    ) as ButtonSlotItem
    expect(result.controls).toHaveLength(2)
    expect(result.controls[0]).toMatchObject({
      kind: "system",
      action: "toggle-theme",
    })
    expect(result.controls[1]).toMatchObject({ kind: "site", id: folderTab.id })
    expect(second.items.find((item) => item.id === folder.id)).toMatchObject({
      tabs: [],
    })
  })

  test("rejects full slots, missing sources and unavailable actions without consuming the source", () => {
    const target = {
      ...slot("small"),
      controls: [system("one"), system("two")],
    }
    const tab = createTabItem({ name: "Site", url: "https://example.com" })
    const before = saved([target, tab])
    expect(acceptsButtonSlot(target, tab)).toBe(false)
    expect(
      transferIntoButtonSlot(before, { itemId: tab.id, slotId: target.id })
    ).toBeNull()
    expect(
      transferIntoButtonSlot(before, { itemId: "missing", slotId: target.id })
    ).toBeNull()
    const unavailable = {
      ...createCatalogComponent("button"),
      action: "add-folder" as const,
    }
    expect(acceptsButtonSlot(slot(), unavailable)).toBe(false)
    expect(before.items).toContain(tab)
  })

  test("cannot shrink away stored controls or accept malformed contents", () => {
    const target = {
      ...slot(),
      controls: [system("one"), system("two"), system("three")],
    }
    expect(getItemResizeOptions(target).map((size) => size.value)).toEqual([
      "wide",
      "medium",
    ])
    expect(resizeItem([target], target.id, "small")).toEqual([target])
    expect(resizeItem([target], target.id, "medium")).toEqual([
      { ...target, size: "medium" },
    ])
    expect(validGridItem({ ...target, size: "small" })).toBe(false)
    expect(
      validGridItem({ ...target, controls: [system("same"), system("same")] })
    ).toBe(false)
    expect(
      validGridItem({
        ...target,
        controls: [
          { id: "bad", kind: "site", name: "Bad", url: "javascript:alert(1)" },
        ],
      })
    ).toBe(false)
  })

  test("updates saved sites in place instead of creating duplicate grid tabs", () => {
    const target: ButtonSlotItem = {
      ...slot(),
      controls: [
        { id: "site", kind: "site", name: "Old", url: "https://example.com/" },
      ],
    }
    const next = upsertBookmark([target], "Edited", "https://example.com/")
    expect(next.result.kind).toBe("updated")
    expect(next.items).toHaveLength(1)
    expect(next.items[0]).toMatchObject({
      controls: [{ name: "Edited", url: "https://example.com/" }],
    })
  })

  test("preserves slot contents through backup and rejects duplicate child IDs", async () => {
    const target = {
      ...slot(),
      controls: [
        system("saved-action"),
        {
          id: "saved-site",
          kind: "site" as const,
          name: "Site",
          url: "https://example.com/",
          origin: {
            size: "medium" as const,
            color: "#123456",
            dynamicEffect: true,
          },
        },
      ],
    }
    const source = JSON.parse(JSON.stringify(snapshot()))
    source.home.backgroundImage = null
    source.grid = { ...source.grid, items: [target], layouts: {} }
    const config = validateConfig(source)
    expect((await decodeBackup(await encodeBackup(config))).config).toEqual(
      config
    )
    source.grid.items.push({
      ...createTabItem({ name: "Duplicate", url: "https://example.org" }),
      id: "saved-site",
    })
    expect(() => validateConfig(source)).toThrow()
  })

  test("upgrades version 4 backups without changing their bookmarks", () => {
    const source = JSON.parse(JSON.stringify(snapshot()))
    const tab = createTabItem({ name: "KEEP", url: "https://example.com" })
    source.version = 4
    source.home.backgroundImage = null
    source.grid = { ...source.grid, items: [tab], layouts: {} }
    const config = validateConfig(source)
    expect(config.version).toBe(CONFIG_VERSION)
    expect(config.grid.items).toEqual([tab])
  })
})
