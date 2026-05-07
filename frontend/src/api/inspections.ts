import client from './client';

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

export interface PhotoItemSubmit {
  itemId: number;
  itemName: string;
  urls: string[];
}

export interface PhotoSectionSubmit {
  sectionId: number;
  items: PhotoItemSubmit[];
}

export interface WatermarkConfig {
  fields?: string[];
  customTexts?: string[];
}

export interface InspectionSubmit {
  planId: number;
  stationId: number;
  projectId: number;
  weather?: string;
  deviceName?: string;
  deviceModel?: string;
  checklistResult: ChecklistSectionSubmit[];
  photos?: PhotoSectionSubmit[];
  thermalImageUrl: string;
  watermarkConfig?: WatermarkConfig;
}

// ---- API functions (→ /records) ----

export function submitInspection(data: InspectionSubmit) {
  return client.post<any, { code: number; data: { id: number } }>('/records', data);
}

export function updateInspection(id: number, data: Partial<InspectionSubmit>) {
  return client.put<any, { code: number }>(`/records/${id}`, data);
}

export function extendDeadline(id: number) {
  return client.put<any, { code: number }>(`/records/${id}/extend-deadline`);
}

export function rejectRecord(id: number, reason: string) {
  return client.put<any, { code: number }>(`/records/${id}/reject`, { reason });
}

export function findMyRejectedRecord(stationId: number, planProjectId: number) {
  return client.get<any, { code: number; data: { recordId: number } | null }>(`/records/rejected-mine`, { params: { stationId, planProjectId } });
}

export function getInspectionDetail(id: number) {
  return client.get<any, { code: number; data: any }>(`/records/${id}`);
}

export function listInspections(params: { stationId?: number; planId?: number; keyword?: string; status?: number; page?: number; size?: number }) {
  return client.get<any, { code: number; data: { records: any[]; total: number } }>('/records', { params });
}
