type Props = {
  open: boolean;
  mode: "find" | "replace";
  query: string;
  replacement: string;
  onQuery: (v: string) => void;
  onReplacement: (v: string) => void;
  onFindNext: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
  onClose: () => void;
};

export function FindBar(props: Props) {
  if (!props.open) return null;

  return (
    <div className="find-bar" role="search">
      <label>
        Find what
        <input
          autoFocus
          value={props.query}
          onChange={(e) => props.onQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") props.onFindNext();
            if (e.key === "Escape") props.onClose();
          }}
        />
      </label>
      {props.mode === "replace" ? (
        <label>
          Replace with
          <input
            value={props.replacement}
            onChange={(e) => props.onReplacement(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") props.onReplace();
              if (e.key === "Escape") props.onClose();
            }}
          />
        </label>
      ) : null}
      <div className="find-actions">
        <button type="button" onClick={props.onFindNext}>
          Find Next
        </button>
        {props.mode === "replace" ? (
          <>
            <button type="button" onClick={props.onReplace}>
              Replace
            </button>
            <button type="button" onClick={props.onReplaceAll}>
              Replace All
            </button>
          </>
        ) : null}
        <button type="button" className="ghost" onClick={props.onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
