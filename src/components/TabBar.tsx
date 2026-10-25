import { isDiffTab, type DocumentTab } from "../lib/documents";

type Props = {
  tabs: DocumentTab[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
};

export function TabBar({ tabs, activeId, onSelect, onClose }: Props) {
  return (
    <div className="tab-bar" role="tablist" aria-label="Documents">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        const diff = isDiffTab(tab);
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={active}
            className={`tab${active ? " active" : ""}${diff ? " tab-diff" : ""}`}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelect(tab.id);
            }}
            tabIndex={0}
          >
            <span className="tab-name">
              {tab.dirty ? "* " : ""}
              {tab.name}
            </span>
            <button
              type="button"
              className="tab-close"
              aria-label={`Close ${tab.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.id);
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
