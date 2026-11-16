export type RemoteFile = {
  blob: Blob
  etag: string | null
  lastModified: number | null
}

export type BackendCapabilities = {
  // If-Match / If-None-Match conditional writes; required for safe
  // multi-writer concurrency. Backends without it run in single-writer
  // semantics and the UI must surface that.
  conditionalWrites: boolean
  // Whether the backend can list files under a prefix; used to garbage
  // collect orphaned snapshot files not referenced by the index.
  listing: boolean
  maxFileBytes: number
}

export interface SyncBackend {
  readonly id: string
  readonly capabilities: BackendCapabilities
  get(path: string, maxBytes?: number): Promise<RemoteFile | null>
  // Condition semantics follow HTTP: ifMatch requires the resource to exist
  // with that etag, ifNoneMatch requires it to not exist. Returns the new
  // etag when the backend reports one. Throws SyncConflictError when the
  // precondition fails.
  put(
    path: string,
    blob: Blob,
    condition?: { ifMatch?: string; ifNoneMatch?: true }
  ): Promise<string | null>
  // A missing resource is a no-op. Throws SyncConflictError when ifMatch
  // is given and the current etag differs.
  delete(path: string, condition?: { ifMatch?: string }): Promise<void>
  list?(prefix: string): Promise<string[]>
}

export class SyncConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SyncConflictError"
  }
}
