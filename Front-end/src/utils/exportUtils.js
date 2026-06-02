// utils/exportUtils.js
// Pure client-side export helpers — no external packages needed.
//
// downloadCSV(headers, rows, filename)
//   → Builds a UTF-8 CSV with BOM (Excel-friendly) and triggers a browser download.
//
// printReport({ title, subtitle, meta, headers, rows })
//   → Opens a new window with a clean styled table and auto-triggers the print dialog.
//   → Users can "Save as PDF" from the browser's native print dialog.

// ── CSV ───────────────────────────────────────────────────────────────────────
export function downloadCSV(headers, rows, filename = "export.csv") {
  // RFC 4180 escaping: wrap in quotes if value contains comma, quote, or newline
  const esc = (val) => {
    const s = String(val ?? "");
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csv = [
    headers.map(esc).join(","),
    ...rows.map(row => row.map(esc).join(",")),
  ].join("\r\n");

  // \uFEFF = UTF-8 BOM so Excel opens without encoding issues
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── PDF (print window) ────────────────────────────────────────────────────────
export function printReport({ title, subtitle = "", meta = [], headers, rows }) {
  const ths = headers.map(h => `<th>${h}</th>`).join("");
  const trs = rows.map(row =>
    `<tr>${row.map(cell => `<td>${cell ?? ""}</td>`).join("")}</tr>`
  ).join("");

  const metaHtml = meta.length
    ? `<div class="meta">${meta.map(({ label, value }) => `
        <div class="meta-card">
          <span class="meta-label">${label}</span>
          <span class="meta-value">${value}</span>
        </div>`).join("")}
      </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title} — Vizhiyal</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      color: #1f2937;
      padding: 40px;
      font-size: 13px;
    }
    /* ── Header ── */
    .header { margin-bottom: 28px; padding-bottom: 18px; border-bottom: 2px solid #e5e7eb; }
    .brand  { font-size: 13px; color: #263E8B; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px; }
    .title  { font-size: 20px; font-weight: 800; color: #111827; }
    .subtitle  { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .generated { font-size: 11px; color: #9ca3af; margin-top: 6px; }
    /* ── Meta cards ── */
    .meta { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .meta-card  { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
    .meta-label { display: block; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 5px; }
    .meta-value { display: block; font-size: 18px; font-weight: 700; color: #111827; }
    /* ── Table ── */
    table { width: 100%; border-collapse: collapse; }
    thead th {
      background: #263E8B; color: #fff;
      padding: 9px 12px; text-align: left;
      font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.6px;
    }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody td { padding: 9px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; }
    /* ── Footer ── */
    .footer {
      margin-top: 28px; padding-top: 14px; border-top: 1px solid #e5e7eb;
      font-size: 11px; color: #9ca3af; text-align: center;
    }
    @media print {
      body { padding: 16px; }
      @page { margin: 1.2cm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">vizhiyal.</div>
    <div class="title">${title}</div>
    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
    <div class="generated">Generated: ${new Date().toLocaleString("en-LK", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })}</div>
  </div>
  ${metaHtml}
  <table>
    <thead><tr>${ths}</tr></thead>
    <tbody>${trs}</tbody>
  </table>
  <div class="footer">Vizhiyal Event Management Platform &middot; Confidential &middot; Do not distribute</div>
  <script>window.addEventListener("load", () => window.print());</script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=900,height=650");
  if (w) {
    w.document.write(html);
    w.document.close();
  } else {
    alert("Please allow pop-ups to generate the PDF report.");
  }
}
