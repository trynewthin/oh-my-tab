import { describe, expect, it } from "vitest"
import { labelManifest, releasePlan } from "../../scripts/release/plan.ts"

const context = {
  event: "push",
  ref: "refs/heads/nightly",
  sha: "a".repeat(40),
  runNumber: "42",
  date: "20261117",
  version: "1.6.0",
  manifestVersion: "1.6.0",
}

describe("release channels", () => {
  it("creates a unique nightly prerelease for a nightly push", () => {
    expect(releasePlan(context)).toEqual({
      channel: "nightly",
      release: true,
      tag: "v1.6.0-nightly.20261117.42",
      version_name: "1.6.0-nightly.20261117.42",
      package_name: "oh-my-tab-1.6.0-nightly.20261117.42",
    })
    expect(releasePlan({ ...context, runNumber: "43" }).tag).not.toBe(
      releasePlan(context).tag
    )
  })
  it("also supports manual nightly builds", () => {
    expect(
      releasePlan({ ...context, event: "workflow_dispatch" })
    ).toMatchObject({ channel: "nightly", release: true })
  })
  it("keeps stable versions and filenames free of suffixes", () => {
    expect(releasePlan({ ...context, ref: "refs/tags/v1.6.0" })).toEqual({
      channel: "stable",
      release: true,
      tag: "v1.6.0",
      version_name: "1.6.0",
      package_name: "oh-my-tab-1.6.0",
    })
  })
  it("does not publish from a stable branch push", () => {
    expect(releasePlan({ ...context, ref: "refs/heads/stable" })).toMatchObject(
      { channel: "stable", release: false, tag: "" }
    )
  })
  it("never classifies a nightly tag as stable", () => {
    expect(
      releasePlan({ ...context, ref: "refs/tags/v1.6.0-nightly.20261117.42" })
    ).toMatchObject({
      channel: "nightly",
      release: true,
      version_name: "1.6.0-nightly.20261117.42",
    })
  })
  it.each([
    "v1.5.9",
    "v1.6.0-beta.1",
    "v1.6.0+build.1",
    "v1.6.0-nightly.",
    "v1.6.0-nightly.a..b",
    "v1.6.0malformed",
  ])("rejects mismatched or unsupported tag %s", (tag) => {
    expect(() => releasePlan({ ...context, ref: `refs/tags/${tag}` })).toThrow()
  })
  it.each(["refs/pull/1/merge", "refs/heads/nightly", "refs/tags/v1.6.0"])(
    "does not release pull requests even with ref %s",
    (ref) => {
      expect(
        releasePlan({ ...context, ref, event: "pull_request" })
      ).toMatchObject({ channel: "ci", release: false, tag: "" })
    }
  )
  it("rejects inconsistent package and manifest versions", () => {
    expect(() =>
      releasePlan({ ...context, manifestVersion: "1.5.9" })
    ).toThrow()
  })
})

describe("packaged manifest", () => {
  it("labels nightly without changing Chrome's numeric version", () => {
    const manifest = { version: "1.6.0", name: "Oh My Tab" }
    expect(
      labelManifest(manifest, "nightly", "1.6.0-nightly.20261117.42")
    ).toEqual({ ...manifest, version_name: "1.6.0-nightly.20261117.42" })
    expect(manifest).not.toHaveProperty("version_name")
  })
  it("removes prerelease labels from stable packages", () => {
    expect(
      labelManifest(
        { version: "1.6.0", version_name: "1.6.0-nightly.42" },
        "stable",
        "1.6.0"
      )
    ).toEqual({ version: "1.6.0" })
  })
  it("rejects a nightly label for a different version", () => {
    expect(() =>
      labelManifest({ version: "1.6.0" }, "nightly", "1.5.9-nightly.42")
    ).toThrow()
  })
})
