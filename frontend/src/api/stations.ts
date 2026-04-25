import client from './client';

export interface Station {
  id: number;
  stationCode: string;
  ownerName: string;
  address: string | null;
  powerAccount: string | null;
  inverterSn: string | null;
  inverterBrand: string | null;
  moduleSpec: string | null;
  moduleCount: number | null;
  capacityKw: number | null;
  longitude: number | null;
  latitude: number | null;
  status: number;
  lastInspectTime: string | null;
  lastInspectorName?: string | null;
}

export interface StationDetail extends Station {
  projectName: string;
  records: Array<{ recordId: number; planName: string; inspectorName: string; inspectorTime: string }>;
}

export function listStations(projectId: number, params?: {
  page?: number; size?: number; keyword?: string; inspectStatus?: number;
}) {
  return client.get<any, { code: number; data: { records: Station[]; total: number } }>(
    `/projects/${projectId}/stations`, { params }
  );
}

export function createStation(projectId: number, data: any) {
  return client.post<any, { code: number; data: { id: number } }>(`/projects/${projectId}/stations`, data);
}

export function updateStation(projectId: number, id: number, data: any) {
  return client.put<any, { code: number }>(`/projects/${projectId}/stations/${id}`, data);
}

export function deleteStation(projectId: number, id: number) {
  return client.delete<any, { code: number }>(`/projects/${projectId}/stations/${id}`);
}

export function batchDeleteStations(projectId: number, ids: number[]) {
  return client.delete<any, { code: number; data: { deletedCount: number } }>(
    `/projects/${projectId}/stations/batch`, { data: { ids } }
  );
}

export function getStationDetail(projectId: number, id: number) {
  return client.get<any, { code: number; data: StationDetail }>(`/projects/${projectId}/stations/${id}`);
}

export function importStations(projectId: number, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return client.post<any, { code: number; data: { successCount: number; failCount: number; errors: any[] } }>(
    `/projects/${projectId}/stations/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
}
