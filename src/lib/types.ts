export type FieldType = 'text' | 'date' | 'int' | 'decimal' | 'bool' | 'select';

export interface FieldConfig {
  key: string;
  type: FieldType;
  enabled: boolean;
  label: string;
  order: number;
  required: boolean;
  default_value: any;
  placeholder?: string;
  description?: string;
  display_on_list?: boolean;
  value?: any; // Used in document instance
}

export interface ColumnConfig {
  key: string;
  type: Omit<FieldType, 'select'>; // Simplified for tables as per requirements
  enabled: boolean;
  label: string;
  order: number;
  required: boolean;
  default_value: any;
}

export interface TableConfig {
  key: string;
  label: string;
  enabled: boolean;
  order: number;
  columns: ColumnConfig[];
  rows?: Record<string, any>[]; // Used in document instance
}

export interface DocumentType {
  id: string;
  label: string;
  allow_file: boolean;
  fields: FieldConfig[];
  tables?: TableConfig[];
}

export interface Attachment {
  included: boolean;
  file_name: string;
  mime_type: string;
  size: number;
  sha256?: string;
  base64: string;
}

export interface DocumentInstance {
  format: "OpenFormFile";
  format_version: "1.0";
  document_id: string;
  created_at: string;
  updated_at: string;
  document_type: {
    id: string;
    label: string;
    allow_file: boolean;
  };
  fields: FieldConfig[];
  tables: TableConfig[];
  attachment?: Attachment;
}

export const TECHNICAL_FIELDS = {
  text: Array.from({ length: 20 }, (_, i) => `text_${i + 1}`),
  date: Array.from({ length: 10 }, (_, i) => `date_${i + 1}`),
  int: Array.from({ length: 10 }, (_, i) => `int_${i + 1}`),
  decimal: Array.from({ length: 10 }, (_, i) => `decimal_${i + 1}`),
  bool: Array.from({ length: 10 }, (_, i) => `bool_${i + 1}`),
  select: Array.from({ length: 10 }, (_, i) => `select_${i + 1}`),
  table: Array.from({ length: 5 }, (_, i) => `table_${i + 1}`),
};

export const TECHNICAL_TABLE_COLUMNS = {
  text: Array.from({ length: 2 }, (_, i) => `text_${i + 1}`),
  date: Array.from({ length: 2 }, (_, i) => `date_${i + 1}`),
  int: Array.from({ length: 3 }, (_, i) => `int_${i + 1}`),
  decimal: Array.from({ length: 3 }, (_, i) => `decimal_${i + 1}`),
  bool: Array.from({ length: 2 }, (_, i) => `bool_${i + 1}`),
};
