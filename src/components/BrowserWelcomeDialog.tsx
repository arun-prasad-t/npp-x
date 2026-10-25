import { useEffect, useId, useRef, useState } from "react";
import { Logo } from "./Logo";

export const RELEASES_URL =
  "https://github.com/arun-prasad-t/npp-x/releases/latest";

type Props = {
  /** Show on every browser page load (desktop builds pass false). */
  autoOpen: boolean;
  /** Force open from Help → Download desktop… */
  forceOpen?: boolean;
  onClose: () => void;
};

/**
 * Download nudge for the online demo — opens on every visit.
 * Closing only hides it for this page load; next refresh shows it again.
 */
export function BrowserWelcomeDialog({
  autoOpen,
  forceOpen = false,
  onClose,
}: Props) {
  const titleId = useId();
  const primaryRef = useRef<HTMLAnchorElement>(null);
  const [closed, setClosed] = useState(false);

  // Drop any older “don’t show again” flag so returning visitors see the CTA.
  useEffect(() => {
    try {
      localStorage.removeItem("nppx.browserWelcome.v2");
      localStorage.removeItem("nppx.browserWelcome.v1");
    } catch {
      /* ignore */
    }
  }, []);

  const open = forceOpen || (autoOpen && !closed);

  const dismiss = () => {
    setClosed(true);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    primaryRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setClosed(true);
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="market-overlay welcome-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="welcome-panel">
        <div className="welcome-brand">
          <Logo size={56} />
          <p className="welcome-wordmark">npp-x</p>
        </div>
        <h2 id={titleId}>Online mode</h2>
        <p className="welcome-lead">
          The Mac &amp; Linux Notepad++ people asked for — try it here in the
          browser.
        </p>
        <p className="welcome-sub">
          Same muscle memory. Native files, dialogs, and auto-update need the
          desktop app.
        </p>
        <div className="welcome-actions">
          <a
            ref={primaryRef}
            className="welcome-cta"
            href={RELEASES_URL}
            target="_blank"
            rel="noreferrer"
          >
            Download for desktop
          </a>
          <button type="button" className="welcome-continue" onClick={dismiss}>
            Continue in browser
          </button>
        </div>
        <p className="welcome-note">
          Independent MIT project — inspired by Notepad++, not an official
          release.
        </p>
      </div>
    </div>
  );
}
