/**
 * Menu surface from Notepad++ 8.8.1 english.xml + menuCmdID.h (REA / upstream).
 * Only lists commands npp-x implements or stubs with a clear label.
 */
import { CMD } from "./shortcuts";

export type MenuLeaf = {
  kind: "item";
  id: number;
  label: string;
};

export type MenuSep = { kind: "sep" };

export type MenuGroup = {
  kind: "submenu";
  label: string;
  items: Array<MenuLeaf | MenuSep>;
};

export type MenuEntry = MenuLeaf | MenuSep | MenuGroup;

export type TopMenu = { label: string; items: MenuEntry[] };

const item = (cmd: keyof typeof CMD, label: string): MenuLeaf => ({
  kind: "item",
  id: CMD[cmd],
  label,
});

const sep = (): MenuSep => ({ kind: "sep" });

export const TOP_MENUS: TopMenu[] = [
  {
    label: "File",
    items: [
      item("IDM_FILE_NEW", "New"),
      item("IDM_FILE_OPEN", "Open..."),
      sep(),
      item("IDM_FILE_CLOSE", "Close"),
      item("IDM_FILE_CLOSEALL", "Close All"),
      item("IDM_FILE_CLOSEALL_BUT_CURRENT", "Close All BUT Current Document"),
      sep(),
      item("IDM_FILE_SAVE", "Save"),
      item("IDM_FILE_SAVEALL", "Save All"),
      item("IDM_FILE_SAVEAS", "Save As..."),
      item("IDM_FILE_SAVECOPYAS", "Save a Copy As..."),
      sep(),
      item("IDM_FILE_RELOAD", "Reload from Disk"),
      item("IDM_FILE_RESTORELASTCLOSEDFILE", "Restore Recent Closed File"),
      sep(),
      item("IDM_FILE_PRINT", "Print..."),
      sep(),
      item("IDM_FILE_EXIT", "Exit"),
    ],
  },
  {
    label: "Edit",
    items: [
      item("IDM_EDIT_CUT", "Cut"),
      item("IDM_EDIT_COPY", "Copy"),
      item("IDM_EDIT_PASTE", "Paste"),
      item("IDM_EDIT_DELETE", "Delete"),
      item("IDM_EDIT_SELECTALL", "Select All"),
      sep(),
      item("IDM_EDIT_UNDO", "Undo"),
      item("IDM_EDIT_REDO", "Redo"),
      sep(),
      {
        kind: "submenu",
        label: "Convert Case to",
        items: [
          item("IDM_EDIT_UPPERCASE", "UPPERCASE"),
          item("IDM_EDIT_LOWERCASE", "lowercase"),
          item("IDM_EDIT_PROPERCASE_FORCE", "Proper Case"),
          item("IDM_EDIT_INVERTCASE", "iNVERT cASE"),
        ],
      },
      {
        kind: "submenu",
        label: "Line Operations",
        items: [
          item("IDM_EDIT_DUP_LINE", "Duplicate Current Line"),
          item("IDM_EDIT_REMOVE_ANY_DUP_LINES", "Remove Duplicate Lines"),
          item("IDM_EDIT_SPLIT_LINES", "Split Lines"),
          item("IDM_EDIT_JOIN_LINES", "Join Lines"),
          item("IDM_EDIT_LINE_UP", "Move Up Current Line"),
          item("IDM_EDIT_LINE_DOWN", "Move Down Current Line"),
          sep(),
          item("IDM_EDIT_SORTLINES_LEXICOGRAPHIC_ASCENDING", "Sort Lines Ascending"),
          item("IDM_EDIT_SORTLINES_LEXICOGRAPHIC_DESCENDING", "Sort Lines Descending"),
          item("IDM_EDIT_SORTLINES_REVERSE_ORDER", "Reverse Line Order"),
        ],
      },
      {
        kind: "submenu",
        label: "Comment/Uncomment",
        items: [
          item("IDM_EDIT_BLOCK_COMMENT", "Toggle Single Line Comment"),
          item("IDM_EDIT_BLOCK_COMMENT_SET", "Block Comment"),
          item("IDM_EDIT_BLOCK_UNCOMMENT", "Block Uncomment"),
        ],
      },
      {
        kind: "submenu",
        label: "Blank Operations",
        items: [
          item("IDM_EDIT_TRIMTRAILING", "Trim Trailing Space"),
          item("IDM_EDIT_TRIMLINEHEAD", "Trim Leading Space"),
          item("IDM_EDIT_TRIM_BOTH", "Trim Leading and Trailing Space"),
          item("IDM_EDIT_EOL2WS", "EOL to Space"),
          item("IDM_EDIT_TAB2SW", "TAB to Space"),
          item("IDM_EDIT_SW2TAB_ALL", "Space to TAB (All)"),
        ],
      },
    ],
  },
  {
    label: "Search",
    items: [
      item("IDM_SEARCH_FIND", "Find..."),
      item("IDM_SEARCH_FINDNEXT", "Find Next"),
      item("IDM_SEARCH_FINDPREV", "Find Previous"),
      item("IDM_SEARCH_REPLACE", "Replace..."),
      item("IDM_SEARCH_GOTOLINE", "Go to..."),
      sep(),
      item("IDM_SEARCH_TOGGLE_BOOKMARK", "Toggle Bookmark"),
      item("IDM_SEARCH_NEXT_BOOKMARK", "Next Bookmark"),
      item("IDM_SEARCH_PREV_BOOKMARK", "Previous Bookmark"),
      item("IDM_SEARCH_CLEAR_BOOKMARKS", "Clear All Bookmarks"),
    ],
  },
  {
    label: "View",
    items: [
      item("IDM_VIEW_WRAP", "Word wrap"),
      {
        kind: "submenu",
        label: "Zoom",
        items: [
          item("IDM_VIEW_ZOOMIN", "Zoom In"),
          item("IDM_VIEW_ZOOMOUT", "Zoom Out"),
          item("IDM_VIEW_ZOOMRESTORE", "Restore Default Zoom"),
        ],
      },
      sep(),
      { kind: "item", id: -1020, label: "Compare Tabs…" },
      { kind: "item", id: -1021, label: "Compare with Clipboard" },
      { kind: "item", id: -1022, label: "Exit Diff" },
      sep(),
      { kind: "item", id: -1001, label: "Theme Store…" },
    ],
  },
  {
    label: "Encoding",
    items: [
      item("IDM_FORMAT_ANSI", "ANSI"),
      item("IDM_FORMAT_AS_UTF_8", "UTF-8"),
      item("IDM_FORMAT_UTF_8", "UTF-8-BOM"),
      item("IDM_FORMAT_UTF_16BE", "UTF-16 BE BOM"),
      item("IDM_FORMAT_UTF_16LE", "UTF-16 LE BOM"),
      sep(),
      {
        kind: "submenu",
        label: "EOL Conversion",
        items: [
          item("IDM_FORMAT_TODOS", "Windows (CR LF)"),
          item("IDM_FORMAT_TOUNIX", "Unix (LF)"),
          item("IDM_FORMAT_TOMAC", "Macintosh (CR)"),
        ],
      },
    ],
  },
  {
    label: "Language",
    items: [{ kind: "item", id: -1002, label: "(see Language menu list)" }],
  },
  {
    label: "Settings",
    items: [
      item("IDM_SETTING_PREFERENCE", "Preferences..."),
      item("IDM_SETTING_SHORTCUT_MAPPER", "Shortcut Mapper..."),
      { kind: "item", id: -1030, label: "Remember session for next launch" },
      sep(),
      item("IDM_SETTING_IMPORTSTYLETHEMES", "Import style theme(s)..."),
      item("IDM_SETTING_IMPORTPLUGIN", "Import plugin(s)..."),
      item("IDM_SETTING_PLUGINADM", "Plugins Admin..."),
      { kind: "item", id: -1001, label: "Theme Store…" },
      { kind: "item", id: -1003, label: "Plugin Store…" },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        kind: "submenu",
        label: "JSON",
        items: [
          { kind: "item", id: -1010, label: "Pretty-print JSON" },
          { kind: "item", id: -1011, label: "Minify JSON" },
        ],
      },
      {
        kind: "submenu",
        label: "XML",
        items: [
          { kind: "item", id: -1012, label: "Pretty-print XML" },
          { kind: "item", id: -1013, label: "Minify XML" },
        ],
      },
      sep(),
      {
        kind: "submenu",
        label: "MD5",
        items: [
          item("IDM_TOOL_MD5_GENERATE", "Generate..."),
          item("IDM_TOOL_MD5_GENERATEINTOCLIPBOARD", "Generate to Clipboard"),
        ],
      },
      {
        kind: "submenu",
        label: "SHA-1",
        items: [
          item("IDM_TOOL_SHA1_GENERATE", "Generate..."),
          item("IDM_TOOL_SHA1_GENERATEINTOCLIPBOARD", "Generate to Clipboard"),
        ],
      },
      {
        kind: "submenu",
        label: "SHA-256",
        items: [
          item("IDM_TOOL_SHA256_GENERATE", "Generate..."),
          item("IDM_TOOL_SHA256_GENERATEINTOCLIPBOARD", "Generate to Clipboard"),
        ],
      },
      {
        kind: "submenu",
        label: "SHA-512",
        items: [
          item("IDM_TOOL_SHA512_GENERATE", "Generate..."),
          item("IDM_TOOL_SHA512_GENERATEINTOCLIPBOARD", "Generate to Clipboard"),
        ],
      },
    ],
  },
  {
    label: "Macro",
    items: [
      item("IDM_MACRO_STARTRECORDINGMACRO", "Start Recording"),
      item("IDM_MACRO_STOPRECORDINGMACRO", "Stop Recording"),
      item("IDM_MACRO_PLAYBACKRECORDEDMACRO", "Playback"),
      item("IDM_MACRO_SAVECURRENTMACRO", "Save Currently Recorded Macro..."),
      item("IDM_MACRO_RUNMULTIMACRODLG", "Run a Macro Multiple Times..."),
    ],
  },
  {
    label: "Run",
    items: [item("IDM_EXECUTE", "Run...")],
  },
  {
    label: "Help",
    items: [
      { kind: "item", id: -1040, label: "Check for Updates…" },
      sep(),
      item("IDM_ABOUT", "About npp-x…"),
    ],
  },
];

/** Synthetic IDs for npp-x chrome actions */
export const NPPX = {
  THEME_STORE: -1001,
  LANGUAGE_LIST: -1002,
  PLUGIN_STORE: -1003,
  JSON_PRETTY: -1010,
  JSON_MINIFY: -1011,
  XML_PRETTY: -1012,
  XML_MINIFY: -1013,
  DIFF_TABS: -1020,
  DIFF_CLIPBOARD: -1021,
  DIFF_EXIT: -1022,
  REMEMBER_SESSION: -1030,
  CHECK_UPDATES: -1040,
} as const;
