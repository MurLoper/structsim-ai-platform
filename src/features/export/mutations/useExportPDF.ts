import { useMutation } from '@tanstack/react-query';
import { exportApi, type ExportPDFRequest } from '@/api/export';

export const useExportPDF = () => {
  return useMutation({
    mutationFn: async (request: ExportPDFRequest) => {
      const blob = await exportApi.exportPDF(request);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `order_${request.order_id}_report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
};
