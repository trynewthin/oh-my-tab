import { readFile } from "node:fs/promises"
import type { Plugin } from "vite"

export function projectLicenses(): Plugin {
  const files = [
    ["LICENSE", new URL("../LICENSE", import.meta.url)],
    ["NOTICE", new URL("../NOTICE", import.meta.url)],
    [
      "licenses/inter.txt",
      new URL(
        "../node_modules/@fontsource-variable/inter/LICENSE",
        import.meta.url
      ),
    ],
  ] as const

  return {
    name: "project-licenses",
    apply: "build",
    async generateBundle() {
      for (const [fileName, source] of files) {
        this.emitFile({
          type: "asset",
          fileName,
          source: await readFile(source, "utf8"),
        })
      }
    },
  }
}
