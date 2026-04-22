import client from './client';

export interface ExportTaskInfo {
  id: number;
  planId: number;
  status: number;        // 0=processing, 1=completed, 2=failed
  exportType: number;    // 0=PDF, 1=photos
  fileUrl: string | null;
  fileSize: number | null;
  totalCount: number;
  processedCount: number;
  errorMessage: string | null;
  createTime: string;
  completeTime: string | null;
}

export function exportPlan(planId: number, exportType: number = 0) {
  return client.post<any, { code: number; data: ExportTaskInfo }>(
    `/export/plan/${planId}?exportType=${exportType}`
  );
}

export function getExportTaskStatus(taskId: number) {
  return client.get<any, { code: number; data: ExportTaskInfo }>(`/export/task/${taskId}`);
}

export function listExportTasks(planId: number) {
  return client.get<any, { code: number; data: ExportTaskInfo[] }>(
    `/export/plan/${planId}/tasks`
  );
}

export function downloadExport(taskId: number) {
  return client.get<any, { code: number; data: { url: string } }>(
    `/export/task/${taskId}/download`
  );
}

export async function fetchPdf(recordId: number): Promise<Blob> {
  const response = await client.get(`/export/pdf/${recordId}`, {
    responseType: 'blob',
  });
  return response as unknown as Blob;
}
