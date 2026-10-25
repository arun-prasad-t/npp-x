import { Logo } from "./Logo";
import { RELEASES_URL } from "./BrowserWelcomeDialog";

type Props = {
  visible: boolean;
};

/** Always-on browser chrome strip — desktop download CTA (no dismiss). */
export function BrowserDownloadBanner({ visible }: Props) {
  if (!visible) return null;

  return (
    <div className="browser-download-banner" role="region" aria-label="Desktop download">
      <Logo size={20} />
      <p>
        <strong>Online mode</strong>
        <span className="browser-download-sep" aria-hidden="true">
          ·
        </span>
        Desktop is lighter, opens real files, and auto-updates.
      </p>
      <a
        className="browser-download-cta"
        href={RELEASES_URL}
        target="_blank"
        rel="noreferrer"
      >
        Download desktop
      </a>
    </div>
  );
}
