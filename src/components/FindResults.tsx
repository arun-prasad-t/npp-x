import type { ResultSet } from "../lib/findActions";

type Props = {
  results: ResultSet | null;
  onGoto: (tabId: string, index: number, length: number) => void;
  onClose: () => void;
};

/** N++ "Search results" panel. */
export function FindResults({ results, onGoto, onClose }: Props) {
  if (!results) return null;
  return (
    <section className="find-results" aria-label="Search results">
      <header>
        <strong>Search results</strong>
        <span>
          “{results.query}” — {results.total} hit{results.total === 1 ? "" : "s"} in{" "}
          {results.groups.length} file{results.groups.length === 1 ? "" : "s"}
        </span>
        <button type="button" aria-label="Close results" onClick={onClose}>×</button>
      </header>
      <div className="fr-list">
        {results.groups.map((g) => (
          <div key={g.tabId}>
            <div className="fr-file">
              {g.name} <em>({g.lines.length} hit{g.lines.length === 1 ? "" : "s"})</em>
            </div>
            {g.lines.map((l, i) => (
              <button
                type="button"
                key={i}
                className="fr-line"
                onClick={() => onGoto(g.tabId, l.index, l.length)}
              >
                <span className="fr-no">Line {l.line}:</span>
                <span className="fr-text">{l.text.trim().slice(0, 240)}</span>
              </button>
            ))}
          </div>
        ))}
        {!results.groups.length ? <div className="fr-file">No matches.</div> : null}
      </div>
    </section>
  );
}
