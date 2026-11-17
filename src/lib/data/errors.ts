export type DataErrorCode =
  | "VALIDATION"
  | "CONFLICT"
  | "UNSUPPORTED_VERSION"
  | "MISSING_ASSET"
  | "MIGRATION_BLOCKED"
  | "LEGACY_CHANGED"
  | "NOT_FOUND"

export class DataError extends Error {
  readonly code: DataErrorCode
  readonly details: unknown

  constructor(code: DataErrorCode, details?: unknown) {
    super(code)
    this.name = "WorkspaceDataError"
    this.code = code
    this.details = details
  }
}
