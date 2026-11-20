import { GithubLogo, Shield } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import SettingSection from "../shared/setting-section"
import PrivacySettings from "./privacy-settings"
import ReleaseNotesCard from "./release-notes-card"

export default function AboutSettings() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <ReleaseNotesCard />
      <SettingSection
        title={t("settings.about.privacyAndData")}
        icon={<Shield />}
      >
        <PrivacySettings showTitle={false} />
      </SettingSection>
      <footer className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}icons/icon-128.png`}
            alt=""
            className="size-12 shrink-0 dark:hidden"
            width={48}
            height={48}
          />
          <img
            src={`${import.meta.env.BASE_URL}icons/icon-dark-128.png`}
            alt=""
            className="hidden size-12 shrink-0 dark:block"
            width={48}
            height={48}
          />
          <span className="text-base font-semibold">Oh My Tab</span>
        </div>
        <a
          href="https://github.com/trynewthin/oh-my-tab"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-2 rounded-(--ui-radius-control) text-base font-semibold hover:underline"
        >
          <GithubLogo aria-hidden="true" className="size-6 shrink-0" />
          <span className="break-all">trynewthin/oh-my-tab</span>
        </a>
      </footer>
    </div>
  )
}
