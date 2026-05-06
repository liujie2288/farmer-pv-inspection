import client from './client';

export interface UploadUrlResult {
  uploadUrl: string;
  objectKey: string;
}

export async function getUploadUrl(filename: string, contentType: string, type = 'certificate'): Promise<UploadUrlResult> {
  const res = await client.get<any, { code: number; data: UploadUrlResult }>(
    '/storage/upload-url',
    { params: { filename, contentType, type } }
  );
  return res.data;
}

export async function uploadFileToOss(
  file: File,
  type = 'certificate',
  options?: { onProgress?: (percent: number) => void },
): Promise<string> {
  const { uploadUrl, objectKey } = await getUploadUrl(file.name, file.type, type);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);

    if (options?.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          options.onProgress!(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(objectKey);
      } else {
        reject(new Error('上传失败'));
      }
    };
    xhr.onerror = () => reject(new Error('上传失败'));
    xhr.send(file);
  });
}

export async function getPresignedUrl(objectKey: string): Promise<string> {
  const res = await client.get<any, { code: number; data: string }>(
    '/storage/presigned-url',
    { params: { objectKey } }
  );
  return res.data;
}

export async function getImageUrl(objectKey: string, style = 'thm_cert'): Promise<string> {
  const res = await client.get<any, { code: number; data: string }>(
    '/storage/image-url',
    { params: { objectKey, style } }
  );
  return res.data;
}
