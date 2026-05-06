import client from './client';

export function getRecordDetail(id: number) {
  return client.get<any, { code: number; data: any }>(`/records/${id}`);
}
