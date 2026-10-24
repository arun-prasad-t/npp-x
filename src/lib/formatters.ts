/** JSON / XML pretty & minify — browser/Tauri safe, no extra deps. */

export function formatJson(text: string, minify = false): string {
  const parsed = JSON.parse(text);
  return minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
}

export function formatXml(text: string, minify = false): string {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const doc = new DOMParser().parseFromString(trimmed, "application/xml");
  const err = doc.querySelector("parsererror");
  if (err) {
    throw new Error(err.textContent?.trim() || "Invalid XML");
  }

  if (minify) {
    return trimmed.replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();
  }

  // Serialize with indentation
  const serializer = new XMLSerializer();
  const raw = serializer.serializeToString(doc);
  return indentXml(raw);
}

function indentXml(xml: string): string {
  const P = "  ";
  let pad = 0;
  const parts = xml
    .replace(/(>)(<)(\/*)/g, "$1\n$2$3")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const out: string[] = [];
  for (const line of parts) {
    if (/^<\/\w/.test(line)) pad = Math.max(0, pad - 1);
    out.push(P.repeat(pad) + line);
    if (
      /^<\w[^>]*[^/]>/.test(line) &&
      !/^<\?/.test(line) &&
      !/^<!/.test(line) &&
      !/\/>$/.test(line) &&
      !/^<.*<\/\w/.test(line)
    ) {
      pad += 1;
    }
  }
  return out.join("\n");
}
