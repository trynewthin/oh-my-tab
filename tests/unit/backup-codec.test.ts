import { describe, expect, it } from "vitest"
import { zipSync, unzipSync, strToU8 } from "fflate"
import { encodeBackup, decodeBackup } from "@/lib/backup-codec"

describe("backup-codec", () => {
  it("preserves original image bytes and Unicode data", async () => {
    const bytes = Uint8Array.from({ length: 50000 }, (_, i) => i % 256)
    const config = {
      version: 1,
      name: "工作台",
      home: { backgroundImage: null },
      items: ["https://example.com"],
    }
    const zip = await encodeBackup(
      config,
      new Blob([bytes], { type: "image/png" })
    )
    const files = unzipSync(new Uint8Array(await zip.arrayBuffer()))
    expect(files["assets/background"]).toEqual(bytes)
    const restored = await decodeBackup(zip)
    expect(restored.config).toEqual(config)
    expect(new Uint8Array(await restored.image!.arrayBuffer())).toEqual(bytes)
    expect(restored.image!.type).toBe("image/png")
  })

  it("supports a backup without an image", async () => {
    const restored = await decodeBackup(await encodeBackup({ items: [] }))
    expect(restored).toEqual({ config: { items: [] } })
  })

  it("rejects damaged or missing images before restore", async () => {
    const zip = await encodeBackup(
      {},
      new Blob([new Uint8Array([1, 2, 3])], { type: "image/webp" })
    )
    const files = unzipSync(new Uint8Array(await zip.arrayBuffer()))
    files["assets/background"][0] ^= 1
    await expect(decodeBackup(new Blob([zipSync(files)]))).rejects.toThrow(
      /图片/
    )
    delete files["assets/background"]
    await expect(decodeBackup(new Blob([zipSync(files)]))).rejects.toThrow(
      /图片/
    )
  })

  it("rejects unknown versions, paths and oversized expanded manifests", async () => {
    await expect(
      decodeBackup(
        new Blob([
          zipSync({
            "manifest.json": strToU8('{"format":"oh-my-tab","version":99}'),
          }),
        ])
      )
    ).rejects.toThrow(/版本/)
    await expect(
      decodeBackup(new Blob([zipSync({ "../manifest.json": strToU8("{}") })]))
    ).rejects.toThrow(/结构/)
    const bomb = zipSync({
      "manifest.json": new Uint8Array(8 * 1024 * 1024 + 1),
    })
    await expect(decodeBackup(new Blob([bomb]))).rejects.toThrow(/限制/)
    await expect(decodeBackup(new Blob(["broken"]))).rejects.toThrow()
  })

  it("rejects altered configuration even if the JSON remains valid", async () => {
    const zip = await encodeBackup({ name: "original" })
    const files = unzipSync(new Uint8Array(await zip.arrayBuffer()))
    const manifest = JSON.parse(
      new TextDecoder().decode(files["manifest.json"])
    )
    manifest.config.name = "changed"
    files["manifest.json"] = strToU8(JSON.stringify(manifest))
    await expect(decodeBackup(new Blob([zipSync(files)]))).rejects.toThrow(
      /校验失败/
    )
  })
})
