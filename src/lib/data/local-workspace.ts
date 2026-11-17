import { WorkspaceService } from "./workspace"
import { mutateEntries, repository, subscribeStorage } from "./storage-engine"

export const localWorkspace = new WorkspaceService({
  async read(keys) {
    return repository.read(keys)
  },
  mutate: mutateEntries,
  subscribe: subscribeStorage,
})
