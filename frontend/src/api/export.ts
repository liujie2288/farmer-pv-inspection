import client from './client';

export interface ExportTaskFile {
  batchNo: number;
  ossKey: string;
  fileName: string;
  fileSize: number;
}

export interface ExportTask {
  id: number;
  type: string;
  status: number;
  planId: number;
  projectId: number;
  projectName: string;
  totalCount: number | null;
  failReason: string | null;
  operatorName: string | null;
  finishTime: string | null;
  createTime: string;
  files: ExportTaskFile[] | null;
}

export function createExportTasks(planId: number, projectIds: number[], type: string = 'photo') {
  return client.post<any, { code: number; data: ExportTask[] }>(`/inspect/export/tasks?planId=${planId}&type=${type}`, projectIds);
}

export function getExportTasks(planId: number) {
  return client.get<any, { code: number; data: ExportTask[] }>(`/inspect/export/tasks`, { params: { planId } });
}

export function getExportDownloadUrl(taskId: number, batchNo: number) {
  return client.get<any, { code: number; data: string }>(`/inspect/export/tasks/${taskId}/download`, { params: { batchNo } });
}
