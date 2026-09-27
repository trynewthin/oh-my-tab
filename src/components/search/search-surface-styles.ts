import type { BackgroundType } from "@/stores/home-settings-store"

export function searchSurfaceBackgroundClassName(type: BackgroundType) {
  return type === "solid"
    ? "bg-background dark:bg-card"
    : "bg-background/55 backdrop-blur-xl dark:bg-card/55"
}

export function compactSearchButtonBackgroundClassName(type: BackgroundType) {
  return type === "solid"
    ? "bg-card/70 dark:bg-card"
    : "bg-card/70 dark:bg-card/55"
}
