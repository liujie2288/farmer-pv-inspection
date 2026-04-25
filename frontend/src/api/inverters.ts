import client from './client';

export interface Inverter {
  id: number;
  inverterCode: string;
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

export interface InverterDetail extends Inverter {
  projectName: string;
  records: Array<{ id: number; planName: string; inspectorName: string; createTime: string }>;
}

export function listInverters(projectId: number, params?: {
  page?: number; size?: number; keyword?: string; status?: number;
}) {
  return client.get<any, { code: number; data: { records: Inverter[]; total: number } }>(
    `/projects/${projectId}/inverters`, { params }
  );
}

export function createInverter(projectId: number, data: any) {
  return client.post<any, { code: number; data: { id: number } }>(`/projects/${projectId}/inverters`, data);
}

export function updateInverter(projectId: number, id: number, data: any) {
  return client.put<any, { code: number }>(`/projects/${projectId}/inverters/${id}`, data);
}

export function deleteInverter(projectId: number, id: number) {
  return client.delete<any, { code: number }>(`/projects/${projectId}/inverters/${id}`);
}

export function batchDeleteInverters(projectId: number, ids: number[]) {
  return client.delete<any, { code: number; data: { deletedCount: number } }>(
    `/projects/${projectId}/inverters/batch`, { data: { ids } }
  );
}

export function getInverterDetail(projectId: number, id: number) {
  return client.get<any, { code: number; data: InverterDetail }>(`/projects/${projectId}/inverters/${id}`);
}

export function importInverters(projectId: number, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return client.post<any, { code: number; data: { successCount: number; failCount: number; errors: any[] } }>(
    `/projects/${projectId}/inverters/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
}
