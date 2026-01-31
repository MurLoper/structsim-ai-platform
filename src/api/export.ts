import apiClient from './client';

export interface ExportPDFRequest {
  orderId: number;
  includeCharts?: boolean;
  simTypeIds?: number[];
}

const exportPDF = async (request: ExportPDFRequest): Promise<Blob> => {
  const response = await apiClient.post('/export/pdf', request, {
    responseType: 'blob',
  });
  return response.data;
};

export const exportApi = {
  exportPDF,
};
