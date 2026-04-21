import client from './client';

export interface Farmer {
  id: number;
  farmerCode: string;
  farmerName: string;
  powerAccount: string | null;
  inverterSn: string | null;
  inverterBrand: string | null;
  moduleSpec: string | null;
  moduleCount: number | null;
  capacityKw: number | null;
  status: number;
  lastInspectTime: string | null;
  lastInspectorName?: string | null;
}

export interface FarmerDetail extends Farmer {
  projectName: string;
  records: Array<{ id: number; planName: string; inspectorName: string; createTime: string }>;
}

export function listFarmers(projectId: number, params?: {
  page?: number; size?: number; farmerName?: string; farmerCode?: string; status?: number;
}) {
  return client.get<any, { code: number; data: { records: Farmer[]; total: number } }>(
    `/projects/${projectId}/farmers`, { params }
  );
}

export function createFarmer(projectId: number, data: any) {
  return client.post<any, { code: number; data: { id: number } }>(`/projects/${projectId}/farmers`, data);
}

export function updateFarmer(projectId: number, id: number, data: any) {
  return client.put<any, { code: number }>(`/projects/${projectId}/farmers/${id}`, data);
}

export function deleteFarmer(projectId: number, id: number) {
  return client.delete<any, { code: number }>(`/projects/${projectId}/farmers/${id}`);
}

export function batchDeleteFarmers(projectId: number, ids: number[]) {
  return client.delete<any, { code: number; data: { deletedCount: number } }>(
    `/projects/${projectId}/farmers/batch`, { data: { ids } }
  );
}

export function getFarmerDetail(projectId: number, id: number) {
  return client.get<any, { code: number; data: FarmerDetail }>(`/projects/${projectId}/farmers/${id}`);
}

export function importFarmers(projectId: number, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return client.post<any, { code: number; data: { successCount: number; failCount: number; errors: any[] } }>(
    `/projects/${projectId}/farmers/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
}
