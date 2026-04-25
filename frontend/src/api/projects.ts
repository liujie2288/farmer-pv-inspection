import client from './client';

export interface Project {
  id: number;
  projectName: string;
  propertyCompany: string;
  stationType: string;
  province: string;
  city: string;
  droneCertificateUrl: string;
  specialOperationCertUrl: string;
  sectionIds: string;
  devices: DeviceItem[];
  createTime: string;
}

export interface DeviceItem {
  id?: number;
  deviceName: string;
  deviceModel: string;
}

export interface ProjectStats {
  inverterCount: number;
  inspectedCount: number;
  uninspectedCount: number;
  completionRate: number;
  activePlan: { id: number; planName: string } | null;
}

export function listProjects(params?: { page?: number; size?: number; projectName?: string }) {
  return client.get<any, { code: number; data: { records: Project[]; total: number } }>('/projects', { params });
}

export function createProject(data: { projectName: string; propertyCompany: string; stationType: string; province?: string; city?: string; droneCertificateUrl?: string; specialOperationCertUrl?: string; sectionIds?: string; devices?: DeviceItem[] }) {
  return client.post<any, { code: number; data: { id: number } }>('/projects', data);
}

export function updateProject(id: number, data: { projectName: string; propertyCompany: string; stationType: string; province?: string; city?: string; droneCertificateUrl?: string; specialOperationCertUrl?: string; sectionIds?: string; devices?: DeviceItem[] }) {
  return client.put<any, { code: number }>(`/projects/${id}`, data);
}

export function deleteProject(id: number) {
  return client.delete<any, { code: number }>(`/projects/${id}`);
}

export function getProject(id: number) {
  return client.get<any, { code: number; data: Project }>(`/projects/${id}`);
}

export function getProjectStats(id: number) {
  return client.get<any, { code: number; data: ProjectStats }>(`/projects/${id}/stats`);
}
