import client from './client';

export interface InspectPlan {
  id: number;
  planGroupId: number;
  planName: string;
  projectId: number;
  projectName: string;
  startTime: string;
  endTime: string;
  status: number;
  inverterCount: number;
  inspectedCount: number;
  completionRate: number;
}

export interface PlanStats {
  planGroupId: number;
  planName: string;
  status: number;
  inverterCount: number;
  inspectedCount: number;
  completionRate: number;
  projectRanking: Array<{
    planId: number;
    projectId: number;
    projectName: string;
    inverterCount: number;
    inspectedCount: number;
    completionRate: number;
    status: number;
  }>;
}

export function listPlans(params?: { page?: number; size?: number; planName?: string; projectId?: number; status?: number }) {
  return client.get<any, { code: number; data: { records: InspectPlan[]; total: number } }>('/plans', { params });
}

export function createPlan(data: { planName: string; projectIds: number[]; startTime: string; endTime: string }) {
  return client.post<any, { code: number; data: { planGroupId: number; planIds: number[] } }>('/plans', data);
}

export function updatePlan(planGroupId: number, data: { startTime?: string; endTime?: string }) {
  return client.put<any, { code: number }>(`/plans/${planGroupId}`, data);
}

export function finishPlan(planGroupId: number) {
  return client.put<any, { code: number }>(`/plans/${planGroupId}/finish`);
}

export function getPlanStats(planGroupId: number) {
  return client.get<any, { code: number; data: PlanStats }>(`/plans/${planGroupId}/stats`);
}

export function getActivePlan(projectId: number) {
  return client.get<any, { code: number; data: InspectPlan | null }>('/plans/active', { params: { projectId } });
}
