/**
 * Default plugins shipped with Notepad++ 8.8.1 portable (REA artifact):
 * mimeTools, NppConverter, NppExport — reimplemented as npp-x plugin packages.
 */
import type { PluginPackage } from "./plugins";

export const DEFAULT_PLUGINS: PluginPackage[] = [
  {
    schema: "npp-x.plugin/1",
    id: "npp.mimeTools",
    name: "Mime tools",
    author: "npp-x (from N++ mimeTools)",
    version: "1.0.0",
    description: "Base64 encode/decode selection (N++ default plugin).",
    contributes: {
      commands: [
        { id: "mime.base64.encode", title: "Base64 Encode" },
        { id: "mime.base64.decode", title: "Base64 Decode" },
      ],
      menus: { tools: ["mime.base64.encode", "mime.base64.decode"] },
    },
    code: `
nppx.registerCommand("mime.base64.encode", () => {
  const t = nppx.getActiveText();
  try {
    nppx.setActiveText(btoa(unescape(encodeURIComponent(t))));
    nppx.notify("Base64 encoded");
  } catch (e) { nppx.notify("Base64 encode failed"); }
});
nppx.registerCommand("mime.base64.decode", () => {
  const t = nppx.getActiveText().trim();
  try {
    nppx.setActiveText(decodeURIComponent(escape(atob(t))));
    nppx.notify("Base64 decoded");
  } catch (e) { nppx.notify("Base64 decode failed"); }
});
`,
  },
  {
    schema: "npp-x.plugin/1",
    id: "npp.converter",
    name: "Converter",
    author: "npp-x (from N++ NppConverter)",
    version: "1.0.0",
    description: "ASCII ↔ Hex conversion (N++ default plugin).",
    contributes: {
      commands: [
        { id: "conv.ascii2hex", title: "ASCII to Hex" },
        { id: "conv.hex2ascii", title: "Hex to ASCII" },
      ],
      menus: { tools: ["conv.ascii2hex", "conv.hex2ascii"] },
    },
    code: `
nppx.registerCommand("conv.ascii2hex", () => {
  const t = nppx.getActiveText();
  const hex = Array.from(t).map(c => c.charCodeAt(0).toString(16).padStart(2,"0")).join(" ");
  nppx.setActiveText(hex);
  nppx.notify("Converted to hex");
});
nppx.registerCommand("conv.hex2ascii", () => {
  const parts = nppx.getActiveText().trim().split(/\\s+/).filter(Boolean);
  try {
    nppx.setActiveText(parts.map(h => String.fromCharCode(parseInt(h,16))).join(""));
    nppx.notify("Converted to ASCII");
  } catch (e) { nppx.notify("Hex convert failed"); }
});
`,
  },
  {
    schema: "npp-x.plugin/1",
    id: "npp.export",
    name: "NppExport",
    author: "npp-x (from N++ NppExport)",
    version: "1.0.0",
    description: "Export document as HTML (N++ default plugin).",
    contributes: {
      commands: [
        { id: "export.html", title: "Export to HTML" },
      ],
      menus: { tools: ["export.html"] },
    },
    code: `
nppx.registerCommand("export.html", () => {
  const body = nppx.getActiveText()
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const html = "<!DOCTYPE html><html><head><meta charset=\\"utf-8\\"><title>export</title></head><body><pre>"+body+"</pre></body></html>";
  nppx.setActiveText(html);
  nppx.notify("Exported as HTML in buffer — Save As to keep");
});
`,
  },
];
