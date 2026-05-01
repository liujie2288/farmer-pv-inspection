import client from './client';

export interface InspectPlan {
  planId: number;
  planName: string;
  startTime: string;
  endTime: string;
  status: number;
  projectCount: number;
  totalCount: number;
  inspectedCount: number;
  completionRate: number;
}

export interface PlanStats {
  planId: number;
  planName: string;
  status: number;
  totalCount: number;
  inspectedCount: number;
  completionRate: number;
  items: Array<{
    planProjectId: number;
    projectId: number;
    projectName: string;
    totalCount: number;
    inspectedCount: number;
    completionRate: number;
  }>;
}

export function listPlans(params?: { page?: number; size?: number; keyword?: string; status?: number }) {
  return client.get<any, { code: number; data: { records: InspectPlan[]; total: number } }>('/inspect/plans', { params });
}

export function createPlan(data: { planName: string; projectIds: number[]; startTime: string; endTime: string }) {
  return client.post<any, { code: number; data: { planId: number; planProjectIds: number[] } }>('/inspect/plans', data);
}

export function updatePlan(planId: number, data: { startTime?: string; endTime?: string }) {
  return client.put<any, { code: number }>(`/inspect/plans/${planId}`, data);
}

export function deletePlan(planId: number) {
  return client.delete<any, { code: number }>(`/inspect/plans/${planId}`);
}

export function finishPlan(planId: number) {
  return client.put<any, { code: number }>(`/inspect/plans/${planId}/finish`);
}

export function getPlanStats(planId: number) {
  return client.get<any, { code: number; data: PlanStats }>(`/inspect/plans/${planId}/detail`);
}

export function getActivePlan(projectId: number) {
  return client.get<any, { code: number; data: InspectPlan | null }>('/inspect/plans/active', { params: { projectId } });
}
