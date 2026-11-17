export type Entries = Record<string, unknown>

export type EntryMutation<T> = {
  updates: Entries
  remove?: string[]
  notify?: boolean
  result: T
}

// Callbacks are internal transaction code, never part of a network contract.
export interface EntryRepository {
  read(keys?: readonly string[]): Promise<Entries>
  mutate<T>(
    operation: (entries: Entries) => EntryMutation<T>,
    keys?: readonly string[]
  ): Promise<T>
  subscribe(listener: (keys: string[]) => void): () => void
}
