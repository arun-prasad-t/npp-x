import { Logo } from "./Logo";
import {
  APP_VERSION,
  LIVE_URL,
  RELEASES_URL,
  REPO_URL,
} from "../lib/appVersion";
import { WHATS_NEW } from "../lib/whatsNew";

type Props = {
  open: boolean;
  onClose: () => void;
  onCheckUpdates: () => void;
};

/** Brand-first About — pitch, proof, lineage, what’s new. */
export function AboutDialog({ open, onClose, onCheckUpdates }: Props) {
  if (!open) return null;

  return (
    <div className="app-overlay" role="presentation" onClick={onClose}>
      <div
        className="app-dialog about-dialog"
        role="dialog"
        aria-labelledby="about-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="about-hero">
          <Logo size={64} />
          <div>
            <p className="about-eyebrow">Independent · MIT · N++-inspired</p>
            <h2 id="about-title">npp-x</h2>
            <p className="about-tagline">
              The Mac &amp; Linux Notepad++ people asked for — for decades.
            </p>
          </div>
          <button type="button" className="app-dialog-x" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>

        <p className="about-pitch">
          Same muscle memory. Modern Monaco engine. Native shell on Linux, macOS,
          and Windows. Reconstructed from Notepad++ 8.8.1 —{" "}
          <strong>not</strong> an official Notepad++ release, and proud of that
          honesty.
        </p>

        <ul className="about-pillars">
          <li>
            <strong>The wait is over</strong>
            <span>Mac &amp; Linux are first-class, not afterthoughts.</span>
          </li>
          <li>
            <strong>Muscle memory</strong>
            <span>N++ menus, Find/Replace power, Diff tabs — not a new religion.</span>
          </li>
          <li>
            <strong>Modern where it counts</strong>
            <span>Themes, plugins, session restore, auto-update from GitHub Releases.</span>
          </li>
        </ul>

        <div className="about-meta">
          <span>
            Version <strong>{APP_VERSION}</strong>
          </span>
          <a href={LIVE_URL} target="_blank" rel="noreferrer">
            Live demo
          </a>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={RELEASES_URL} target="_blank" rel="noreferrer">
            Releases
          </a>
        </div>

        <section className="about-notes" aria-label="What's new">
          <h3>What’s new in {APP_VERSION}</h3>
          <pre className="release-notes">{WHATS_NEW}</pre>
        </section>

        <footer className="app-dialog-actions">
          <button type="button" className="primary" onClick={onCheckUpdates}>
            Check for Updates…
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
