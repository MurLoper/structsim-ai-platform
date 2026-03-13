export interface UploadFile {
  id: number;
  fileHash: string;
  fileName: string;
  fileSize: number;
  uploadId: string;
  status: 'uploading' | 'merging' | 'completed' | 'failed';
  progress: number;
  uploadedChunks: number[];
  totalChunks: number;
}

export interface CheckFileResponse {
  exists: boolean;
  fileId?: number;
  storagePath?: string;
}

export interface InitUploadResponse {
  uploadId: string;
  totalChunks: number;
  uploadedChunks: number[];
  chunkSize: number;
}

export interface UploadChunkResponse {
  chunkIndex: number;
  uploaded: boolean;
  progress: number;
}

export interface UploadStatusResponse {
  uploadId: string;
  status: string;
  totalChunks: number;
  uploadedChunks: number[];
  progress: number;
  fileName: string;
}

export interface MergeResponse {
  fileId: number;
  storagePath: string;
  fileUrl: string;
}
