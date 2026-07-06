/**
 * Client-side export engine for the Management workbench ExportDialog.
 * BACKEND-GAP: there is no server export endpoint — files are generated in the
 * browser. CSV is emitted natively; XLSX (exceljs) and PDF (jspdf) are pulled in
 * via dynamic `import()` so they never touch the main bundle.
 */

export type ExportFormat = 'xlsx' | 'csv' | 'pdf';

export type ExportTable = {
  headers: string[];
  rows: (string | number)[][];
};

/**
 * Triggers a browser download for a Blob.
 * @param blob - The file contents.
 * @param filename - The download filename.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Escapes one CSV cell (quotes when it contains a delimiter/quote/newline).
 * @param value - The raw value.
 * @returns The escaped cell.
 */
function csvCell(value: string | number): string {
  const text = String(value);
  return /["\n,]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Downloads the table as a native CSV file (no dependency).
 * @param table - The headers + rows.
 * @param filename - The download filename.
 */
function exportCsv(table: ExportTable, filename: string): void {
  const lines = [
    table.headers.map(csvCell).join(','),
    ...table.rows.map((row) => row.map(csvCell).join(',')),
  ];
  downloadBlob(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }), filename);
}

/**
 * Downloads the table as an XLSX workbook (exceljs, dynamically imported).
 * @param table - The headers + rows.
 * @param filename - The download filename.
 */
async function exportXlsx(table: ExportTable, filename: string): Promise<void> {
  const excel = await import('exceljs');
  const ExcelJS = excel.default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Export');
  const headerRow = sheet.addRow(table.headers);
  headerRow.font = { bold: true };
  for (const row of table.rows) {
    sheet.addRow(row);
  }
  for (const column of sheet.columns) {
    column.width = 18;
  }
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    filename,
  );
}

/**
 * Downloads the table as a PDF list (jspdf + autotable, dynamically imported).
 * @param table - The headers + rows.
 * @param filename - The download filename.
 * @param title - Optional document title printed above the table.
 */
async function exportPdf(table: ExportTable, filename: string, title?: string): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = autoTableModule.default;
  const doc = new jsPDF();
  let startY = 14;
  if (title) {
    doc.setFontSize(14);
    doc.text(title, 14, startY);
    startY += 6;
  }
  autoTable(doc, {
    head: [table.headers],
    body: table.rows.map((row) => row.map(String)),
    startY,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [14, 42, 107] },
  });
  doc.save(filename);
}

/**
 * Downloads the given table in the chosen format (visible columns only, money in
 * original currency — the export contract shown in the ExportDialog footnote).
 * @param table - The headers + rows to export.
 * @param format - The target file format.
 * @param filename - The base filename (extension is appended per format).
 * @param title - Optional title used by the PDF export.
 */
export async function downloadTable(
  table: ExportTable,
  format: ExportFormat,
  filename: string,
  title?: string,
): Promise<void> {
  if (format === 'csv') {
    exportCsv(table, `${filename}.csv`);
    return;
  }
  if (format === 'xlsx') {
    await exportXlsx(table, `${filename}.xlsx`);
    return;
  }
  await exportPdf(table, `${filename}.pdf`, title);
}
