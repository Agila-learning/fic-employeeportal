import ExcelJS from 'exceljs';

/**
 * Helper utilities for ExcelJS to simplify migration from xlsx-js-style.
 * All colors are ARGB format (e.g., 'FF1A5276' for opaque dark blue).
 */

export type ExcelAlignment = Partial<ExcelJS.Alignment>;

const toARGB = (rgb: string): string => {
  // Ensure 8-char ARGB (prepend FF for opacity)
  return rgb.length === 6 ? `FF${rgb}` : rgb;
};

const thinBorder = (color = '000000'): ExcelJS.Border => ({
  style: 'thin',
  color: { argb: toARGB(color) },
});

export const defaultBorder: Partial<ExcelJS.Borders> = {
  top: thinBorder('D0D0D0'),
  bottom: thinBorder('D0D0D0'),
  left: thinBorder('D0D0D0'),
  right: thinBorder('D0D0D0'),
};

export const solidBorder: Partial<ExcelJS.Borders> = {
  top: thinBorder('000000'),
  bottom: thinBorder('000000'),
  left: thinBorder('000000'),
  right: thinBorder('000000'),
};

/** Apply a styled header row to a worksheet */
export const applyHeaderStyle = (
  ws: ExcelJS.Worksheet,
  colCount: number,
  fillColor: string,
  rowNumber = 1
) => {
  const row = ws.getRow(rowNumber);
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: toARGB(fillColor) } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = solidBorder;
  }
};

/** Apply alternating row styles with optional color function */
export const applyRowStyles = (
  ws: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  colCount: number,
  colorFn?: (rowIndex: number) => string | null
) => {
  for (let r = startRow; r <= endRow; r++) {
    const row = ws.getRow(r);
    const idx = r - startRow; // 0-based index
    const bgColor = colorFn ? colorFn(idx) : (idx % 2 === 0 ? 'F2F2F2' : 'FFFFFF');
    for (let c = 1; c <= colCount; c++) {
      const cell = row.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: toARGB(bgColor || (idx % 2 === 0 ? 'F2F2F2' : 'FFFFFF')) } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = defaultBorder;
    }
  }
};

/** Set column widths on a worksheet */
export const setColumnWidths = (ws: ExcelJS.Worksheet, widths: number[]) => {
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
};

/** Add a row of data and return the row number */
export const addDataRows = (
  ws: ExcelJS.Worksheet,
  headers: string[],
  rows: any[][],
  headerFillColor = '1A5276'
): number => {
  // Add header
  const headerRow = ws.addRow(headers);
  applyHeaderStyle(ws, headers.length, headerFillColor, headerRow.number);

  // Add data rows
  rows.forEach(row => ws.addRow(row));

  return headerRow.number;
};

/** Download workbook as .xlsx file in browser */
export const downloadWorkbook = async (wb: ExcelJS.Workbook, fileName: string) => {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/** Create a new workbook */
export const createWorkbook = (): ExcelJS.Workbook => {
  return new ExcelJS.Workbook();
};

/** Status color helper */
export const getStatusColor = (status: string): string => {
  if (status === 'Present') return 'D5F5E3';
  if (status === 'Half Day') return 'FEF9E7';
  if (status === 'Absent' || status === 'Not Marked') return 'FADBD8';
  if (status.includes('Sunday')) return 'D6EAF8';
  if (status.includes('Holiday')) return 'E8DAEF';
  return 'FFFFFF';
};

/** Style a cell with fill, font, alignment, border */
export const styleCell = (
  cell: ExcelJS.Cell,
  options: {
    fillColor?: string;
    fontBold?: boolean;
    fontColor?: string;
    fontSize?: number;
    horizontal?: ExcelJS.Alignment['horizontal'];
    vertical?: ExcelJS.Alignment['vertical'];
    border?: Partial<ExcelJS.Borders>;
  }
) => {
  if (options.fillColor) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: toARGB(options.fillColor) } };
  }
  if (options.fontBold || options.fontColor || options.fontSize) {
    cell.font = {
      bold: options.fontBold,
      color: options.fontColor ? { argb: toARGB(options.fontColor) } : undefined,
      size: options.fontSize,
    };
  }
  if (options.horizontal || options.vertical) {
    cell.alignment = { horizontal: options.horizontal, vertical: options.vertical };
  }
  if (options.border) {
    cell.border = options.border;
  }
};
