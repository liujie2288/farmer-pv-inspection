import client from './client';

export interface SectionItem {
  id: number;
  sectionId: number;
  category: string | null;
  itemNo: number;
  content: string;
  itemType: number;
}

export interface Section {
  id: number;
  sectionNo: number;
  sectionName: string;
  items: SectionItem[];
}

export function getSectionTree() {
  return client.get<any, { code: number; data: Section[] }>('/sections');
}

export function getProjectSections(projectId: number) {
  return client.get<any, { code: number; data: Section[] }>(`/projects/${projectId}/sections`);
}
