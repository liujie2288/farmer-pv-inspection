import { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { uploadPhoto, type PhotoMeta } from '@/api/inspections';
import { compressPhoto } from '@/utils/photoCompression';
import { openImagePreview } from '@/components/ui/ImagePreview';

interface PhotoUploaderProps {
  photos: PhotoMeta[];
  onChange: (photos: PhotoMeta[]) => void;
  maxCount?: number;
  sectionId?: number;
  longitude?: number;
  latitude?: number;
  readOnly?: boolean;
}

export default function PhotoUploader({
  photos,
  onChange,
  maxCount = 9,
  sectionId = 0,
  longitude,
  latitude,
  readOnly = false,
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAdd = !readOnly && photos.length < maxCount;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    e.target.value = '';

    const remaining = maxCount - photos.length;
    const toUpload = files.slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploading(true);
    try {
      const uploaded: PhotoMeta[] = [];

      for (const file of toUpload) {
        const compressed = await compressPhoto(file);
        const compressedFile = new File([compressed], file.name, { type: 'image/jpeg' });
        const res = await uploadPhoto(compressedFile, sectionId, longitude, latitude);
        uploaded.push({ url: res.data.url, name: '' });
      }

      onChange([...photos, ...uploaded]);
    } catch (err: any) {
      console.error('Photo upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const next = [...photos];
    next.splice(index, 1);
    onChange(next);
  };

  const handleNameChange = (index: number, name: string) => {
    const next = [...photos];
    next[index] = { ...next[index], name };
    onChange(next);
  };

  const handleClick = () => {
    if (!canAdd || uploading) return;
    inputRef.current?.click();
  };

  if (readOnly && photos.length === 0) return null;

  return (
    <div>
      {/* Dropzone */}
      {canAdd && (
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-teal-400 transition-colors cursor-pointer"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Loader2 size={28} className="animate-spin text-teal-500" />
              <span className="text-sm">上传中...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-gray-400">
              <Camera size={28} />
              <span className="text-sm">点击上传照片</span>
              <span className="text-xs text-gray-300">
                {photos.length}/{maxCount}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Preview grid */}
      {photos.length > 0 && (
        <div className={`grid grid-cols-3 gap-2 ${canAdd ? 'mt-3' : ''}`}>
          {photos.map((photo, index) => (
            <div key={photo.url + index} className="flex flex-col gap-1">
              <div
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                onClick={() => openImagePreview(photo.url, photo.name)}
              >
                <img
                  src={photo.url}
                  alt={photo.name || `照片 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {!readOnly ? (
                <input
                  type="text"
                  value={photo.name}
                  onChange={e => handleNameChange(index, e.target.value)}
                  placeholder="照片名称"
                  className="w-full text-xs text-center px-1 py-1 border border-gray-200 rounded-md focus:outline-none focus:border-teal"
                />
              ) : (
                photo.name && (
                  <p className="text-xs text-gray-500 text-center truncate">{photo.name}</p>
                )
              )}
            </div>
          ))}

          {/* Uploading placeholder in grid */}
          {uploading && (
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-teal-500" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
