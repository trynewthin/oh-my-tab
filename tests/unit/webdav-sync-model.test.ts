import { describe, expect, it } from "vitest"
import {
  compareBackupContent,
  contentHash,
  syncDirection,
  validSnapshotLimit,
  webdavSnapshotTime,
  webdavSnapshotName,
  defaultWebdavSnapshotName,
  validWebdavSnapshotName,
} from "@/lib/webdav-sync"

const base = {
  localHash: "local",
  remoteHash: "remote",
  remoteId: "v2",
  remoteDevice: "other",
  deviceId: "mine",
  baseline: { localHash: "local", remoteId: "v1" },
  large: false,
}
describe("WebDAV sync decisions", () => {
  it("prefers recorded upload time and otherwise uses the file modification time", () => {
    expect(webdavSnapshotTime({ uploadedAt: 100, modifiedAt: 200 })).toBe(100)
    expect(webdavSnapshotTime({ uploadedAt: null, modifiedAt: 200 })).toBe(200)
    expect(webdavSnapshotTime({ uploadedAt: 0, modifiedAt: 200 })).toBe(200)
    expect(webdavSnapshotTime({ uploadedAt: null })).toBeNull()
  })
  it("uses a timestamp as the default name and preserves custom names", () => {
    const uploadedAt = new Date(2026, 8, 29, 16, 20, 5).getTime()
    expect(defaultWebdavSnapshotName(uploadedAt)).toBe("2026-09-29 16:20:05")
    expect(webdavSnapshotName({ file: "backup.zip", uploadedAt })).toBe(
      "2026-09-29 16:20:05"
    )
    expect(
      webdavSnapshotName({
        file: "backup.zip",
        uploadedAt,
        name: "Before changes",
      })
    ).toBe("Before changes")
    expect(
      webdavSnapshotName({
        file: "backup.zip",
        uploadedAt: null,
        modifiedAt: uploadedAt,
      })
    ).toBe("2026-09-29 16:20:05")
    expect(webdavSnapshotName({ file: "backup.zip", uploadedAt: null })).toBe(
      "backup.zip"
    )
    for (const value of ["", "   ", "x".repeat(81), "a\nb"])
      expect(validWebdavSnapshotName(value)).toBe(false)
    expect(validWebdavSnapshotName("发布前备份")).toBe(true)
  })
  it("uploads to an empty server and skips identical content", () => {
    expect(syncDirection({ ...base, remoteHash: undefined })).toBe("upload")
    expect(syncDirection({ ...base, remoteHash: "local" })).toBe("equal")
  })
  it("uploads local changes only when the remote version is unchanged", () => {
    expect(
      syncDirection({ ...base, localHash: "edited", remoteId: "v1" })
    ).toBe("upload")
    expect(syncDirection({ ...base, localHash: "edited" })).toBe("choose")
  })
  it("downloads small updates from another device and asks about large changes after initialization", () => {
    expect(syncDirection(base)).toBe("download")
    expect(syncDirection({ ...base, large: true })).toBe("choose")
    expect(syncDirection({ ...base, remoteDevice: "mine" })).toBe("upload")
  })
  it.each(["mine", "other", undefined])(
    "initializes from an existing remote backup uploaded by %s regardless of change size",
    (remoteDevice) => {
      for (const large of [false, true]) {
        expect(
          syncDirection({ ...base, baseline: undefined, remoteDevice, large })
        ).toBe("download")
      }
    }
  )
  it("initializes without a remote version ID and uploads only when remote content is absent", () => {
    expect(
      syncDirection({ ...base, baseline: undefined, remoteId: undefined })
    ).toBe("download")
    expect(
      syncDirection({ ...base, baseline: undefined, remoteHash: undefined })
    ).toBe("upload")
    expect(
      syncDirection({ ...base, baseline: undefined, remoteHash: "local" })
    ).toBe("equal")
  })
  it("counts bookmarks as units and flags changes above 30% or five removals", () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      title: `Site ${i}`,
      url: `https://example.com/${i}`,
    }))
    expect(
      compareBackupContent(
        { items },
        { items: items.map((x, i) => (i < 6 ? { ...x, title: "Changed" } : x)) }
      )
    ).toMatchObject({ changed: 6, ratio: 0.3, large: false })
    expect(
      compareBackupContent(
        { items },
        { items: items.map((x, i) => (i < 7 ? { ...x, title: "Changed" } : x)) }
      ).large
    ).toBe(true)
    expect(
      compareBackupContent({ items }, { items: items.slice(5) })
    ).toMatchObject({ removed: 5, large: true })
  })
  it("includes nested bookmarks, images and settings without counting key order", async () => {
    expect(await contentHash({ a: 1, b: 2 })).toBe(
      await contentHash({ b: 2, a: 1 })
    )
    expect(await contentHash({}, new Blob(["a"]))).not.toBe(
      await contentHash({}, new Blob(["b"]))
    )
    expect(
      compareBackupContent(
        {
          items: [
            {
              id: "folder",
              title: "Folder",
              tabs: [{ id: "child", title: "A" }],
            },
          ],
        },
        {
          items: [
            {
              id: "folder",
              title: "Folder",
              tabs: [{ id: "child", title: "B" }],
            },
          ],
        }
      )
    ).toMatchObject({ changed: 1, total: 2 })
    expect(validSnapshotLimit(5)).toBe(true)
    for (const limit of [0, 101, 2.5, "5", NaN])
      expect(validSnapshotLimit(limit)).toBe(false)
  })
})
