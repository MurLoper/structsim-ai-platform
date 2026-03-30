export type ExcelCellValue = string | number | boolean | null | undefined;
export type ExcelMergeRange = { s: { r: number; c: number }; e: { r: number; c: number } };

export async function exportAoaToExcel(
  aoa: ExcelCellValue[][],
  filename: string,
  merges?: ExcelMergeRange[]
) {
  const XLSXModule = await import('xlsx');

  const worksheet = XLSXModule.utils.aoa_to_sheet(aoa);

  if (merges && merges.length > 0) {
    worksheet['!merges'] = merges;
  }

  const workbook = XLSXModule.utils.book_new();
  XLSXModule.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSXModule.writeFile(workbook, `${filename}.xlsx`);
}
