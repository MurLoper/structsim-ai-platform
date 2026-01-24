const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface ExportPDFRequest {
  order_id: number;
  include_charts?: boolean;
  sim_type_ids?: number[];
}

const exportPDF = async (request: ExportPDFRequest): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/export/pdf`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to export PDF');
  }

  return await response.blob();
};

export const exportApi = {
  exportPDF,
};
