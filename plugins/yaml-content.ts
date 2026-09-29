import { parse } from "yaml"
import type { Plugin } from "vite"

export function yamlContent(): Plugin {
  return {
    name: "yaml-content",
    enforce: "pre",
    transform(source, id) {
      if (!/\.ya?ml$/.test(id.split("?", 1)[0])) return
      return {
        code: `export default ${JSON.stringify(parse(source))}`,
        map: null,
      }
    },
  }
}
