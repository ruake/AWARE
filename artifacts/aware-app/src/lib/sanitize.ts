export function sanitizeText(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return text.replace(/[&<>"'/]/g, (c) => map[c] ?? c);
}

const ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    return ALLOWED_PROTOCOLS.includes(parsed.protocol) ? url : "";
  } catch {
    return "";
  }
}

export function sanitizeHtml(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

export function escapeCsvField(value: string): string {
  if (/^[=+\-@\t\r\n|]/.test(value)) return "'" + value;
  if (/[",\n\r]/.test(value)) return '"' + value.replace(/"/g, '""') + '"';
  return value;
}
