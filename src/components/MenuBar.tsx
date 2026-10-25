import { useEffect, useRef, useState } from "react";
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
  onClose,
}: {
  items: MenuEntry[];
  onCommand: (id: number) => void;
  onClose: () => void;
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
                <Entries
                  items={entry.items}
                  onCommand={onCommand}
                  onClose={onClose}
                />
              </div>
            </div>
          );
        }
        return (
          <Item
            key={`${entry.id}-${entry.label}`}
            label={entry.label}
            shortcut={shortcutLabelFor(entry.id)}
            onClick={() => {
              onCommand(entry.id);
              onClose();
            }}
          />
        );
      })}
    </>
  );
}

/**
 * Classic menubar: click to open (no hover race).
 * While open, hovering another top-level item switches menus — Windows/N++ style.
 */
export function MenuBar(props: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLElement | null>(null);
  const close = () => setOpen(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (root.current?.contains(e.target as Node)) return;
      setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const topMenus = TOP_MENUS.filter((m) => m.label !== "Language");
  const pluginGroups = (() => {
    const groups: Array<{
      plugin: PluginPackage;
      cmds: Array<{ id: string; title: string }>;
    }> = [];
    for (const cmd of props.pluginCommands) {
      let g = groups.find((x) => x.plugin.id === cmd.plugin.id);
      if (!g) {
        g = { plugin: cmd.plugin, cmds: [] };
        groups.push(g);
      }
      g.cmds.push({ id: cmd.id, title: cmd.title });
    }
    return groups;
  })();

  const trigger = (id: string) => ({
    onClick: () => setOpen((cur) => (cur === id ? null : id)),
    onPointerEnter: () => {
      if (open) setOpen(id);
    },
  });

  return (
    <nav className="menu-bar" aria-label="Main menu" ref={root}>
      {topMenus.map((menu) => (
        <div
          key={menu.label}
          className={"menu" + (open === menu.label ? " open" : "")}
        >
          <button
            type="button"
            className="menu-trigger"
            aria-expanded={open === menu.label}
            aria-haspopup="menu"
            {...trigger(menu.label)}
          >
            {menu.label}
            {menu.label === "Macro" && props.recording ? " ●" : ""}
          </button>
          {open === menu.label ? (
            <div className="menu-dropdown" role="menu">
              <Entries
                items={menu.items}
                onCommand={props.onCommand}
                onClose={close}
              />
            </div>
          ) : null}
        </div>
      ))}

      <div className={"menu menu-scroll" + (open === "Language" ? " open" : "")}>
        <button
          type="button"
          className="menu-trigger"
          aria-expanded={open === "Language"}
          aria-haspopup="menu"
          {...trigger("Language")}
        >
          Language
        </button>
        {open === "Language" ? (
          <div className="menu-dropdown" role="menu">
            {LANGUAGE_MENU.map((lang) => (
              <Item
                key={lang.key}
                label={lang.label}
                checked={props.language === lang.key}
                onClick={() => {
                  props.onLanguageChange(lang.key);
                  close();
                }}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className={"menu" + (open === "Plugins" ? " open" : "")}>
        <button
          type="button"
          className="menu-trigger"
          aria-expanded={open === "Plugins"}
          aria-haspopup="menu"
          {...trigger("Plugins")}
        >
          Plugins
        </button>
        {open === "Plugins" ? (
          <div className="menu-dropdown" role="menu">
            <Item
              label="Plugin Store…"
              onClick={() => {
                props.onCommand(-1003);
                close();
              }}
            />
            {pluginGroups.length ? (
              <>
                <div className="menu-sep" />
                {pluginGroups.map((g) =>
                  g.cmds.length === 1 ? (
                    <Item
                      key={g.plugin.id}
                      label={g.plugin.name}
                      onClick={() => {
                        props.onPluginCommand(g.plugin, g.cmds[0].id);
                        close();
                      }}
                    />
                  ) : (
                    <div key={g.plugin.id} className="menu nested">
                      <button type="button" className="menu-item has-sub">
                        <span>{g.plugin.name}</span>
                        <span className="sub-caret">▸</span>
                      </button>
                      <div className="menu-dropdown nested-dropdown" role="menu">
                        {g.cmds.map((c) => (
                          <Item
                            key={c.id}
                            label={c.title}
                            onClick={() => {
                              props.onPluginCommand(g.plugin, c.id);
                              close();
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="brand-chip" title="npp-x">
        <Logo size={18} />
        <span>npp-x</span>
      </div>
    </nav>
  );
}
