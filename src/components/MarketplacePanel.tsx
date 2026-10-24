import { useMemo, useState } from "react";
import {
  installFromFileText,
  installFromGitUrl,
  listInstalledPlugins,
  listInstalledThemes,
  removeInstalledPlugin,
  removeInstalledTheme,
  type InstallResult,
} from "../lib/marketplace";
import { EXAMPLE_PLUGIN, type PluginPackage } from "../lib/plugins";
import { BUILTIN_THEMES, type ThemePackage } from "../lib/themes";
import { Logo } from "./Logo";

type Props = {
  open: boolean;
  tab: "themes" | "plugins";
  activeThemeId: string;
  onClose: () => void;
  onSelectTheme: (theme: ThemePackage) => void;
  onInstall: () => void;
  onRunPluginCommand: (plugin: PluginPackage, commandId: string) => void;
  enabledPluginIds: string[];
  onTogglePlugin: (id: string, enabled: boolean) => void;
};

export function MarketplacePanel(props: Props) {
  const [gitUrl, setGitUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const installedThemes = useMemo(() => listInstalledThemes(), [props.open, status]);
  const installedPlugins = useMemo(
    () => listInstalledPlugins(),
    [props.open, status],
  );

  if (!props.open) return null;

  const themes = [
    ...BUILTIN_THEMES,
    ...installedThemes.filter((t) => !BUILTIN_THEMES.some((b) => b.id === t.id)),
  ];
  const plugins = [
    EXAMPLE_PLUGIN,
    ...installedPlugins.filter((p) => p.id !== EXAMPLE_PLUGIN.id),
  ];

  const report = (result: InstallResult) => {
    if (result.ok) {
      setStatus(`Installed ${result.kind}: ${result.package.name}`);
      props.onInstall();
    } else {
      setStatus(result.error);
    }
  };

  const onPickFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setBusy(true);
      const text = await file.text();
      report(await installFromFileText(text, file.name));
      setBusy(false);
    };
    input.click();
  };

  const onGitInstall = async () => {
    setBusy(true);
    report(await installFromGitUrl(gitUrl));
    setBusy(false);
  };

  return (
    <div className="market-overlay" role="dialog" aria-modal="true">
      <div className="market-panel">
        <header className="market-header">
          <div className="market-title">
            <Logo size={28} />
            <div>
              <h2>{props.tab === "themes" ? "Theme Store" : "Plugin Store"}</h2>
              <p>Install from a local JSON file or any public git / raw URL.</p>
            </div>
          </div>
          <button type="button" className="ghost" onClick={props.onClose}>
            Close
          </button>
        </header>

        <section className="market-install">
          <label>
            Git or raw JSON URL
            <input
              value={gitUrl}
              onChange={(e) => setGitUrl(e.target.value)}
              placeholder="https://github.com/you/nppx-theme or …/theme.json"
            />
          </label>
          <div className="market-install-actions">
            <button type="button" disabled={busy || !gitUrl.trim()} onClick={() => void onGitInstall()}>
              Install from URL
            </button>
            <button type="button" disabled={busy} onClick={onPickFile}>
              Install from file…
            </button>
          </div>
          {status ? <p className="market-status">{status}</p> : null}
        </section>

        {props.tab === "themes" ? (
          <div className="market-grid">
            {themes.map((theme) => (
              <article key={theme.id} className="market-card">
                <div
                  className="theme-swatch"
                  style={{
                    background: `linear-gradient(135deg, ${theme.chrome["--npp-chrome"]}, ${theme.chrome["--npp-accent"]})`,
                  }}
                />
                <h3>{theme.name}</h3>
                <p>{theme.description ?? theme.author ?? theme.id}</p>
                <div className="market-card-actions">
                  <button
                    type="button"
                    className={props.activeThemeId === theme.id ? "primary" : undefined}
                    onClick={() => props.onSelectTheme(theme)}
                  >
                    {props.activeThemeId === theme.id ? "Active" : "Apply"}
                  </button>
                  {!BUILTIN_THEMES.some((b) => b.id === theme.id) ? (
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => {
                        removeInstalledTheme(theme.id);
                        setStatus(`Removed ${theme.name}`);
                        props.onInstall();
                      }}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="market-grid">
            {plugins.map((plugin) => {
              const enabled = props.enabledPluginIds.includes(plugin.id);
              return (
                <article key={plugin.id} className="market-card">
                  <h3>{plugin.name}</h3>
                  <p>{plugin.description ?? plugin.author ?? plugin.id}</p>
                  <p className="market-meta">v{plugin.version}</p>
                  <div className="market-card-actions">
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) =>
                          props.onTogglePlugin(plugin.id, e.target.checked)
                        }
                      />
                      Enabled
                    </label>
                    {(plugin.contributes?.commands ?? []).map((cmd) => (
                      <button
                        key={cmd.id}
                        type="button"
                        disabled={!enabled}
                        onClick={() => props.onRunPluginCommand(plugin, cmd.id)}
                      >
                        {cmd.title}
                      </button>
                    ))}
                    {plugin.id !== EXAMPLE_PLUGIN.id ? (
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => {
                          removeInstalledPlugin(plugin.id);
                          setStatus(`Removed ${plugin.name}`);
                          props.onInstall();
                        }}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
