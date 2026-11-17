import { configSchema, defaultConfig, type Config } from "./config"
import { DataError } from "./errors"
import {
  REVISION_KEY,
  documentKeys,
  documentRevisionKey,
  documentRevisions,
  revisionEntries,
  type WorkspaceSection,
} from "./keys"
import { STORAGE_VERSION } from "@/lib/data-version"
import type { Entries, EntryRepository } from "./repository"
import { assertWritable } from "./writable"
import {
  applyWorkspaceCommand,
  workspaceCommandSchema,
  writeRequestSchema,
  type WorkspaceCommand,
} from "./commands"
import { sanitizeState } from "@/lib/sanitize"

export type WorkspaceView = { config: Config; revision: string | undefined }
export type WorkspaceSnapshot = WorkspaceView & { image?: Blob }
export type ReplaceWorkspace = {
  requestId: string
  issuedAt: number
  expectedRevision: string | undefined
  config: Config
  image?: Blob
}
export type CommitReceipt = {
  requestId: string
  revision: string
  documentRevisions: Partial<Record<WorkspaceSection, string>>
}
export type WorkspaceReadIssue = {
  section: WorkspaceSection
  reason: "partial" | "unreadable"
}
export type SectionView<K extends WorkspaceSection> = {
  data: Pick<Config, K>
  revision: string | undefined
  documentRevisions: Partial<Record<K, string>>
  issues: WorkspaceReadIssue[]
}
export type RestorePreview = WorkspaceView & {
  image?: Blob
  changedSections: (keyof Omit<Config, "version">)[]
}
const REQUEST_LIFETIME = 24 * 60 * 60 * 1000

export function configEntries(config: Config): Entries {
  return Object.fromEntries(
    Object.entries(documentKeys).map(([field, key]) => [
      key,
      JSON.stringify({
        state: config[field as keyof typeof documentKeys],
        version: STORAGE_VERSION,
      }),
    ])
  )
}

export function configFromEntries(
  entries: Entries,
  fallback = defaultConfig()
): Config {
  const value: Record<string, unknown> = { ...fallback }
  for (const [field, key] of Object.entries(documentKeys)) {
    const raw = entries[key]
    if (raw === undefined || raw === null) continue
    let envelope: {
      version?: unknown
      minReadVersion?: unknown
      state?: unknown
    }
    try {
      envelope = JSON.parse(typeof raw === "string" ? raw : "")
    } catch {
      throw new DataError("VALIDATION", { key })
    }
    if (!envelope || typeof envelope !== "object")
      throw new DataError("VALIDATION", { key })
    if (
      envelope.version !== STORAGE_VERSION ||
      (typeof envelope.minReadVersion === "number" &&
        envelope.minReadVersion > STORAGE_VERSION)
    )
      throw new DataError("UNSUPPORTED_VERSION", { key })
    value[field] = envelope.state
  }
  const parsed = configSchema.safeParse(value)
  if (!parsed.success) throw new DataError("VALIDATION", parsed.error.issues)
  return parsed.data
}

async function digest(value: Uint8Array): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new Uint8Array(value))
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("")
}

function validateImage(image?: Blob) {
  if (
    image &&
    (!(image instanceof Blob) ||
      !image.size ||
      image.size > 50 * 1024 * 1024 ||
      !["image/png", "image/jpeg", "image/webp"].includes(image.type))
  )
    throw new DataError("VALIDATION", { reason: "invalidImage" })
}

function assertRequest(input: unknown) {
  const parsed = writeRequestSchema.safeParse(input)
  if (
    !parsed.success ||
    parsed.data.issuedAt > Date.now() + 300000 ||
    parsed.data.issuedAt < Date.now() - REQUEST_LIFETIME
  )
    throw new DataError("VALIDATION", { reason: "invalidOrExpiredRequest" })
}

function cloneInput<T>(value: T): T {
  try {
    return structuredClone(value)
  } catch {
    throw new DataError("VALIDATION", { reason: "unserializableInput" })
  }
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.entries(item).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        )
      : item
  )
}

export class WorkspaceService {
  private readonly repository: EntryRepository
  private readonly defaults: Config

  constructor(repository: EntryRepository, defaults = defaultConfig()) {
    this.repository = repository
    this.defaults = configSchema.parse(cloneInput(defaults))
  }

  subscribe(listener: (sections: WorkspaceSection[]) => void) {
    return this.repository.subscribe((keys) => {
      const sections = (Object.keys(documentKeys) as WorkspaceSection[]).filter(
        (section) => keys.includes(documentKeys[section])
      )
      if (sections.length) listener(sections)
    })
  }

  async initialize(): Promise<WorkspaceSection[]> {
    const defaults = configEntries(this.defaults)
    return this.repository.mutate(
      (entries) => {
        if (
          typeof entries["omt.migrations"] === "number" &&
          (entries["omt.migrations"] as number) > STORAGE_VERSION
        )
          return { updates: {}, result: [] }
        const updates = Object.fromEntries(
          Object.entries(defaults).filter(([key]) => entries[key] == null)
        )
        const created = (
          Object.keys(documentKeys) as WorkspaceSection[]
        ).filter((section) => Object.hasOwn(updates, documentKeys[section]))
        if (!created.length) return { updates, result: created }
        return {
          updates: {
            ...updates,
            ...revisionEntries(documentRevisions(updates)),
            [REVISION_KEY]: crypto.randomUUID(),
          },
          result: created,
        }
      },
      [...Object.values(documentKeys), "omt.migrations"]
    )
  }

  async read(): Promise<WorkspaceView> {
    const entries = await this.repository.read()
    return {
      config: configFromEntries(entries, this.defaults),
      revision: entries[REVISION_KEY] as string | undefined,
    }
  }

  async readSections<K extends WorkspaceSection>(
    sections: readonly K[]
  ): Promise<SectionView<K>> {
    if (sections.some((section) => !Object.hasOwn(documentKeys, section)))
      throw new DataError("VALIDATION")
    const entries = await this.repository.read([
      REVISION_KEY,
      ...sections.flatMap((section) => [
        documentKeys[section],
        documentRevisionKey(section),
      ]),
    ])
    const data: Partial<Config> = {}
    const revisions: Partial<Record<K, string>> = {}
    const issues: WorkspaceReadIssue[] = []
    for (const section of sections) {
      const key = documentKeys[section]
      const raw = entries[key]
      let envelope:
        | { state?: unknown; version?: unknown; minReadVersion?: unknown }
        | undefined
      if (typeof raw === "string") {
        try {
          envelope = JSON.parse(raw)
        } catch {
          /* Preserve original. */
        }
      }
      const supported = !(
        typeof envelope?.minReadVersion === "number" &&
        envelope.minReadVersion > STORAGE_VERSION
      )
      const sanitized = supported
        ? sanitizeState(key, envelope?.state)
        : { ok: false as const }
      const candidate = sanitized.ok
        ? { ...this.defaults[section], ...sanitized.state }
        : this.defaults[section]
      const parsed = configSchema.shape[section].safeParse(candidate)
      Object.assign(data, {
        [section]: parsed.success ? parsed.data : this.defaults[section],
      })
      revisions[section] = entries[documentRevisionKey(section)] as
        string | undefined
      if (raw != null) {
        if (!sanitized.ok || !parsed.success)
          issues.push({ section, reason: "unreadable" })
        else if (
          envelope?.version !== STORAGE_VERSION ||
          !configSchema.shape[section].safeParse({
            ...this.defaults[section],
            ...(envelope?.state as object),
          }).success
        )
          issues.push({ section, reason: "partial" })
      }
    }
    return {
      data: structuredClone(data) as Pick<Config, K>,
      revision: entries[REVISION_KEY] as string | undefined,
      documentRevisions: revisions,
      issues,
    }
  }

  async capture(): Promise<WorkspaceSnapshot> {
    // The repository reads the full set in one readonly transaction, including
    // the referenced resource. Hashing/encoding happens after the transaction.
    const entries = await this.repository.read()
    const config = configFromEntries(entries, this.defaults)
    let image: Blob | undefined
    const id = config.home.backgroundImage
    if (id) {
      const asset = entries[id] as { value?: unknown } | undefined
      if (asset?.value instanceof Blob) image = asset.value
      else if (
        typeof asset?.value === "string" &&
        asset.value.startsWith("data:image/")
      )
        image = decodeImage(asset.value)
      else throw new DataError("MISSING_ASSET", { id })
      config.home.backgroundImage = null
    }
    return {
      config,
      image,
      revision: entries[REVISION_KEY] as string | undefined,
    }
  }

  async previewRestore(candidate: {
    config: Config
    image?: Blob
  }): Promise<RestorePreview> {
    const parsed = configSchema.safeParse(cloneInput(candidate.config))
    if (!parsed.success) throw new DataError("VALIDATION", parsed.error.issues)
    validateImage(candidate.image)
    const current = await this.readSections(
      Object.keys(documentKeys) as WorkspaceSection[]
    )
    const config = parsed.data
    const changedSections = (
      Object.keys(documentKeys) as (keyof typeof documentKeys)[]
    ).filter(
      (section) =>
        current.issues.some((issue) => issue.section === section) ||
        canonicalJson(current.data[section]) !==
          canonicalJson(config[section]) ||
        (section === "home" && candidate.image !== undefined)
    )
    return {
      config,
      image: candidate.image,
      revision: current.revision,
      changedSections,
    }
  }

  applyRestore(
    preview: Pick<RestorePreview, "config" | "image" | "revision">,
    request: { requestId: string; issuedAt: number }
  ) {
    return this.replace({
      ...request,
      config: preview.config,
      image: preview.image,
      expectedRevision: preview.revision,
    })
  }

  async replace(input: ReplaceWorkspace): Promise<CommitReceipt> {
    input = cloneInput(input)
    assertRequest(input)
    const parsed = configSchema.safeParse(input.config)
    if (!parsed.success) throw new DataError("VALIDATION", parsed.error.issues)
    const config = parsed.data
    // Validate and hash binary data outside IndexedDB's transaction lifetime.
    validateImage(input.image)
    const imageHash = input.image
      ? await digest(new Uint8Array(await input.image.arrayBuffer()))
      : null
    const requestHash = await digest(
      new TextEncoder().encode(
        canonicalJson({
          config,
          imageHash,
          imageType: input.image?.type,
          issuedAt: input.issuedAt,
          expectedRevision: input.expectedRevision,
        })
      )
    )
    return this.commitRequest(input, requestHash, (entries) => {
      assertWritable(entries, Object.values(documentKeys))
      const assets: Entries = {}
      if (input.image) {
        const id = `asset:${crypto.randomUUID()}`
        assets[id] = { createdAt: Date.now(), value: input.image }
        config.home.backgroundImage = id
      }
      if (
        config.home.backgroundImage &&
        !assets[config.home.backgroundImage] &&
        !entries[config.home.backgroundImage]
      )
        throw new DataError("MISSING_ASSET", {
          id: config.home.backgroundImage,
        })
      return { updates: { ...configEntries(config), ...assets } }
    })
  }

  async execute(input: {
    requestId: string
    issuedAt: number
    expectedRevision: string | undefined
    command: WorkspaceCommand
  }): Promise<CommitReceipt> {
    input = cloneInput(input)
    assertRequest(input)
    const parsed = workspaceCommandSchema.safeParse(input.command)
    if (!parsed.success) throw new DataError("VALIDATION", parsed.error.issues)
    const command = parsed.data
    const sections =
      command.type === "workspace.reset"
        ? resetSections(command.categories)
        : commandSections[command.type]
    const keys = sections.map((section) => documentKeys[section])
    const image =
      command.type === "settings.patch"
        ? command.patch.backgroundImage
        : undefined
    const hash = await digest(
      new TextEncoder().encode(
        canonicalJson({
          command,
          expectedRevision: input.expectedRevision,
          issuedAt: input.issuedAt,
        })
      )
    )
    await this.pruneRequests()
    return this.commitRequest(
      input,
      hash,
      (entries) => {
        assertWritable(entries, keys)
        let baseline = this.defaults
        const rescue: Entries = {}
        for (const section of sections) {
          const key = documentKeys[section]
          let envelope: { state?: unknown } | null = null
          if (typeof entries[key] === "string") {
            try {
              envelope = JSON.parse(entries[key] as string)
            } catch {
              /* Preserve below. */
            }
          }
          const sanitized = sanitizeState(key, envelope?.state)
          const candidate = sanitized.ok
            ? { ...this.defaults[section], ...sanitized.state }
            : this.defaults[section]
          const current = configSchema.shape[section].safeParse(candidate)
          baseline = {
            ...baseline,
            [section]: current.success ? current.data : this.defaults[section],
          }
          if (
            entries[key] != null &&
            (!sanitized.ok ||
              !current.success ||
              canonicalJson(envelope?.state) !== canonicalJson(current.data))
          )
            rescue[`rescue:${key}`] = entries[key]
        }
        const changed = configSchema.safeParse(
          applyWorkspaceCommand(baseline, command)
        )
        if (!changed.success)
          throw new DataError("VALIDATION", changed.error.issues)
        if (image && !entries[image])
          throw new DataError("MISSING_ASSET", { id: image })
        const encoded = configEntries(changed.data)
        const remove: string[] = []
        if (
          command.type === "workspace.reset" &&
          command.categories.includes("background") &&
          baseline.home.backgroundImage
        ) {
          const id = baseline.home.backgroundImage
          const rescued = entries["rescue:omt.home-settings"]
          try {
            if (
              typeof rescued !== "string" ||
              JSON.parse(rescued)?.state?.backgroundImage !== id
            )
              remove.push(id)
          } catch {
            /* Preserve assets referenced by unreadable rescue data. */
          }
        }
        return {
          updates: {
            ...rescue,
            ...Object.fromEntries(keys.map((key) => [key, encoded[key]])),
          },
          remove,
        }
      },
      [...keys, "rescue:omt.home-settings", ...(image ? [image] : [])]
    )
  }

  private lastReceiptCleanup = 0

  private async pruneRequests() {
    if (Date.now() - this.lastReceiptCleanup < 3600000) return
    this.lastReceiptCleanup = Date.now()
    try {
      await this.repository.mutate((entries) => ({
        updates: {},
        remove: Object.entries(entries)
          .filter(
            ([key, value]) =>
              key.startsWith("receipt:") &&
              typeof (value as { issuedAt?: unknown })?.issuedAt === "number" &&
              (value as { issuedAt: number }).issuedAt <
                Date.now() - REQUEST_LIFETIME
          )
          .map(([key]) => key),
        result: undefined,
      }))
    } catch (error) {
      this.lastReceiptCleanup = 0
      throw error
    }
  }

  private commitRequest(
    input: {
      requestId: string
      issuedAt: number
      expectedRevision: string | undefined
    },
    requestHash: string,
    prepare: (entries: Entries) => { updates: Entries; remove?: string[] },
    keys?: string[]
  ): Promise<CommitReceipt> {
    const receiptKey = `receipt:${input.requestId}`
    return this.repository.mutate(
      (entries) => {
        const previous = entries[receiptKey] as
          { requestHash?: unknown; receipt?: CommitReceipt } | undefined
        if (previous) {
          if (previous.requestHash !== requestHash || !previous.receipt)
            throw new DataError("VALIDATION", { reason: "reusedRequestId" })
          return { updates: {}, result: previous.receipt }
        }
        if (entries[REVISION_KEY] !== input.expectedRevision)
          throw new DataError("CONFLICT", {
            currentRevision: entries[REVISION_KEY],
          })
        const { updates, remove } = prepare(entries)
        const revisions = documentRevisions(updates)
        const receipt = {
          requestId: input.requestId,
          revision: crypto.randomUUID(),
          documentRevisions: revisions,
        }
        return {
          updates: {
            ...updates,
            ...revisionEntries(revisions),
            [REVISION_KEY]: receipt.revision,
            [receiptKey]: { requestHash, issuedAt: input.issuedAt, receipt },
          },
          result: receipt,
          remove,
        }
      },
      keys ? [...keys, REVISION_KEY, receiptKey, "omt.migrations"] : undefined
    )
  }
}

function resetSections(categories: string[]): WorkspaceSection[] {
  return [
    ...new Set(
      categories.flatMap((category): WorkspaceSection[] => {
        if (category === "preferences") return ["home", "theme", "search"]
        if (category === "background") return ["home"]
        if (category === "bookmarks") return ["grid"]
        return ["garden"]
      })
    ),
  ]
}

const commandSections: Record<
  Exclude<WorkspaceCommand["type"], "workspace.reset">,
  WorkspaceSection[]
> = {
  "settings.patch": ["home"],
  "theme.set": ["theme"],
  "search.configure": ["search"],
  "grid.replace": ["grid"],
  "grid.move": ["grid"],
  "bookmark.rename": ["grid"],
  "task.set-completed": ["grid"],
  "garden.configure": ["garden"],
  "onboarding.set-seen": ["onboarding"],
  "garden.update-widget": ["garden", "grid"],
}

function decodeImage(value: string): Blob {
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(value)
  if (!match) throw new DataError("VALIDATION", { reason: "invalidImage" })
  try {
    return new Blob(
      [Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0))],
      { type: match[1] }
    )
  } catch {
    throw new DataError("VALIDATION", { reason: "invalidImage" })
  }
}
