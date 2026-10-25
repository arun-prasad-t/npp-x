import { APP_VERSION } from "./appVersion";

/**
 * Release notes for the version shipping in this build.
 * Copied into the GitHub Release body so the updater can show the same text.
 */
export const WHATS_NEW = `## npp-x ${APP_VERSION}

The Mac & Linux Notepad++ people asked for — with previews, PDF export, and Find that finally feels like N++.

### Editor & search
- **N++-style Find & Replace** — Normal / Extended / Regex, Count, Find All, Mark, Replace All across open docs (REA dialog 1600)
- **Diff as its own tab** — top-level **Diff** menu; Compare Tabs / Clipboard; no sticky overlay when you switch files
- **Per-tab undo** — each document keeps its own undo stack (Monaco models)

### Previews (on by default)
- **HTML Preview** · **CSV Table** · **Markdown + Mermaid** (flow, sequence, class, …)
- **Split view first** — editor | preview side-by-side; expand to **Full** anytime
- **Quick preview chip** — paste HTML / MD / CSV and open preview without hunting menus
- **Export PDF** — preview toolbar or File → Export Preview as PDF… (system print → Save as PDF)
- Previews are **per file** — switch tabs and they follow (or stay closed)

### Desktop
- **Open with npp-x** — registers \`.txt\` \`.csv\` \`.html\` \`.md\` (set as default in your OS)
- **Auto-update** — Help → Check for Updates shows full release notes (even when you’re current)
- **About npp-x** — brand pitch, pillars, and what’s new

### Fun optional plugins
- **YouTube PiP** — corner player, draggable, doesn’t steal editor shortcuts
- **Type Runner** — vector buddy that runs / zooms / naps with your typing speed

### Also
- Click-stable menus (no hover race); Plugins use submenus
- Live demo: https://npp-x.pages.dev

### macOS (Gatekeeper)
Builds are **ad-hoc signed** (not Apple-notarized). After install, use **Open-npp-x.command** from the release, or:
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
    return {
      tag: data.tag_name ?? `v${APP_VERSION}`,
      name: data.name ?? `npp-x ${APP_VERSION}`,
      body: (data.body ?? "").trim() || WHATS_NEW,
      htmlUrl:
        data.html_url ??
        "https://github.com/arun-prasad-t/npp-x/releases/latest",
      publishedAt: data.published_at ?? "",
    };
  } catch {
    return {
      tag: `v${APP_VERSION}`,
      name: `npp-x ${APP_VERSION}`,
      body: WHATS_NEW,
      htmlUrl: "https://github.com/arun-prasad-t/npp-x/releases/latest",
      publishedAt: "",
    };
  }
}
