const PREFIX = "OMT1:"
const MAX_BYTES = 8 * 1024 * 1024

export async function encodeConfig(value: unknown): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(value))
  if (raw.byteLength > MAX_BYTES) throw new Error("配置过大")
  const compressed = new Uint8Array(
    await new Response(
      new Blob([raw]).stream().pipeThrough(new CompressionStream("gzip"))
    ).arrayBuffer()
  )
  let binary = ""
  for (let i = 0; i < compressed.length; i += 8192)
    binary += String.fromCharCode(...compressed.subarray(i, i + 8192))
  return PREFIX + btoa(binary)
}

export async function decodeConfig(text: string): Promise<unknown> {
  const input = text.replace(/\s/g, "")
  if (!input.startsWith(PREFIX)) throw new Error("无法识别配置格式或版本")
  if (input.length > MAX_BYTES * 2) throw new Error("配置过大")
  try {
    const bytes = Uint8Array.from(atob(input.slice(PREFIX.length)), (c) =>
      c.charCodeAt(0)
    )
    const reader = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"))
      .getReader()
    const chunks: Uint8Array[] = []
    let length = 0
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        length += value.length
        if (length > MAX_BYTES) {
          await reader.cancel()
          throw new Error("配置过大")
        }
        chunks.push(value)
      }
    } finally {
      reader.releaseLock()
    }
    const raw = new Uint8Array(length)
    let offset = 0
    for (const chunk of chunks) {
      raw.set(chunk, offset)
      offset += chunk.length
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw))
  } catch {
    throw new Error("配置文本不完整、已损坏或超过大小限制")
  }
}
