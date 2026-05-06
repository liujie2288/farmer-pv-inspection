import { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadFileToOss } from '@/api/storage';
import { showToast } from '@/components/ui/Toast';
import { openImagePreview } from '@/components/ui/ImagePreview';

interface ImageUploadProps {
  value: string;
  onChange: (objectKey: string) => void;
  placeholder?: string;
}

export default function ImageUpload({ value, onChange, placeholder = '点击上传图片' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localUrl, setLocalUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE = 5 * 1024 * 1024;

  // 清理本地 blob URL
  useEffect(() => {
    return () => {
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [localUrl]);

  // 本地 blob 优先，否则直接用 value（后端返回的 presigned URL）
  const previewUrl = localUrl || (value && !value.startsWith('blob:') ? value : '');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_SIZE) {
      showToast({ icon: 'warning', content: '图片不能超过5MB' });
      return;
    }

    const blob = URL.createObjectURL(file);
    setLocalUrl(blob);
    setUploading(true);
    setProgress(0);

    try {
      const objectKey = await uploadFileToOss(file, 'certificate', {
        onProgress: (p) => setProgress(p),
      });
      onChange(objectKey);
    } catch (err: any) {
      showToast({ icon: 'fail', content: err.message || '上传失败' });
      URL.revokeObjectURL(blob);
      setLocalUrl('');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localUrl) {
      URL.revokeObjectURL(localUrl);
      setLocalUrl('');
    }
    onChange('');
  };

  const handlePreview = () => {
    if (previewUrl) openImagePreview(previewUrl);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {value ? (
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 max-w-[40%] cursor-pointer"
             onClick={uploading ? undefined : handlePreview}>
          {previewUrl ? (
            <img src={previewUrl} alt="证书图片" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-gray-300" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-1">
              <Loader2 size={20} className="animate-spin text-white" />
              <span className="text-xs text-white">{progress}%</span>
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-1.5 w-full aspect-[4/3] rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-teal-400 transition-colors max-w-[40%]"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {uploading ? (
            <>
              <Loader2 size={24} className="animate-spin text-teal-500" />
              <span className="text-xs text-gray-400">{progress}%</span>
            </>
          ) : (
            <>
              <Upload size={24} className="text-gray-400" />
              <span className="text-xs text-gray-400">{placeholder}</span>
              <span className="text-xs text-gray-300">不超过5MB</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
