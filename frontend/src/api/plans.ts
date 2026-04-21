import client from './client';

export interface InspectPlan {
  id: number;
  planName: string;
  projectId: number | null;
  projectName: string | null;
  startTime: string;
  endTime: string;
  status: number;
  farmerCount: number;
  inspectedCount: number;
  completionRate: number;
  parentId: number;
  isGlobal: boolean;
}

export interface PlanStats {
  planName: string;
  status: number;
  farmerCount: number;
  inspectedCount: number;
  completionRate: number;
  projectRanking: Array<{ projectId: number; projectName: string; completionRate: number }>;
}

export function listPlans(params?: { page?: number; size?: number; planName?: string; projectId?: number; status?: number }) {
  return client.get<any, { code: number; data: { records: InspectPlan[]; total: number } }>('/plans', { params });
}

export function createPlan(data: { planName: string; projectId: number; startTime: string; endTime: string }) {
  return client.post<any, { code: number; data: { id: number } }>('/plans', data);
}

export function createGlobalPlan(data: { planName: string; projectIds: number[]; startTime: string; endTime: string }) {
  return client.post<any, { code: number; data: { parentPlanId: number; subPlanIds: number[] } }>('/plans/global', data);
}

export function updatePlan(id: number, data: { startTime?: string; endTime?: string }) {
  return client.put<any, { code: number }>(`/plans/${id}`, data);
}

export function finishPlan(id: number) {
  return client.put<any, { code: number }>(`/plans/${id}/finish`);
}

export function getPlanStats(id: number) {
  return client.get<any, { code: number; data: PlanStats }>(`/plans/${id}/stats`);
}

export function getActivePlan(projectId: number) {
  return client.get<any, { code: number; data: InspectPlan | null }>('/plans/active', { params: { projectId } });
}
