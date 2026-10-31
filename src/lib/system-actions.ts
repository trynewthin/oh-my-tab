export type SystemActionSurface = "grid-button" | "quick-bar" | "more-actions"

type SystemActionDefinition = {
  labelKey: string
  menuLabelKey?: string
  activeLabelKey?: string
  surfaces: readonly SystemActionSurface[]
  deprecated?: boolean
}

// IDs persist in saved layouts and backups; never rename existing ones.
export const systemActionRegistry = {
  "toggle-theme": {
    labelKey: "shell.systemActions.toggleTheme",
    surfaces: ["grid-button", "quick-bar"],
  },
  "add-tab": {
    labelKey: "shell.systemActions.addTab",
    menuLabelKey: "shell.moreActions.addTab",
    surfaces: ["grid-button", "quick-bar", "more-actions"],
  },
  "add-folder": {
    labelKey: "shell.systemActions.addFolder",
    menuLabelKey: "shell.moreActions.addFolder",
    surfaces: ["grid-button", "quick-bar", "more-actions"],
  },
  "open-components": {
    labelKey: "shell.systemActions.openComponents",
    menuLabelKey: "shell.moreActions.addComponent",
    surfaces: ["grid-button", "quick-bar", "more-actions"],
  },
  "tidy-grid": {
    labelKey: "shell.systemActions.tidyGrid",
    menuLabelKey: "shell.moreActions.tidy",
    surfaces: ["grid-button", "quick-bar", "more-actions"],
  },
  "toggle-selection": {
    labelKey: "shell.systemActions.toggleSelection",
    menuLabelKey: "shell.moreActions.batch",
    activeLabelKey: "shell.moreActions.batchOn",
    surfaces: ["grid-button", "quick-bar", "more-actions"],
  },
  "toggle-edit": {
    deprecated: true,
    labelKey: "shell.systemActions.toggleEdit",
    menuLabelKey: "shell.moreActions.edit",
    activeLabelKey: "shell.moreActions.editOn",
    surfaces: ["grid-button", "quick-bar", "more-actions"],
  },
  "open-settings": {
    labelKey: "shell.systemActions.openSettings",
    surfaces: ["grid-button", "quick-bar"],
  },
} as const satisfies Record<string, SystemActionDefinition>

export type SystemActionId = keyof typeof systemActionRegistry

export function isSystemActionId(value: unknown): value is SystemActionId {
  return typeof value === "string" && Object.hasOwn(systemActionRegistry, value)
}

export function isActiveSystemAction(value: unknown): value is SystemActionId {
  if (!isSystemActionId(value)) return false
  const definition = systemActionRegistry[value]
  return !("deprecated" in definition && definition.deprecated)
}

export function isSystemActionOnSurface(
  value: unknown,
  surface: SystemActionSurface
): value is SystemActionId {
  return (
    isSystemActionId(value) &&
    (
      systemActionRegistry[value].surfaces as readonly SystemActionSurface[]
    ).includes(surface)
  )
}

export function systemActionIdsFor(
  surface: SystemActionSurface
): SystemActionId[] {
  return (Object.keys(systemActionRegistry) as SystemActionId[]).filter(
    (id) => isActiveSystemAction(id) && isSystemActionOnSurface(id, surface)
  )
}

export function systemActionStatus(
  action: SystemActionId,
  state: { canTidy: boolean; selecting: boolean }
): { disabled: boolean; pressed?: boolean } {
  if (action === "tidy-grid") return { disabled: !state.canTidy }
  if (action === "toggle-selection")
    return { disabled: false, pressed: state.selecting }
  if (!isActiveSystemAction(action)) return { disabled: true }
  return { disabled: false }
}
