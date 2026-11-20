import type { BackgroundType } from "@/stores/home-settings-store"

export const searchControlAppearanceClassName =
  "rounded-[calc(var(--ui-radius-control)*1.5)] border-ui-border-control shadow-(--ui-shadow-control)"

export function searchSurfaceBackgroundClassName(type: BackgroundType) {
  return type === "solid"
    ? "bg-background dark:bg-card"
    : "bg-background/55 backdrop-blur-xl dark:bg-card/55"
}

export function compactSearchButtonClassName(type: BackgroundType) {
  const background =
    type === "solid" ? "bg-card/70 dark:bg-card" : "bg-card/70 dark:bg-card/55"
  return `size-10 shrink-0 bg-clip-padding backdrop-blur-xl ${searchControlAppearanceClassName} ${background}`
}
