import { APP_VERSION } from "./appVersion";

/**
 * Release notes for the version shipping in this build.
 * Copied into the GitHub Release body so the updater can show the same text.
 */
export const WHATS_NEW = `## npp-x ${APP_VERSION}

### Fixes
- **Export PDF on desktop** — no more “pop-ups blocked”; print dialog opens reliably

### Site
- SEO for Markdown preview, MD/HTML/CSV → PDF, Diff check — live at https://npp-x.npp-x.workers.dev

### Still with you
- **Find & Replace** (Normal / Extended / Regex) · **Diff** tabs · **HTML / CSV / Markdown+Mermaid** split preview
- **Export PDF** · Open-with \`.txt\` \`.csv\` \`.html\` \`.md\` · auto-update notes

### macOS (Gatekeeper)
Builds are **ad-hoc signed**. Use **Open-npp-x.command** from the release, or:
\`xattr -cr /Applications/npp-x.app && open /Applications/npp-x.app\`

Guide: https://github.com/arun-prasad-t/npp-x/blob/main/docs/MACOS-OPEN.md
`;

export type GithubRelease = {
  tag: string;
  name: string;
  body: string;
  htmlUrl: string;
  publishedAt: string;
};

/** Latest published release notes (GitHub API). Falls back to bundled WHATS_NEW. */
export async function fetchLatestReleaseNotes(): Promise<GithubRelease> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/arun-prasad-t/npp-x/releases/latest",
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      tag_name?: string;
      name?: string;
      body?: string;
      html_url?: string;
      published_at?: string;
    };
    const tag = data.tag_name?.trim();
    if (!tag) throw new Error("missing tag");
    return {
      tag,
      name: data.name?.trim() || tag,
      body: (data.body ?? "").trim() || WHATS_NEW,
      htmlUrl: data.html_url?.trim() || `https://github.com/arun-prasad-t/npp-x/releases/tag/${tag}`,
      publishedAt: data.published_at?.trim() || "",
    };
  } catch {
    return {
      tag: `v${APP_VERSION}`,
      name: `npp-x v${APP_VERSION}`,
      body: WHATS_NEW,
      htmlUrl: `https://github.com/arun-prasad-t/npp-x/releases/tag/v${APP_VERSION}`,
      publishedAt: "",
    };
  }
}
