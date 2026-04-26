import client from './client';

export interface GlobalStats {
  totalProjects: number;
  totalStations: number;
  weekInspected: number;
  monthInspected: number;
  activePlans: Array<{ id: number; planName: string; endTime: string }>;
}

export function getGlobalStats() {
  return client.get<any, { code: number; data: GlobalStats }>('/stats/global');
}

export function getProjectStats(projectId: number) {
  return client.get<any, { code: number; data: any }>(`/stats/project/${projectId}`);
}
