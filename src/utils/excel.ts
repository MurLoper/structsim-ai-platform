import * as XLSX from 'xlsx';

export async function exportAoaToExcel(aoa: any[][], filename: string, merges?: XLSX.Range[]) {
  const XLSXModule = await import('xlsx');

  const worksheet = XLSXModule.utils.aoa_to_sheet(aoa);

  if (merges && merges.length > 0) {
    worksheet['!merges'] = merges;
  }

  const workbook = XLSXModule.utils.book_new();
  XLSXModule.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSXModule.writeFile(workbook, `${filename}.xlsx`);
}
