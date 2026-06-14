/**
 * Core type definitions for OpenForm document management system
 * Defines structure for documents, fields, types, and attachments
 */

/** Supported field types for document schema */
export type FieldType = 'text' | 'date' | 'int' | 'decimal' | 'bool' | 'select';

/** Display options for fields in list views */
export type DisplayOption = 'always' | 'never' | 'mobile-hidden';

/**
 * Field configuration for document schema
 * Defines structure, validation, and display rules for a single field
 */
export interface FieldConfig {
  /** Unique identifier for the field */
  key: string;
  /** Data type of the field */
  type: FieldType;
  /** Whether field is active in schema */
  enabled: boolean;
  /** Display label for UI */
  label: string;
  /** Order in which field appears */
  order: number;
  /** Whether field is mandatory */
  required: boolean;
  /** Default value if not provided */
  default_value: unknown;
  /** Placeholder text for input fields */
  placeholder?: string;
  /** Help text describing the field */
  description?: string;
  /** Whether to display field in list views */
  display_on_list?: boolean;
  /** Current value in document instance */
  value?: unknown;
  /** Available options for select type fields */
  options?: string[];
  /** Minimum value for numeric fields */
  min?: number;
  /** Maximum value for numeric fields */
  max?: number;
  /** Regular expression pattern for validation */
  pattern?: string;
}

/**
 * Column configuration for table columns within documents
 * Simplified schema without select type for table representation
 */
export interface ColumnConfig {
  /** Unique identifier for the column */
  key: string;
  /** Data type of the column (excludes select) */
  type: Exclude<FieldType, 'select'>;
  /** Whether column is active */
  enabled: boolean;
  /** Display label */
  label: string;
  /** Display order */
  order: number;
  /** Whether column requires data */
  required: boolean;
  /** Default value for new rows */
  default_value: unknown;
}

/**
 * Table configuration for structured data within documents
 * Supports multiple columns and rows of data
 */
export interface TableConfig {
  /** Unique identifier for the table */
  key: string;
  /** Display label */
  label: string;
  /** Whether table is active in schema */
  enabled: boolean;
  /** Display order */
  order: number;
  /** Column definitions */
  columns: ColumnConfig[];
  /** Row data in document instance */
  rows?: Record<string, unknown>[];
  /** Maximum number of rows allowed */
  maxRows?: number;
}

/**
 * Document type definition
 * Serves as template/schema for creating document instances
 */
export interface DocumentType {
  /** Unique identifier */
  id: string;
  /** Display name */
  label: string;
  /** Whether documents of this type can have file attachments */
  allow_file: boolean;
  /** Field definitions */
  fields: FieldConfig[];
  /** Table definitions */
  tables?: TableConfig[];
  /** Optional description of the document type */
  description?: string;
  /** Version number for schema evolution */
  version?: number;
}

/**
 * File attachment information
 * Base64 encoded with metadata for storage
 */
export interface Attachment {
  /** Whether file is included/attached */
  included: boolean;
  /** Original filename */
  file_name: string;
  /** MIME type */
  mime_type: string;
  /** File size in bytes */
  size: number;
  /** SHA256 hash for integrity verification */
  sha256?: string;
  /** Base64 encoded file data */
  base64: string;
}

/**
 * Document instance
 * Complete document with values following DocumentType schema
 */
export interface DocumentInstance {
  /** File format identifier */
  format: 'OpenFormFile';
  /** Format version for compatibility */
  format_version: '1.0';
  /** Unique document identifier */
  document_id: string;
  /** ISO 8601 creation timestamp */
  created_at: string;
  /** ISO 8601 last update timestamp */
  updated_at: string;
  /** Reference to document type */
  document_type: {
    id: string;
    label: string;
    allow_file: boolean;
  };
  /** Field values following schema */
  fields: FieldConfig[];
  /** Table data following schema */
  tables: TableConfig[];
  /** Optional file attachment */
  attachment?: Attachment;
  /** Optional metadata for tracking */
  metadata?: {
    author?: string;
    tags?: string[];
    status?: 'draft' | 'submitted' | 'archived';
  };
}

/**
 * Maximum available fields by type for schema generation
 * Used for constraint checking and UI limits
 */
export const TECHNICAL_FIELDS = {
  text: Array.from({ length: 20 }, (_, i) => `text_${i + 1}`),
  date: Array.from({ length: 10 }, (_, i) => `date_${i + 1}`),
  int: Array.from({ length: 10 }, (_, i) => `int_${i + 1}`),
  decimal: Array.from({ length: 10 }, (_, i) => `decimal_${i + 1}`),
  bool: Array.from({ length: 10 }, (_, i) => `bool_${i + 1}`),
  select: Array.from({ length: 10 }, (_, i) => `select_${i + 1}`),
  table: Array.from({ length: 5 }, (_, i) => `table_${i + 1}`),
} as const;

/**
 * Maximum available columns per table by type
 * Used for constraint checking and UI limits
 */
export const TECHNICAL_TABLE_COLUMNS = {
  text: Array.from({ length: 2 }, (_, i) => `text_${i + 1}`),
  date: Array.from({ length: 2 }, (_, i) => `date_${i + 1}`),
  int: Array.from({ length: 3 }, (_, i) => `int_${i + 1}`),
  decimal: Array.from({ length: 3 }, (_, i) => `decimal_${i + 1}`),
  bool: Array.from({ length: 2 }, (_, i) => `bool_${i + 1}`),
} as const;
