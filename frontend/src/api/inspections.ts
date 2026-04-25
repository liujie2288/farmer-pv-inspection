import client from './client';

export interface PhotoMeta {
  url: string;
  name: string;
}

export type PhotosMap = Record<string, PhotoMeta[]>;

export function normalizePhotos(raw: Record<string, any>): PhotosMap {
  const result: PhotosMap = {};
  for (const [key, val] of Object.entries(raw || {})) {
    if (Array.isArray(val)) {
      result[key] = val.map((item: any) =>
        typeof item === 'string' ? { url: item, name: '' } : item
      );
    }
  }
  return result;
}

export interface InspectionSubmit {
  planId: number;
  stationId: number;
  projectId: number;
  checklistResult: any;
  photos: PhotosMap;
  longitude: number;
  latitude: number;
}

export function submitInspection(data: InspectionSubmit) {
  return client.post<any, { code: number; data: { id: number } }>('/inspections', data);
}

export function updateInspection(id: number, data: Partial<InspectionSubmit>) {
  return client.put<any, { code: number }>(`/inspections/${id}`, data);
}

export function getInspectionDetail(id: number) {
  return client.get<any, { code: number; data: any }>(`/inspections/${id}`);
}

export function listInspections(params: { stationId?: number; planId?: number; keyword?: string; status?: number; page?: number; size?: number }) {
  return client.get<any, { code: number; data: { records: any[]; total: number } }>('/inspections', { params });
}

export function uploadPhoto(file: File, sectionId: number, longitude?: number, latitude?: number) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('sectionId', String(sectionId));
  if (longitude != null) formData.append('longitude', String(longitude));
  if (latitude != null) formData.append('latitude', String(latitude));
  return client.post<any, { code: number; data: { url: string } }>('/inspections/photos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
