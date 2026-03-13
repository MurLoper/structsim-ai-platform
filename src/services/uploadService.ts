import { api } from '@/api/client';
import type {
  CheckFileResponse,
  InitUploadResponse,
  UploadChunkResponse,
  UploadStatusResponse,
  MergeResponse,
} from '@/types/upload';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CONCURRENT = 3;
const MAX_RETRIES = 3;

export class ChunkedUploadService {
  async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async calculateChunkHash(chunk: Blob): Promise<string> {
    const buffer = await chunk.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async checkFile(fileHash: string, fileName: string, fileSize: number) {
    const response = await api.post<CheckFileResponse>('/upload/check', {
      fileHash,
      fileName,
      fileSize,
    });
    return response.data;
  }

  async initUpload(
    fileHash: string,
    fileName: string,
    fileSize: number,
    chunkSize: number = CHUNK_SIZE,
    mimeType?: string
  ) {
    const response = await api.post<InitUploadResponse>('/upload/init', {
      fileHash,
      fileName,
      fileSize,
      chunkSize,
      mimeType,
    });
    return response.data;
  }

  async uploadChunk(uploadId: string, chunkIndex: number, chunkData: Blob, chunkHash: string) {
    const formData = new FormData();
    formData.append('upload_id', uploadId);
    formData.append('chunk_index', chunkIndex.toString());
    formData.append('chunk_hash', chunkHash);
    formData.append('file', chunkData);

    const response = await api.post<UploadChunkResponse>('/upload/chunk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getStatus(uploadId: string) {
    const response = await api.get<UploadStatusResponse>(`/upload/status/${uploadId}`);
    return response.data;
  }

  async mergeChunks(uploadId: string) {
    const response = await api.post<MergeResponse>('/upload/merge', {
      uploadId,
    });
    return response.data;
  }

  async cancelUpload(uploadId: string) {
    await api.delete(`/upload/cancel/${uploadId}`);
  }

  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void,
    onStatusChange?: (status: string) => void
  ): Promise<MergeResponse> {
    onStatusChange?.('calculating_hash');
    const fileHash = await this.calculateFileHash(file);

    onStatusChange?.('checking_file');
    const checkResult = await this.checkFile(fileHash, file.name, file.size);
    if (checkResult.exists) {
      onProgress?.(1);
      return {
        fileId: checkResult.fileId!,
        storagePath: checkResult.storagePath!,
        fileUrl: `/files/${checkResult.storagePath}`,
      };
    }

    onStatusChange?.('initializing');
    const initResult = await this.initUpload(fileHash, file.name, file.size, CHUNK_SIZE, file.type);

    const { uploadId, totalChunks, uploadedChunks } = initResult;
    localStorage.setItem('upload_id', uploadId);

    onStatusChange?.('uploading');
    const pendingChunks = Array.from({ length: totalChunks }, (_, i) => i).filter(
      i => !uploadedChunks.includes(i)
    );

    let completedCount = uploadedChunks.length;

    const uploadChunkWithRetry = async (chunkIndex: number, retries = 0): Promise<void> => {
      try {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunkData = file.slice(start, end);
        const chunkHash = await this.calculateChunkHash(chunkData);

        await this.uploadChunk(uploadId, chunkIndex, chunkData, chunkHash);
        completedCount++;
        onProgress?.(completedCount / totalChunks);
      } catch (error) {
        if (retries < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          return uploadChunkWithRetry(chunkIndex, retries + 1);
        }
        throw error;
      }
    };

    for (let i = 0; i < pendingChunks.length; i += MAX_CONCURRENT) {
      const batch = pendingChunks.slice(i, i + MAX_CONCURRENT);
      await Promise.all(batch.map(idx => uploadChunkWithRetry(idx)));
    }

    onStatusChange?.('merging');
    const result = await this.mergeChunks(uploadId);
    localStorage.removeItem('upload_id');

    onProgress?.(1);
    onStatusChange?.('completed');
    return result;
  }
}

export const uploadService = new ChunkedUploadService();
