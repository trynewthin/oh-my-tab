import { ArrowUpRight, GithubLogo } from "@phosphor-icons/react"
import PrivacySettings from "./privacy-settings"

export default function AboutSettings() {
  return (
    <section className="space-y-5" aria-labelledby="about-settings-title">
      <h2 id="about-settings-title" className="text-base leading-6 font-medium">
        关于
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-8 py-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src={`${import.meta.env.BASE_URL}icons/icon-128.png`}
            alt=""
            className="size-24 shrink-0"
            width={96}
            height={96}
          />
          <span className="text-xl font-semibold">Oh My Tab</span>
        </div>
        <div className="min-w-0 rounded-2xl border bg-muted/20 p-4">
          <a
            href="https://github.com/trynewthin/oh-my-tab"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg text-sm font-semibold hover:underline"
          >
            <GithubLogo className="size-5 shrink-0" />
            <span className="break-all">trynewthin/oh-my-tab</span>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
          </a>
          <a
            href="https://github.com/trynewthin"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground hover:text-foreground"
          >
            <img
              src={`${import.meta.env.BASE_URL}icons/author.png`}
              alt="trynewthin 的头像"
              className="size-7 shrink-0 rounded-full"
              width={28}
              height={28}
            />
            <div className="min-w-0">
              <div>作者</div>
              <div className="text-[11px]">@trynewthin</div>
            </div>
            <ArrowUpRight className="ml-auto size-3 shrink-0" />
          </a>
        </div>
      </div>
      <PrivacySettings />
    </section>
  )
}
