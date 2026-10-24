import { useState } from "react";
import { isRememberSessionEnabled } from "../lib/session";

const DISMISS_KEY = "nppx.browserSessionBanner.dismissed";

type Props = {
  visible: boolean;
};

export function BrowserSessionBanner({ visible }: Props) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "1",
  );

  if (!visible || dismissed || !isRememberSessionEnabled()) return null;

  return (
    <div className="browser-session-banner" role="status">
      <p>
        <strong>Browser session restore is on.</strong> Open tabs and unsaved
        edits are saved in this browser’s{" "}
        <code>localStorage</code> / IndexedDB so they come back after refresh —
        that can use noticeable disk space if you keep many large files open.
        Turn off anytime: <em>Settings → Remember session for next launch</em>.
      </p>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
      >
        Got it
      </button>
    </div>
  );
}
