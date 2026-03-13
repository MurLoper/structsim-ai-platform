import { useState, useRef } from 'react';
import { Upload, X, FileIcon, CheckCircle2 } from 'lucide-react';
import { uploadService } from '@/services/uploadService';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface ChunkedUploadProps {
  onSuccess?: (fileId: number, storagePath: string) => void;
  onError?: (error: Error) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}

export function ChunkedUpload({
  onSuccess,
  onError,
  accept,
  maxSize = 4294967296,
  className,
}: ChunkedUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const statusText: Record<string, string> = {
    calculating_hash: '计算文件哈希...',
    checking_file: '检查文件是否存在...',
    initializing: '初始化上传...',
    uploading: '上传中...',
    merging: '合并文件...',
    completed: '上传完成',
  };

  const validateFile = (selectedFile: File) => {
    if (selectedFile.size > maxSize) {
      showToast('error', `文件大小不能超过 ${(maxSize / 1024 / 1024 / 1024).toFixed(1)}GB`);
      return false;
    }
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      setProgress(0);
      setStatus('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    if (validateFile(droppedFile)) {
      setFile(droppedFile);
      setProgress(0);
      setStatus('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadService.uploadFile(
        file,
        p => setProgress(Math.round(p * 100)),
        s => setStatus(s)
      );

      showToast('success', `文件 ${file.name} 已成功上传`);
      onSuccess?.(result.fileId, result.storagePath);
      setFile(null);
      setProgress(0);
      setStatus('');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '上传失败');
      onError?.(error as Error);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setProgress(0);
    setStatus('');
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />

      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer',
            'hover:border-primary hover:bg-accent/50',
            isDragging ? 'border-primary bg-accent' : 'border-border',
            uploading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">点击或拖拽文件到此处上传</p>
              <p className="text-xs text-muted-foreground mt-1">
                支持最大 {(maxSize / 1024 / 1024 / 1024).toFixed(1)}GB 的文件
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="rounded-lg bg-primary/10 p-2 flex-shrink-0">
                {status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <FileIcon className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              disabled={uploading}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{statusText[status] || status}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}

          {!uploading && status !== 'completed' && (
            <Button onClick={handleUpload} className="w-full" size="sm">
              开始上传
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
