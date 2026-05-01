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

export async function uploadFileToOss(file: File, type = 'certificate'): Promise<string> {
  const { uploadUrl, objectKey } = await getUploadUrl(file.name, file.type, type);

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!res.ok) {
    throw new Error('上传失败');
  }

  return objectKey;
}

export async function getPresignedUrl(objectKey: string): Promise<string> {
  const res = await client.get<any, { code: number; data: string }>(
    '/storage/presigned-url',
    { params: { objectKey } }
  );
  return res.data;
}
