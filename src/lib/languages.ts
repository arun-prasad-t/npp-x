/** Language IDs aligned with Monaco; mirrors N++ langs.model.xml surface for v1. */
export type LanguageOption = {
  id: string;
  label: string;
  extensions: string[];
};

export const LANGUAGES: LanguageOption[] = [
  { id: "plaintext", label: "Normal Text", extensions: ["txt", "log"] },
  { id: "javascript", label: "JavaScript", extensions: ["js", "mjs", "cjs"] },
  { id: "typescript", label: "TypeScript", extensions: ["ts", "mts", "cts"] },
  { id: "json", label: "JSON", extensions: ["json", "jsonc"] },
  { id: "html", label: "HTML", extensions: ["html", "htm"] },
  { id: "css", label: "CSS", extensions: ["css"] },
  { id: "python", label: "Python", extensions: ["py", "pyw"] },
  { id: "java", label: "Java", extensions: ["java"] },
  { id: "c", label: "C", extensions: ["c", "h"] },
  { id: "cpp", label: "C++", extensions: ["cpp", "cc", "cxx", "hpp"] },
  { id: "csharp", label: "C#", extensions: ["cs"] },
  { id: "go", label: "Go", extensions: ["go"] },
  { id: "rust", label: "Rust", extensions: ["rs"] },
  { id: "ruby", label: "Ruby", extensions: ["rb"] },
  { id: "php", label: "PHP", extensions: ["php"] },
  { id: "sql", label: "SQL", extensions: ["sql"] },
  { id: "shell", label: "Bash", extensions: ["sh", "bash", "zsh"] },
  { id: "yaml", label: "YAML", extensions: ["yml", "yaml"] },
  { id: "xml", label: "XML", extensions: ["xml", "svg"] },
  { id: "markdown", label: "Markdown", extensions: ["md", "markdown"] },
  { id: "ini", label: "INI file", extensions: ["ini", "cfg", "conf"] },
];

export function languageFromFilename(name: string): string {
  const ext = name.includes(".")
    ? name.split(".").pop()?.toLowerCase() ?? ""
    : "";
  if (!ext) return "plaintext";
  return LANGUAGES.find((l) => l.extensions.includes(ext))?.id ?? "plaintext";
}

export function labelForLanguage(id: string): string {
  return LANGUAGES.find((l) => l.id === id)?.label ?? "Normal Text";
}
