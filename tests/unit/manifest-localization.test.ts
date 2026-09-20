import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"

const root = new URL("../../", import.meta.url)

// The browser resolves `__MSG_*__` in the manifest through `_locales`; a
// missing key or a renamed placeholder silently ships an extension whose name
// and description render as the raw token. These assertions mirror what the
// browser does at load time, without needing a built package.
describe("chrome manifest localization", () => {
  it("resolves every manifest placeholder in each locale", async () => {
    const manifest = JSON.parse(
      await readFile(new URL("public/manifest.json", root), "utf8")
    )
    expect(manifest.manifest_version).toBe(3)
    expect(manifest.default_locale).toBe("zh_CN")

    const placeholders = [
      ...new Set(
        [...JSON.stringify(manifest).matchAll(/__MSG_([A-Za-z0-9_]+)__/g)].map(
          (match) => match[1]
        )
      ),
    ].sort()
    expect(
      placeholders,
      "manifest must localize its name, description and action title"
    ).toEqual(["actionTitle", "extensionDescription", "extensionName"])

    const catalogs: Record<string, Record<string, { message: string }>> = {}
    for (const locale of ["zh_CN", "en"])
      catalogs[locale] = JSON.parse(
        await readFile(
          new URL(`public/_locales/${locale}/messages.json`, root),
          "utf8"
        )
      )
    for (const [locale, catalog] of Object.entries(catalogs))
      for (const key of placeholders)
        expect(
          catalog[key]?.message?.trim(),
          `_locales/${locale}/messages.json must define ${key}`
        ).toBeTruthy()
    expect(
      Object.keys(catalogs.zh_CN).sort(),
      "zh_CN and en must expose identical keys"
    ).toEqual(Object.keys(catalogs.en).sort())
    const english = Object.values(catalogs.en).map((entry) => entry.message)
    expect(
      english.filter((message, index) => english.indexOf(message) === index),
      "en must not repeat the same message across keys"
    ).toHaveLength(english.length)
    for (const key of placeholders)
      expect(
        catalogs.en[key].message,
        `en ${key} must actually be translated`
      ).not.toBe(catalogs.zh_CN[key].message)
  })

  it("keeps the CSP and permission set unchanged by localization", async () => {
    const manifest = JSON.parse(
      await readFile(new URL("public/manifest.json", root), "utf8")
    )
    expect(manifest.content_security_policy).toEqual({
      extension_pages: "script-src 'self'; object-src 'self';",
    })
    expect(manifest.permissions).toEqual([
      "activeTab",
      "search",
      "storage",
      "unlimitedStorage",
    ])
    expect(manifest.optional_permissions).toEqual(["bookmarks"])
    expect(manifest.optional_host_permissions).toEqual(["https://*/*"])
  })
})

// The runtime applies the persisted language preference to `<html lang>` and
// the title after hydration. A static `lang` (or a language-specific title)
// would assert one UI language before the runtime overrides it, which is
// exactly what the shells used to do.
describe("extension page shells", () => {
  it("leaves language and title to the runtime", async () => {
    for (const file of ["index.html", "popup.html"]) {
      const shell = await readFile(new URL(file, root), "utf8")
      const head = shell.replace(/<!--[\s\S]*?-->/g, "")
      expect(head, `${file} must not pin <html lang>`).not.toMatch(
        /<html[^>]*\slang=/
      )
      expect(head, `${file} title must be language-neutral`).toMatch(
        /<title>Oh My Tab<\/title>/
      )
      expect(head, `${file} must not claim an og:locale`).not.toMatch(
        /og:locale/
      )
      expect(
        head,
        `${file} must not embed a hard-coded Chinese description`
      ).not.toMatch(/[\u4e00-\u9fff]/)
    }
  })
})
