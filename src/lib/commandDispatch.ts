import type { editor as MonacoEditor } from "monaco-editor";
import { editorCopy, editorCut, editorPaste } from "./clipboard";
import { formatJson, formatXml } from "./formatters";
import { CMD } from "./npp/shortcuts";
import { NPPX } from "./npp/menus";

export type DispatchContext = {
  notify: (msg: string) => void;
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  getText: () => string;
  setText: (text: string, dirty?: boolean) => void;
  transformSelectionOrDoc: (fn: (s: string) => string) => void;
  formatDocument: (kind: "json" | "xml", minify: boolean) => void;
  openDiffTabs: () => void;
  openDiffClipboard: () => void;
  exitDiff: () => void;
  toggleRememberSession: () => void;
  checkForUpdates: (interactive: boolean) => void;
  showDownloadDesktop: () => void;
  showAbout: () => void;
  showFileTypesHelp: () => void;
  // file ops
  newFile: () => void;
  openFile: () => void;
  save: (saveAs?: boolean) => void;
  close: () => void;
  closeAll: () => void;
  exit: () => void;
  /** Print preview as PDF when open; otherwise print the window. */
  print: () => void;
  exportPreviewPdf: () => void;
  // search / view
  find: () => void;
  findNext: () => void;
  findPrev: () => void;
  replace: () => void;
  gotoLine: () => void;
  toggleWordWrap: () => void;
  zoom: (delta: number) => void;
  setEncoding: (enc: string) => void;
  setEol: (eol: "\r\n" | "\n" | "\r") => void;
  // stores
  openThemeStore: () => void;
  openPluginStore: () => void;
  openShortcutMapper: () => void;
  // macro
  macroStart: () => void;
  macroStop: () => void;
  macroPlay: () => void;
  macroSave: () => void;
  macroMulti: () => void;
  // hash tools
  hashSelection: (algo: "MD5" | "SHA-1" | "SHA-256" | "SHA-512", toClipboard: boolean) => void;
  runDialog: () => void;
  recordAction: (id: number) => void;
};

async function digestHex(
  algo: "SHA-1" | "SHA-256" | "SHA-512",
  text: string,
): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest(algo, data);
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Tiny MD5 for Tools parity (N++ IDM_TOOL_MD5_*). */
function md5(str: string): string {
  // Prefer Web Crypto when available for SHA; MD5 via minimal impl
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    a = (a + q + x + t) | 0;
    return (((a << s) | (a >>> (32 - s))) + b) | 0;
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function toUtf8(s: string) {
    return unescape(encodeURIComponent(s));
  }
  const msg = toUtf8(str);
  const n = msg.length;
  const words: number[] = [];
  for (let i = 0; i < n; i++) words[i >> 2] |= msg.charCodeAt(i) << ((i % 4) * 8);
  words[n >> 2] |= 0x80 << ((n % 4) * 8);
  const bits = n * 8;
  words[(((bits + 64) >>> 9) << 4) + 14] = bits;
  let a = 1732584193,
    b = -271733879,
    c = -1732584194,
    d = 271733878;
  for (let i = 0; i < words.length; i += 16) {
    const oa = a,
      ob = b,
      oc = c,
      od = d;
    const w = words;
    a = ff(a, b, c, d, w[i + 0], 7, -680876936);
    d = ff(d, a, b, c, w[i + 1], 12, -389564586);
    c = ff(c, d, a, b, w[i + 2], 17, 606105819);
    b = ff(b, c, d, a, w[i + 3], 22, -1044525330);
    a = ff(a, b, c, d, w[i + 4], 7, -176418897);
    d = ff(d, a, b, c, w[i + 5], 12, 1200080426);
    c = ff(c, d, a, b, w[i + 6], 17, -1473231341);
    b = ff(b, c, d, a, w[i + 7], 22, -45705983);
    a = ff(a, b, c, d, w[i + 8], 7, 1770035416);
    d = ff(d, a, b, c, w[i + 9], 12, -1958414417);
    c = ff(c, d, a, b, w[i + 10], 17, -42063);
    b = ff(b, c, d, a, w[i + 11], 22, -1990404162);
    a = ff(a, b, c, d, w[i + 12], 7, 1804603682);
    d = ff(d, a, b, c, w[i + 13], 12, -40341101);
    c = ff(c, d, a, b, w[i + 14], 17, -1502002290);
    b = ff(b, c, d, a, w[i + 15], 22, 1236535329);
    a = gg(a, b, c, d, w[i + 1], 5, -165796510);
    d = gg(d, a, b, c, w[i + 6], 9, -1069501632);
    c = gg(c, d, a, b, w[i + 11], 14, 643717713);
    b = gg(b, c, d, a, w[i + 0], 20, -373897302);
    a = gg(a, b, c, d, w[i + 5], 5, -701558691);
    d = gg(d, a, b, c, w[i + 10], 9, 38016083);
    c = gg(c, d, a, b, w[i + 15], 14, -660478335);
    b = gg(b, c, d, a, w[i + 4], 20, -405537848);
    a = gg(a, b, c, d, w[i + 9], 5, 568446438);
    d = gg(d, a, b, c, w[i + 14], 9, -1019803690);
    c = gg(c, d, a, b, w[i + 3], 14, -187363961);
    b = gg(b, c, d, a, w[i + 8], 20, 1163531501);
    a = gg(a, b, c, d, w[i + 13], 5, -1444681467);
    d = gg(d, a, b, c, w[i + 2], 9, -51403784);
    c = gg(c, d, a, b, w[i + 7], 14, 1735328473);
    b = gg(b, c, d, a, w[i + 12], 20, -1926607734);
    a = hh(a, b, c, d, w[i + 5], 4, -378558);
    d = hh(d, a, b, c, w[i + 8], 11, -2022574463);
    c = hh(c, d, a, b, w[i + 11], 16, 1839030562);
    b = hh(b, c, d, a, w[i + 14], 23, -35309556);
    a = hh(a, b, c, d, w[i + 1], 4, -1530992060);
    d = hh(d, a, b, c, w[i + 4], 11, 1272893353);
    c = hh(c, d, a, b, w[i + 7], 16, -155497632);
    b = hh(b, c, d, a, w[i + 10], 23, -1094730640);
    a = hh(a, b, c, d, w[i + 13], 4, 681279174);
    d = hh(d, a, b, c, w[i + 0], 11, -358537222);
    c = hh(c, d, a, b, w[i + 3], 16, -722521979);
    b = hh(b, c, d, a, w[i + 6], 23, 76029189);
    a = hh(a, b, c, d, w[i + 9], 4, -640364487);
    d = hh(d, a, b, c, w[i + 12], 11, -421815835);
    c = hh(c, d, a, b, w[i + 15], 16, 530742520);
    b = hh(b, c, d, a, w[i + 2], 23, -995338651);
    a = ii(a, b, c, d, w[i + 0], 6, -198630844);
    d = ii(d, a, b, c, w[i + 7], 10, 1126891415);
    c = ii(c, d, a, b, w[i + 14], 15, -1416354905);
    b = ii(b, c, d, a, w[i + 5], 21, -57434055);
    a = ii(a, b, c, d, w[i + 12], 6, 1700485571);
    d = ii(d, a, b, c, w[i + 3], 10, -1894986606);
    c = ii(c, d, a, b, w[i + 10], 15, -1051523);
    b = ii(b, c, d, a, w[i + 1], 21, -2054922799);
    a = ii(a, b, c, d, w[i + 8], 6, 1873313359);
    d = ii(d, a, b, c, w[i + 15], 10, -30611744);
    c = ii(c, d, a, b, w[i + 6], 15, -1560198380);
    b = ii(b, c, d, a, w[i + 13], 21, 1309151649);
    a = ii(a, b, c, d, w[i + 4], 6, -145523070);
    d = ii(d, a, b, c, w[i + 11], 10, -1120210379);
    c = ii(c, d, a, b, w[i + 2], 15, 718787259);
    b = ii(b, c, d, a, w[i + 9], 21, -343485551);
    a = (a + oa) | 0;
    b = (b + ob) | 0;
    c = (c + oc) | 0;
    d = (d + od) | 0;
  }
  function hex(n: number) {
    let s = "";
    for (let j = 0; j < 4; j++) s += ((n >> (j * 8)) & 0xff).toString(16).padStart(2, "0");
    return s;
  }
  return hex(a) + hex(b) + hex(c) + hex(d);
}

function transformLines(text: string, fn: (lines: string[]) => string[]): string {
  const nl = text.includes("\r\n") ? "\r\n" : text.includes("\r") ? "\r" : "\n";
  return fn(text.split(/\r\n|\r|\n/)).join(nl);
}

export async function dispatchCommand(
  id: number,
  ctx: DispatchContext,
): Promise<void> {
  ctx.recordAction(id);
  const ed = ctx.editor;
  const trigger = (handler: string) =>
    ed?.trigger("nppx", handler, null);

  switch (id) {
    case CMD.IDM_FILE_NEW:
      return ctx.newFile();
    case CMD.IDM_FILE_OPEN:
      return ctx.openFile();
    case CMD.IDM_FILE_SAVE:
      return ctx.save(false);
    case CMD.IDM_FILE_SAVEAS:
    case CMD.IDM_FILE_SAVECOPYAS:
      return ctx.save(true);
    case CMD.IDM_FILE_SAVEALL:
      return ctx.save(false);
    case CMD.IDM_FILE_CLOSE:
      return ctx.close();
    case CMD.IDM_FILE_CLOSEALL:
    case CMD.IDM_FILE_CLOSEALL_BUT_CURRENT:
      return ctx.closeAll();
    case CMD.IDM_FILE_EXIT:
      return ctx.exit();
    case CMD.IDM_FILE_PRINT:
      return ctx.print();
    case NPPX.EXPORT_PREVIEW_PDF:
      return ctx.exportPreviewPdf();
    case CMD.IDM_FILE_RELOAD:
      ctx.notify("Reload: re-open the file from disk (Save first if needed)");
      return;

    case CMD.IDM_EDIT_CUT:
      return void editorCut(ed);
    case CMD.IDM_EDIT_COPY:
      return void editorCopy(ed);
    case CMD.IDM_EDIT_PASTE:
      return void editorPaste(ed);
    case CMD.IDM_EDIT_SELECTALL:
      return void trigger("editor.action.selectAll");
    case CMD.IDM_EDIT_DELETE:
      return void trigger("deleteLeft");
    case CMD.IDM_EDIT_UNDO:
      return void trigger("undo");
    case CMD.IDM_EDIT_REDO:
      return void trigger("redo");

    case CMD.IDM_EDIT_UPPERCASE:
      return ctx.transformSelectionOrDoc((s) => s.toUpperCase());
    case CMD.IDM_EDIT_LOWERCASE:
      return ctx.transformSelectionOrDoc((s) => s.toLowerCase());
    case CMD.IDM_EDIT_INVERTCASE:
      return ctx.transformSelectionOrDoc((s) =>
        [...s]
          .map((c) =>
            c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase(),
          )
          .join(""),
      );
    case CMD.IDM_EDIT_PROPERCASE_FORCE:
      return ctx.transformSelectionOrDoc((s) =>
        s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()),
      );

    case CMD.IDM_EDIT_DUP_LINE:
      return void trigger("editor.action.copyLinesDownAction");
    case CMD.IDM_EDIT_LINE_UP:
      return void trigger("editor.action.moveLinesUpAction");
    case CMD.IDM_EDIT_LINE_DOWN:
      return void trigger("editor.action.moveLinesDownAction");
    case CMD.IDM_EDIT_JOIN_LINES:
      return ctx.transformSelectionOrDoc((s) =>
        s.replace(/\r\n|\r|\n/g, " "),
      );
    case CMD.IDM_EDIT_SPLIT_LINES: {
      const col = ed?.getPosition()?.column ?? 1;
      return ctx.transformSelectionOrDoc((s) =>
        transformLines(s, (lines) =>
          lines.flatMap((line) => {
            if (line.length < col) return [line];
            return [line.slice(0, col - 1), line.slice(col - 1)];
          }),
        ),
      );
    }
    case CMD.IDM_EDIT_SORTLINES_LEXICOGRAPHIC_ASCENDING:
      return ctx.setText(
        transformLines(ctx.getText(), (ls) => [...ls].sort((a, b) => a.localeCompare(b))),
        true,
      );
    case CMD.IDM_EDIT_SORTLINES_LEXICOGRAPHIC_DESCENDING:
      return ctx.setText(
        transformLines(ctx.getText(), (ls) =>
          [...ls].sort((a, b) => b.localeCompare(a)),
        ),
        true,
      );
    case CMD.IDM_EDIT_SORTLINES_REVERSE_ORDER:
      return ctx.setText(
        transformLines(ctx.getText(), (ls) => [...ls].reverse()),
        true,
      );
    case CMD.IDM_EDIT_REMOVE_ANY_DUP_LINES:
      return ctx.setText(
        transformLines(ctx.getText(), (ls) => [...new Set(ls)]),
        true,
      );

    case CMD.IDM_EDIT_TRIMTRAILING:
      return ctx.setText(ctx.getText().replace(/[ \t]+$/gm, ""), true);
    case CMD.IDM_EDIT_TRIMLINEHEAD:
      return ctx.setText(ctx.getText().replace(/^[ \t]+/gm, ""), true);
    case CMD.IDM_EDIT_TRIM_BOTH:
      return ctx.setText(
        ctx.getText().replace(/^[ \t]+/gm, "").replace(/[ \t]+$/gm, ""),
        true,
      );
    case CMD.IDM_EDIT_EOL2WS:
      return ctx.setText(ctx.getText().replace(/\r\n|\r|\n/g, " "), true);
    case CMD.IDM_EDIT_TAB2SW:
      return ctx.setText(ctx.getText().replace(/\t/g, "    "), true);
    case CMD.IDM_EDIT_SW2TAB_ALL:
      return ctx.setText(ctx.getText().replace(/ {4}/g, "\t"), true);

    case CMD.IDM_EDIT_BLOCK_COMMENT:
      return void trigger("editor.action.commentLine");
    case CMD.IDM_EDIT_BLOCK_COMMENT_SET:
      return void trigger("editor.action.blockComment");
    case CMD.IDM_EDIT_BLOCK_UNCOMMENT:
      return void trigger("editor.action.removeCommentLine");

    case CMD.IDM_SEARCH_FIND:
      return ctx.find();
    case CMD.IDM_SEARCH_FINDNEXT:
      return ctx.findNext();
    case CMD.IDM_SEARCH_FINDPREV:
      return ctx.findPrev();
    case CMD.IDM_SEARCH_REPLACE:
      return ctx.replace();
    case CMD.IDM_SEARCH_GOTOLINE:
      return ctx.gotoLine();

    case CMD.IDM_VIEW_WRAP:
      return ctx.toggleWordWrap();
    case CMD.IDM_VIEW_ZOOMIN:
      return ctx.zoom(1);
    case CMD.IDM_VIEW_ZOOMOUT:
      return ctx.zoom(-1);
    case CMD.IDM_VIEW_ZOOMRESTORE:
      return ctx.zoom(0);

    case CMD.IDM_FORMAT_ANSI:
      return ctx.setEncoding("ASCII");
    case CMD.IDM_FORMAT_AS_UTF_8:
      return ctx.setEncoding("UTF-8");
    case CMD.IDM_FORMAT_UTF_8:
      return ctx.setEncoding("UTF-8-BOM");
    case CMD.IDM_FORMAT_UTF_16BE:
      return ctx.setEncoding("UTF-16 BE");
    case CMD.IDM_FORMAT_UTF_16LE:
      return ctx.setEncoding("UTF-16 LE");
    case CMD.IDM_FORMAT_TODOS:
      return ctx.setEol("\r\n");
    case CMD.IDM_FORMAT_TOUNIX:
      return ctx.setEol("\n");
    case CMD.IDM_FORMAT_TOMAC:
      return ctx.setEol("\r");

    case CMD.IDM_TOOL_MD5_GENERATE:
    case CMD.IDM_TOOL_MD5_GENERATEINTOCLIPBOARD:
      return ctx.hashSelection(
        "MD5",
        id === CMD.IDM_TOOL_MD5_GENERATEINTOCLIPBOARD,
      );
    case CMD.IDM_TOOL_SHA1_GENERATE:
    case CMD.IDM_TOOL_SHA1_GENERATEINTOCLIPBOARD:
      return ctx.hashSelection(
        "SHA-1",
        id === CMD.IDM_TOOL_SHA1_GENERATEINTOCLIPBOARD,
      );
    case CMD.IDM_TOOL_SHA256_GENERATE:
    case CMD.IDM_TOOL_SHA256_GENERATEINTOCLIPBOARD:
      return ctx.hashSelection(
        "SHA-256",
        id === CMD.IDM_TOOL_SHA256_GENERATEINTOCLIPBOARD,
      );
    case CMD.IDM_TOOL_SHA512_GENERATE:
    case CMD.IDM_TOOL_SHA512_GENERATEINTOCLIPBOARD:
      return ctx.hashSelection(
        "SHA-512",
        id === CMD.IDM_TOOL_SHA512_GENERATEINTOCLIPBOARD,
      );

    case CMD.IDM_MACRO_STARTRECORDINGMACRO:
      return ctx.macroStart();
    case CMD.IDM_MACRO_STOPRECORDINGMACRO:
      return ctx.macroStop();
    case CMD.IDM_MACRO_PLAYBACKRECORDEDMACRO:
      return ctx.macroPlay();
    case CMD.IDM_MACRO_SAVECURRENTMACRO:
      return ctx.macroSave();
    case CMD.IDM_MACRO_RUNMULTIMACRODLG:
      return ctx.macroMulti();

    case CMD.IDM_EXECUTE:
      return ctx.runDialog();

    case CMD.IDM_SETTING_SHORTCUT_MAPPER:
    case CMD.IDM_SETTING_SHORTCUT_MAPPER_MACRO:
      return ctx.openShortcutMapper();
    case CMD.IDM_SETTING_IMPORTSTYLETHEMES:
    case CMD.IDM_SETTING_PREFERENCE:
      return ctx.openThemeStore();
    case CMD.IDM_SETTING_IMPORTPLUGIN:
    case CMD.IDM_SETTING_PLUGINADM:
      return ctx.openPluginStore();

    case NPPX.THEME_STORE:
      return ctx.openThemeStore();
    case NPPX.PLUGIN_STORE:
      return ctx.openPluginStore();

    case NPPX.JSON_PRETTY:
      return ctx.formatDocument("json", false);
    case NPPX.JSON_MINIFY:
      return ctx.formatDocument("json", true);
    case NPPX.XML_PRETTY:
      return ctx.formatDocument("xml", false);
    case NPPX.XML_MINIFY:
      return ctx.formatDocument("xml", true);

    case NPPX.DIFF_TABS:
      return ctx.openDiffTabs();
    case NPPX.DIFF_CLIPBOARD:
      return ctx.openDiffClipboard();
    case NPPX.DIFF_EXIT:
      return ctx.exitDiff();

    case NPPX.REMEMBER_SESSION:
      return ctx.toggleRememberSession();

    case NPPX.CHECK_UPDATES:
      return ctx.checkForUpdates(true);
    case NPPX.DOWNLOAD_DESKTOP:
      return ctx.showDownloadDesktop();
    case CMD.IDM_ABOUT:
      return ctx.showAbout();
    case NPPX.FILE_TYPES_HELP:
      return ctx.showFileTypesHelp();

    default:
      ctx.notify(`Command ${id} is on the N++ map but not implemented yet`);
  }
}

// Keep format helpers available for tests / plugins
export { formatJson, formatXml };

export { digestHex, md5 };
