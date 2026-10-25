type Props = {
  open: boolean;
  status: "loading" | "latest" | "available" | "error" | "browser";
  currentVersion: string;
  latestVersion?: string;
  notes: string;
  releaseUrl: string;
  error?: string;
  busy?: boolean;
  onClose: () => void;
  onInstall?: () => void;
  onOpenRelease: () => void;
};

/** Help → Check for Updates — always surfaces release notes. */
export function UpdateDialog(props: Props) {
  if (!props.open) return null;

  const title =
    props.status === "loading"
      ? "Checking for updates…"
      : props.status === "available"
        ? `npp-x ${props.latestVersion} is available`
        : props.status === "error"
          ? "Update check failed"
          : props.status === "browser"
            ? "Updates (browser)"
            : `You’re on the latest — ${props.currentVersion}`;

  const blurb =
    props.status === "available"
      ? "Install from GitHub Releases when you’re ready. Notes for this version:"
      : props.status === "latest"
        ? "No update needed. Here’s what shipped in the latest release:"
        : props.status === "browser"
          ? "Online mode can’t auto-install. Grab the desktop build from Releases — notes below:"
          : props.status === "error"
            ? props.error ?? "Something went wrong."
            : "Fetching release notes…";

  return (
    <div className="app-overlay" role="presentation" onClick={props.onClose}>
      <div
        className="app-dialog update-dialog"
        role="dialog"
        aria-labelledby="update-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="update-header">
          <div>
            <h2 id="update-title">{title}</h2>
            <p>{blurb}</p>
          </div>
          <button
            type="button"
            className="app-dialog-x"
            aria-label="Close"
            onClick={props.onClose}
          >
            ×
          </button>
        </header>

        {props.status !== "loading" && props.status !== "error" ? (
          <pre className="release-notes">{props.notes || "No release notes."}</pre>
        ) : null}

        <footer className="app-dialog-actions">
          {props.status === "available" && props.onInstall ? (
            <button
              type="button"
              className="primary"
              disabled={props.busy}
              onClick={props.onInstall}
            >
              {props.busy ? "Downloading…" : "Download & Install"}
            </button>
          ) : null}
          <button type="button" onClick={props.onOpenRelease}>
            View on GitHub
          </button>
          <button type="button" className="ghost" onClick={props.onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
