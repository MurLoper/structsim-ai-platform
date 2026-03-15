import { ChunkedUpload } from '@/components/FileUpload/ChunkedUpload';

export function UploadExample() {
  const handleSuccess = (_fileId: number, _storagePath: string) => {
    // 上传成功后更新表单或状态
  };

  const handleError = (error: Error) => {
    console.error('上传失败:', error);
  };

  return (
    <ChunkedUpload
      onSuccess={handleSuccess}
      onError={handleError}
      accept=".zip,.rar,.7z,.step,.stp"
      maxSize={4294967296}
    />
  );
}
