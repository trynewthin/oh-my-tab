import { DexieAppRepository } from "@/lib/apps/dexie-app-repository"
import { repository } from "@/lib/data/storage-engine"

export const appRepository = new DexieAppRepository(repository.database)
