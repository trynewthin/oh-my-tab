export type AppDocument = {
  version: number
  revision: string
  data: unknown
}

/** Storage provided by the host for one App. null expects no document yet. */
export interface AppStorage {
  read(): Promise<AppDocument | undefined>
  save(
    document: Omit<AppDocument, "revision">,
    expectedRevision: string | null
  ): Promise<AppDocument>
}
