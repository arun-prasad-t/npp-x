/** Shared open/save dialog filters — HTML, CSV, and common text/source types. */
export const OPEN_FILE_FILTERS = [
  {
    name: "All files",
    extensions: ["*"],
  },
  {
    name: "Text & data",
    extensions: [
      "txt",
      "log",
      "md",
      "markdown",
      "csv",
      "tsv",
      "json",
      "jsonc",
      "xml",
      "yml",
      "yaml",
      "ini",
      "cfg",
      "conf",
      "toml",
      "env",
    ],
  },
  {
    name: "Web",
    extensions: [
      "html",
      "htm",
      "xhtml",
      "css",
      "scss",
      "less",
      "js",
      "mjs",
      "cjs",
      "ts",
      "tsx",
      "jsx",
      "svg",
      "vue",
      "svelte",
    ],
  },
  {
    name: "CSV / TSV",
    extensions: ["csv", "tsv"],
  },
  {
    name: "HTML",
    extensions: ["html", "htm", "xhtml"],
  },
  {
    name: "Source",
    extensions: [
      "rs",
      "py",
      "go",
      "java",
      "c",
      "h",
      "cpp",
      "cc",
      "cxx",
      "hpp",
      "cs",
      "php",
      "rb",
      "sh",
      "bash",
      "ps1",
      "sql",
      "kt",
      "swift",
    ],
  },
];

/** Browser `<input type="file" accept>` hint. */
export const BROWSER_OPEN_ACCEPT =
  ".txt,.log,.md,.csv,.tsv,.json,.xml,.yml,.yaml,.html,.htm,.css,.js,.ts,.tsx,.jsx,.svg,.rs,.py,.go,.java,.c,.cpp,.h,.cs,.php,.rb,.sh,.sql,*";
