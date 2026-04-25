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
  stationCount: number;
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

export interface ProjectPlan {
  id: number;
  planId: number;
  planName: string;
  projectId: number;
  totalCount: number;
  inspectedCount: number;
  startTime: string;
  endTime: string;
  status: number;
}

export function getProjectPlan(projectId: number) {
  return client.get<any, { code: number; data: ProjectPlan | null }>(`/projects/${projectId}/plan`);
}

export function batchGetProjectPlans(projectIds: number[]) {
  return client.post<any, { code: number; data: Record<number, ProjectPlan> }>('/projects/plans/batch', projectIds);
}
