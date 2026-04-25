import client from './client';

// ---- Photos types (internal use by InspectionChecklist) ----

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

// ---- Submit DTO types (match backend InspectRecordDto) ----

export interface ChecklistItemSubmit {
  itemId: number;
  result: boolean | null;
  remark?: string;
  value?: string | null;
}

export interface ChecklistSectionSubmit {
  sectionId: number;
  items: ChecklistItemSubmit[];
}

export interface PhotoSectionSubmit {
  sectionId: number;
  items: { url: string }[];
}

export interface InspectionSubmit {
  planId: number;
  stationId: number;
  projectId: number;
  weather?: string;
  checklistResult: ChecklistSectionSubmit[];
}

// ---- Conversion: ChecklistData + PhotosMap → Submit DTO ----

export function toSubmitFormat(
  checklistData: any,
  photosMap: PhotosMap,
): { checklistResult: ChecklistSectionSubmit[]; photos: PhotoSectionSubmit[] } {
  const checklistResult: ChecklistSectionSubmit[] = (checklistData.sections || []).map(
    (section: any) => ({
      sectionId: section.sectionId,
      items: (section.items || []).map((item: any) => {
        const dto: ChecklistItemSubmit = { itemId: item.itemId, result: null };
        if (item.itemType === 2) {
          const val = item.measuredValue?.value;
          const hasValue = val != null && String(val).trim() !== '';
          dto.result = hasValue ? true : null;
          dto.value = hasValue ? String(val).trim() : null;
        } else {
          // CHECK: result from toggle
          dto.result = item.result === '正常' ? true : item.result === '异常' ? false : null;
          dto.remark = item.exceptionNote || undefined;
        }
        return dto;
      }),
    }),
  );

  const photos: PhotoSectionSubmit[] = Object.entries(photosMap).map(([key, items]) => ({
    sectionId: Number(key),
    items: (items || []).map((p) => ({ url: p.url })),
  }));

  return { checklistResult, photos };
}

// ---- API functions (→ /records) ----

export function submitInspection(data: InspectionSubmit) {
  return client.post<any, { code: number; data: { id: number } }>('/records', data);
}

export function updateInspection(id: number, data: Partial<InspectionSubmit>) {
  return client.put<any, { code: number }>(`/records/${id}`, data);
}

export function getInspectionDetail(id: number) {
  return client.get<any, { code: number; data: any }>(`/records/${id}`);
}

export function listInspections(params: { stationId?: number; planId?: number; keyword?: string; status?: number; page?: number; size?: number }) {
  return client.get<any, { code: number; data: { records: any[]; total: number } }>('/records', { params });
}

export function uploadPhoto(file: File, sectionId: number, longitude?: number, latitude?: number) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('sectionId', String(sectionId));
  if (longitude != null) formData.append('longitude', String(longitude));
  if (latitude != null) formData.append('latitude', String(latitude));
  return client.post<any, { code: number; data: { url: string } }>('/records/photos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
