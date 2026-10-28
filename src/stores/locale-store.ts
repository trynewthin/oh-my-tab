import { storageOptions } from "@/lib/storage"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import { isLanguagePreference, type LanguagePreference } from "@/i18n/language"

type LocaleState = {
  preference: LanguagePreference
  setPreference: (preference: LanguagePreference) => void
}

// Device-local: listed in DEVICE_KEYS, never in DATA_KEYS or exports, so a
// chosen language does not travel with a backup.
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      preference: "system",
      setPreference: (preference) => set({ preference }),
    }),
    {
      ...storageOptions(),
      name: "omt.locale",
      partialize: ({ preference }) => ({ preference }),
      merge: (persisted, current) => {
        const preference = (persisted as { preference?: unknown } | null)
          ?.preference
        return {
          ...current,
          preference: isLanguagePreference(preference) ? preference : "system",
        }
      },
    }
  )
)
