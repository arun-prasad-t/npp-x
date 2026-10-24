/**
 * Language menu from Notepad++ 8.8.1 langs.model.xml (REA shipped-artifact).
 * `key` is stable for UI selection; `monaco` is the editor language id.
 */
export type LanguageOption = {
  key: string;
  monaco: string;
  label: string;
  extensions: string[];
};

export const LANGUAGES: LanguageOption[] = [
  { key: "normal", monaco: "plaintext", label: "Normal Text", extensions: ["txt", "log", "nfo"] },
  { key: "actionscript", monaco: "plaintext", label: "ActionScript", extensions: ["as"] },
  { key: "ada", monaco: "plaintext", label: "ADA", extensions: ["ada", "adb", "ads"] },
  { key: "asn1", monaco: "plaintext", label: "ASN.1", extensions: ["asn1", "asn"] },
  { key: "asp", monaco: "plaintext", label: "ASP", extensions: ["asp"] },
  { key: "asm", monaco: "plaintext", label: "Assembly", extensions: ["asm", "s"] },
  { key: "autoit", monaco: "plaintext", label: "AutoIt", extensions: ["au3"] },
  { key: "bash", monaco: "shell", label: "Bash", extensions: ["sh", "bash", "zsh"] },
  { key: "batch", monaco: "bat", label: "Batch", extensions: ["bat", "cmd"] },
  { key: "c", monaco: "c", label: "C", extensions: ["c", "h"] },
  { key: "csharp", monaco: "csharp", label: "C#", extensions: ["cs"] },
  { key: "cpp", monaco: "cpp", label: "C++", extensions: ["cpp", "cc", "cxx", "hpp", "hh"] },
  { key: "cmake", monaco: "plaintext", label: "CMake", extensions: ["cmake"] },
  { key: "cobol", monaco: "plaintext", label: "COBOL", extensions: ["cbl", "cob"] },
  { key: "coffee", monaco: "coffee", label: "CoffeeScript", extensions: ["coffee"] },
  { key: "css", monaco: "css", label: "CSS", extensions: ["css"] },
  { key: "dart", monaco: "dart", label: "Dart", extensions: ["dart"] },
  { key: "diff", monaco: "plaintext", label: "Diff", extensions: ["diff", "patch"] },
  { key: "dockerfile", monaco: "dockerfile", label: "Dockerfile", extensions: ["dockerfile"] },
  { key: "erlang", monaco: "plaintext", label: "Erlang", extensions: ["erl", "hrl"] },
  { key: "fortran", monaco: "plaintext", label: "Fortran", extensions: ["f", "for", "f90"] },
  { key: "fsharp", monaco: "fsharp", label: "F#", extensions: ["fs", "fsi", "fsx"] },
  { key: "go", monaco: "go", label: "Go", extensions: ["go"] },
  { key: "graphql", monaco: "graphql", label: "GraphQL", extensions: ["graphql", "gql"] },
  { key: "haskell", monaco: "plaintext", label: "Haskell", extensions: ["hs", "lhs"] },
  { key: "html", monaco: "html", label: "HTML", extensions: ["html", "htm"] },
  { key: "ini", monaco: "ini", label: "INI file", extensions: ["ini", "cfg", "conf", "props"] },
  { key: "java", monaco: "java", label: "Java", extensions: ["java"] },
  { key: "javascript", monaco: "javascript", label: "JavaScript", extensions: ["js", "mjs", "cjs"] },
  { key: "json", monaco: "json", label: "JSON", extensions: ["json", "jsonc", "json5"] },
  { key: "julia", monaco: "julia", label: "Julia", extensions: ["jl"] },
  { key: "kotlin", monaco: "kotlin", label: "Kotlin", extensions: ["kt", "kts"] },
  { key: "latex", monaco: "plaintext", label: "LaTeX", extensions: ["tex", "latex"] },
  { key: "less", monaco: "less", label: "Less", extensions: ["less"] },
  { key: "lua", monaco: "lua", label: "Lua", extensions: ["lua"] },
  { key: "markdown", monaco: "markdown", label: "Markdown", extensions: ["md", "markdown"] },
  { key: "makefile", monaco: "plaintext", label: "Makefile", extensions: ["makefile", "mk"] },
  { key: "matlab", monaco: "plaintext", label: "Matlab", extensions: ["matlab"] },
  { key: "objc", monaco: "objective-c", label: "Objective-C", extensions: ["mm"] },
  { key: "pascal", monaco: "pascal", label: "Pascal", extensions: ["pas", "pp"] },
  { key: "perl", monaco: "perl", label: "Perl", extensions: ["pl", "pm"] },
  { key: "php", monaco: "php", label: "PHP", extensions: ["php"] },
  { key: "powershell", monaco: "powershell", label: "PowerShell", extensions: ["ps1", "psm1"] },
  { key: "python", monaco: "python", label: "Python", extensions: ["py", "pyw"] },
  { key: "r", monaco: "r", label: "R", extensions: ["r"] },
  { key: "ruby", monaco: "ruby", label: "Ruby", extensions: ["rb"] },
  { key: "rust", monaco: "rust", label: "Rust", extensions: ["rs"] },
  { key: "scss", monaco: "scss", label: "SCSS", extensions: ["scss", "sass"] },
  { key: "scheme", monaco: "scheme", label: "Scheme", extensions: ["scm", "ss"] },
  { key: "sql", monaco: "sql", label: "SQL", extensions: ["sql"] },
  { key: "swift", monaco: "swift", label: "Swift", extensions: ["swift"] },
  { key: "tcl", monaco: "tcl", label: "TCL", extensions: ["tcl"] },
  { key: "typescript", monaco: "typescript", label: "TypeScript", extensions: ["ts", "mts", "cts"] },
  { key: "vb", monaco: "vb", label: "Visual Basic", extensions: ["vb", "vbs"] },
  { key: "xml", monaco: "xml", label: "XML", extensions: ["xml", "svg", "xsl", "xsd"] },
  { key: "yaml", monaco: "yaml", label: "YAML", extensions: ["yml", "yaml"] },
].sort((a, b) => a.label.localeCompare(b.label));

export const LANGUAGE_MENU = LANGUAGES;

export const ENCODINGS = [
  "UTF-8",
  "UTF-8-BOM",
  "UTF-16 LE",
  "UTF-16 BE",
  "ASCII",
  "ISO-8859-1",
  "Windows-1252",
] as const;

export function languageFromFilename(name: string): string {
  const ext = name.includes(".")
    ? name.split(".").pop()?.toLowerCase() ?? ""
    : "";
  if (!ext) return "normal";
  return LANGUAGES.find((l) => l.extensions.includes(ext))?.key ?? "normal";
}

export function monacoForLanguage(key: string): string {
  return LANGUAGES.find((l) => l.key === key)?.monaco ?? "plaintext";
}

export function labelForLanguage(key: string): string {
  return LANGUAGES.find((l) => l.key === key)?.label ?? "Normal Text";
}
