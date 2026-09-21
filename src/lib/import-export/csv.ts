/**
 * RFC 4180 Compliant CSV Serializer & Parser with Formula Injection Defense
 */

/**
 * Escapes characters that trigger formula execution in spreadsheet software (Excel, Calc, Sheets).
 * Cells starting with '=', '+', '-', '@', '\t', '\r' are prefixed with an apostrophe.
 */
export function sanitizeCsvCell(cell: unknown): string {
  if (cell === null || cell === undefined) return "";
  let str = String(cell);

  // Formula injection defense (check untrimmed string for leading formula or tab/CR trigger)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // If cell contains comma, double quote, or newline, enclose in double quotes and escape internal quotes
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Serializes headers and 2D row array into an RFC 4180 compliant CSV string.
 */
export function serializeCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string {
  const headerLine = headers.map((h) => sanitizeCsvCell(h)).join(",");
  const dataLines = rows.map((row) =>
    row.map((cell) => sanitizeCsvCell(cell)).join(",")
  );
  return [headerLine, ...dataLines].join("\r\n");
}

/**
 * Parses raw CSV text into headers and row records, supporting:
 * - RFC 4180 quoted fields
 * - Escaped quotes ("")
 * - Multiline quoted fields
 * - CRLF and LF line endings
 */
export function parseCsv(csvText: string): {
  headers: string[];
  rows: string[][];
} {
  const cleanText = csvText.replace(/^\uFEFF/, ""); // Remove UTF-8 BOM if present
  const result: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;
  let i = 0;

  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote inside quoted field
        currentCell += '"';
        i += 2;
        continue;
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
        i++;
        continue;
      } else {
        currentCell += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ",") {
        currentRow.push(currentCell.trim());
        currentCell = "";
        i++;
        continue;
      } else if (char === "\r" && nextChar === "\n") {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== "")) {
          result.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
        i += 2;
        continue;
      } else if (char === "\n" || char === "\r") {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== "")) {
          result.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
        i++;
        continue;
      } else {
        currentCell += char;
        i++;
        continue;
      }
    }
  }

  // Push remaining cell and row if any
  currentRow.push(currentCell.trim());
  if (currentRow.some((c) => c !== "")) {
    result.push(currentRow);
  }

  if (result.length === 0) {
    return { headers: [], rows: [] };
  }

  const [rawHeaders, ...rawRows] = result;
  const headers = rawHeaders.map((h) => h.trim());

  // Strip formula defense apostrophes on parsed cells
  const rows = rawRows.map((row) =>
    row.map((val) => {
      if (val.startsWith("'") && /^[=+\-@\t\r]/.test(val.slice(1))) {
        return val.slice(1);
      }
      return val;
    })
  );

  return { headers, rows };
}
