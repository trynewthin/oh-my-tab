import { localWorkspace } from "./local-workspace"
import type { WorkspaceService } from "./workspace"

export type WorkspacePort = Pick<
  WorkspaceService,
  | "initialize"
  | "subscribe"
  | "read"
  | "readSections"
  | "execute"
  | "capture"
  | "previewRestore"
  | "applyRestore"
  | "replace"
>

// The application can install another implementation before hydration without
// changing components or stores (for example, an HTTP client).
export let workspaceClient: WorkspacePort = localWorkspace
export function configureWorkspace(client: WorkspacePort) {
  workspaceClient = client
}
