export type FolderBorder = {
  style: "none" | "solid" | "dashed" | "dotted"
  width: number
  color: string
  opacity: number
}

export const DEFAULT_FOLDER_BORDER: Readonly<FolderBorder> = Object.freeze({
  style: "solid",
  width: 1,
  color: "theme",
  opacity: 100,
})

export function sanitizeFolderBorder(value: unknown): FolderBorder {
  const saved =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<FolderBorder>)
      : {}
  return {
    style:
      saved.style === "none" ||
      saved.style === "dashed" ||
      saved.style === "dotted"
        ? saved.style
        : "solid",
    width:
      typeof saved.width === "number" && Number.isFinite(saved.width)
        ? Math.min(8, Math.max(0, saved.width))
        : 1,
    color:
      typeof saved.color === "string" &&
      (saved.color === "theme" || /^#[0-9a-f]{6}$/i.test(saved.color))
        ? saved.color
        : "theme",
    opacity:
      typeof saved.opacity === "number" && Number.isFinite(saved.opacity)
        ? Math.min(100, Math.max(0, saved.opacity))
        : 100,
  }
}

export function validFolderBorder(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const saved = value as Record<string, unknown>
  const normalized = sanitizeFolderBorder(value)
  return (Object.keys(normalized) as (keyof FolderBorder)[]).every(
    (key) => saved[key] === undefined || saved[key] === normalized[key]
  )
}
