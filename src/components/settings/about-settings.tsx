import { GithubLogo } from "@phosphor-icons/react"
import PrivacySettings from "./privacy-settings"
import ProjectSupport from "./project-support"

export default function AboutSettings({
  pane,
}: {
  pane: "project" | "privacy"
}) {
  return (
    <section className="space-y-5" aria-labelledby="about-settings-title">
      <h2 id="about-settings-title" className="text-base leading-6 font-medium">
        {pane === "privacy" ? "隐私" : "项目"}
      </h2>
      {pane === "privacy" ? (
        <PrivacySettings />
      ) : (
        <>
          <ProjectSupport />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex min-w-0 items-center gap-4 p-4">
              <img
                src={`${import.meta.env.BASE_URL}icons/icon-128.png`}
                alt=""
                className="size-16 shrink-0"
                width={64}
                height={64}
              />
              <span className="min-w-0 text-lg font-semibold">Oh My Tab</span>
            </div>
            <div className="flex min-w-0 items-center p-4">
              <a
                href="https://github.com/trynewthin/oh-my-tab"
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-2 rounded-lg text-base font-semibold hover:underline"
              >
                <GithubLogo className="size-6 shrink-0" />
                <span className="break-all">trynewthin/oh-my-tab</span>
              </a>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
