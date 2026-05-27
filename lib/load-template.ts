import { TemplateMeta, TemplateData } from '../types';
import { templateUrl } from '../constants/cdn';

export async function loadTemplate(meta: TemplateMeta): Promise<TemplateData> {
  const url = templateUrl(meta.url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load template "${meta.id}": ${response.status}`);
  }
  return response.json() as Promise<TemplateData>;
}

export async function loadCatalog(url: string): Promise<TemplateMeta[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load catalog: ${response.status}`);
  }
  return response.json() as Promise<TemplateMeta[]>;
}
