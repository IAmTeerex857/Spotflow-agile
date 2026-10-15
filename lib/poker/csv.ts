import type { Story } from "./types";

/** Splits CSV text into rows of fields, honouring quotes and escaped quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field || row.length) rows.push([...row, field]);
  return rows;
}

/** Story titles from a one-column CSV. A leading "title" header is skipped. */
export function parseStoryCsv(text: string): string[] {
  const titles = parseCsv(text.replace(/^﻿/, ""))
    .map((r) => (r[0] ?? "").trim())
    .filter(Boolean);
  if (titles[0]?.toLowerCase() === "title") titles.shift();
  return titles;
}

const escape = (value: string) => (/[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

export function storiesToCsv(stories: Story[]): string {
  const header = "title,estimate,status,seconds";
  const lines = stories.map((s) =>
    [s.title, s.estimate ?? "", s.status, String(s.duration_seconds)].map(escape).join(","),
  );
  return [header, ...lines].join("\n");
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}
