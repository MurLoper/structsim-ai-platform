import { ChunkedUpload } from '@/components/FileUpload/ChunkedUpload';

export function UploadExample() {
  const handleSuccess = (fileId: number, storagePath: string) => {
    console.log('上传成功:', { fileId, storagePath });
    // 更新表单或状态
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
