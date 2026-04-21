import client from './client';

export interface ExportTaskInfo {
  id: number;
  planId: number;
  status: number;
  fileUrl: string | null;
  fileSize: number | null;
  totalCount: number;
  errorMessage: string | null;
}

export function exportPlan(planId: number) {
  return client.post<any, { code: number; data: ExportTaskInfo }>(`/export/plan/${planId}`);
}

export function getExportTaskStatus(taskId: number) {
  return client.get<any, { code: number; data: ExportTaskInfo }>(`/export/task/${taskId}`);
}

export async function fetchPdf(recordId: number): Promise<Blob> {
  const response = await client.get(`/export/pdf/${recordId}`, {
    responseType: 'blob',
  });
  return response as unknown as Blob;
}
