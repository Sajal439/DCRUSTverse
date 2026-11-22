import type { CampusRole } from './index';

export type RecordData = Record<string, unknown>;
export type Field = {
  key: string;
  label: string;
  kind?: 'file' | 'text' | 'multiline' | 'number' | 'boolean' | 'datetime' | 'select' | 'reference' | 'list';
  required?: boolean;
  min?: number;
  max?: number;
  scale?: number;
  options?: string[];
  source?: string;
  hint?: string;
};
export type Operation = {
  label: string;
  path: string;
  method?: 'POST' | 'PATCH' | 'DELETE' | 'GET';
  fields?: Field[];
  roles?: CampusRole[];
  body?: RecordData;
};
export type Resource = {
  key: string;
  title: string;
  description: string;
  group: string;
  path: string;
  roles?: CampusRole[];
  filters?: Field[];
  columns: string[];
  create?: Operation;
  actions?: Operation[];
  children?: { label: string; resource: Resource }[];
};
