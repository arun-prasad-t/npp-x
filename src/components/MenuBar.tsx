import { LANGUAGE_MENU } from "../lib/languages";
import { TOP_MENUS, type MenuEntry } from "../lib/npp/menus";
import { shortcutLabelFor } from "../lib/npp/shortcuts";
import type { PluginPackage } from "../lib/plugins";
import { Logo } from "./Logo";

type Props = {
  language: string;
  encoding: string;
  onCommand: (id: number) => void;
  onLanguageChange: (key: string) => void;
  pluginCommands: Array<{ plugin: PluginPackage; id: string; title: string }>;
  onPluginCommand: (plugin: PluginPackage, commandId: string) => void;
  recording: boolean;
};

function Item({
  label,
  shortcut,
  onClick,
  checked,
}: {
  label: string;
  shortcut?: string;
  onClick?: () => void;
  checked?: boolean;
}) {
  return (
    <button type="button" className="menu-item" onClick={onClick} role="menuitem">
      <span>
        {checked ? "✓ " : ""}
        {label}
      </span>
      {shortcut ? <kbd>{shortcut}</kbd> : null}
    </button>
  );
}

function Entries({
  items,
  onCommand,
}: {
  items: MenuEntry[];
  onCommand: (id: number) => void;
}) {
  return (
    <>
      {items.map((entry, i) => {
        if (entry.kind === "sep") return <div key={`s${i}`} className="menu-sep" />;
        if (entry.kind === "submenu") {
          return (
            <div key={entry.label} className="menu nested">
              <button type="button" className="menu-item has-sub">
                <span>{entry.label}</span>
                <span className="sub-caret">▸</span>
              </button>
              <div className="menu-dropdown nested-dropdown" role="menu">
                <Entries items={entry.items} onCommand={onCommand} />
              </div>
            </div>
          );
        }
        return (
          <Item
            key={`${entry.id}-${entry.label}`}
            label={entry.label}
            shortcut={shortcutLabelFor(entry.id)}
            onClick={() => onCommand(entry.id)}
          />
        );
      })}
    </>
  );
}

export function MenuBar(props: Props) {
  return (
    <nav className="menu-bar" aria-label="Main menu">
      {TOP_MENUS.filter((m) => m.label !== "Language").map((menu) => (
        <div key={menu.label} className="menu">
          <button type="button" className="menu-trigger">
            {menu.label}
            {menu.label === "Macro" && props.recording ? " ●" : ""}
          </button>
          <div className="menu-dropdown" role="menu">
            <Entries items={menu.items} onCommand={props.onCommand} />
          </div>
        </div>
      ))}

      <div className="menu menu-scroll">
        <button type="button" className="menu-trigger">
          Language
        </button>
        <div className="menu-dropdown" role="menu">
          {LANGUAGE_MENU.map((lang) => (
            <Item
              key={lang.key}
              label={lang.label}
              checked={props.language === lang.key}
              onClick={() => props.onLanguageChange(lang.key)}
            />
          ))}
        </div>
      </div>

      <div className="menu">
        <button type="button" className="menu-trigger">
          Plugins
        </button>
        <div className="menu-dropdown" role="menu">
          <Item
            label="Plugin Store…"
            onClick={() => props.onCommand(-1003)}
          />
          {props.pluginCommands.length ? <div className="menu-sep" /> : null}
          {props.pluginCommands.map((cmd) => (
            <Item
              key={`${cmd.plugin.id}:${cmd.id}`}
              label={`${cmd.title}`}
              onClick={() => props.onPluginCommand(cmd.plugin, cmd.id)}
            />
          ))}
        </div>
      </div>

      <div className="brand-chip" title="npp-x">
        <Logo size={18} />
        <span>npp-x</span>
      </div>
    </nav>
  );
}
