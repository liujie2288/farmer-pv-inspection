import client from './client';

export function listMyRecords(params?: { page?: number; size?: number }) {
  return client.get<any, { code: number; data: { records: any[]; total: number } }>('/inspections', {
    params: { inverterId: 0, ...params },
  });
}

export function getRecordDetail(id: number) {
  return client.get<any, { code: number; data: any }>(`/inspections/${id}`);
}
