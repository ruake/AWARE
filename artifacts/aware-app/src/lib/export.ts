import { escapeCsvField } from "./sanitize";

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  const cols = columns?.length
    ? columns
    : data.length > 0
      ? (Object.keys(data[0]) as (keyof T)[]).map(k => ({ key: k, label: String(k) }))
      : [];

  const header = cols.map(c => escapeCsvField(c.label)).join(",");
  const rows = data.map(item =>
    cols.map(c => escapeCsvField(String(item[c.key] ?? ""))).join(",")
  );
  const csv = [header, ...rows].join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
}

export function exportToJson<T>(data: T, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  downloadBlob(
    new Blob([json], { type: "application/json;charset=utf-8;" }),
    `${filename}.json`
  );
}

export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error("Clipboard API not available");
  }
  await navigator.clipboard.writeText(text);
}
