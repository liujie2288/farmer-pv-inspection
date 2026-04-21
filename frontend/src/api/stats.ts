import client from './client';

export interface GlobalStats {
  totalProjects: number;
  totalFarmers: number;
  totalInspected: number;
  completionRate: number;
  activePlans: Array<{ id: number; planName: string; endTime: string }>;
  projectRanking: Array<{ projectId: number; projectName: string; farmerCount: number; inspectedCount: number; completionRate: number }>;
}

export function getGlobalStats() {
  return client.get<any, { code: number; data: GlobalStats }>('/stats/global');
}

export function getProjectStats(projectId: number) {
  return client.get<any, { code: number; data: any }>(`/stats/project/${projectId}`);
}
