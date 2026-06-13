'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting a document type schema
 * based on a given document name. It leverages AI to propose technical fields,
 * their labels, required status, and display order, enabling rapid document structure setup.
 *
 * - aiSuggestDocumentTypeSchema - The main function to call the AI flow.
 * - DocumentNameInput - The input type for the flow.
 * - DocumentTypeDefinitionOutput - The output type for the flow, representing the suggested document type configuration.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ALL_FIELD_KEYS = [
  ...Array.from({ length: 20 }, (_, i) => `text_${i + 1}`),
  ...Array.from({ length: 10 }, (_, i) => `date_${i + 1}`),
  ...Array.from({ length: 10 }, (_, i) => `int_${i + 1}`),
  ...Array.from({ length: 10 }, (_, i) => `decimal_${i + 1}`),
  ...Array.from({ length: 10 }, (_, i) => `bool_${i + 1}`),
  ...Array.from({ length: 10 }, (_, i) => `select_${i + 1}`),
];

const ALL_TABLE_KEYS = Array.from({ length: 5 }, (_, i) => `table_${i + 1}`);

const ALL_TABLE_COLUMN_KEYS = [
  ...Array.from({ length: 2 }, (_, i) => `text_${i + 1}`),
  ...Array.from({ length: 2 }, (_, i) => `date_${i + 1}`),
  ...Array.from({ length: 3 }, (_, i) => `int_${i + 1}`),
  ...Array.from({ length: 3 }, (_, i) => `decimal_${i + 1}`),
  ...Array.from({ length: 2 }, (_, i) => `bool_${i + 1}`),
];

// Utility function to determine type from key
function getTypeFromKey(key: string): string {
  if (key.startsWith('text')) return 'text';
  if (key.startsWith('date')) return 'date';
  if (key.startsWith('int')) return 'int';
  if (key.startsWith('decimal')) return 'decimal';
  if (key.startsWith('bool')) return 'bool';
  if (key.startsWith('select')) return 'select';
  return 'unknown';
}

const DocumentNameInputSchema = z.object({
  name: z.string().describe('The name of the document type (e.g., "Invoice", "Contract").'),
});
export type DocumentNameInput = z.infer<typeof DocumentNameInputSchema>;

const FieldConfigSchema = z.object({
  key: z.enum(ALL_FIELD_KEYS as [string, ...string[]]).describe('The technical key of the field.'),
  type: z.string().describe('The data type of the field (e.g., text, date, int, decimal, bool, select).'), // Derived from key
  enabled: z.boolean().describe('Whether the field is active in this document type.').default(true),
  label: z.string().describe('The visible name/label for the field.'),
  order: z.number().int().positive().describe('The display order of the field.').default(1),
  required: z.boolean().describe('Whether the field is mandatory.').default(false),
  default_value: z.any().optional().describe('An optional default value for the field.'),
  placeholder: z.string().optional().describe('An optional placeholder text for the field input.'),
  description: z.string().optional().describe('An optional description or help text for the field.'),
  display_on_list: z.boolean().optional().describe('Whether this field should be displayed on the document list.').default(false),
});

const TableColumnConfigSchema = z.object({
  key: z.enum(ALL_TABLE_COLUMN_KEYS as [string, ...string[]]).describe('The technical key of the table column.'),
  type: z.string().describe('The data type of the table column (e.g., text, date, int, decimal, bool).'), // Derived from key
  enabled: z.boolean().describe('Whether the column is active in this table.').default(true),
  label: z.string().describe('The visible name/label for the table column.'),
  order: z.number().int().positive().describe('The display order of the table column.').default(1),
  required: z.boolean().describe('Whether the table column is mandatory.').default(false),
  default_value: z.any().optional().describe('An optional default value for the table column.'),
});

const TableConfigSchema = z.object({
  key: z.enum(ALL_TABLE_KEYS as [string, ...string[]]).describe('The technical key of the table.'),
  enabled: z.boolean().describe('Whether the table is active in this document type.').default(true),
  label: z.string().describe('The visible name/label for the table.').default('Table'),
  order: z.number().int().positive().describe('The display order of the table.').default(1),
  columns: z.array(TableColumnConfigSchema).describe('The configuration for columns within the table.'),
});

const DocumentTypeDefinitionOutputSchema = z.object({
  id: z.string().describe('A unique identifier for the document type (e.g., "invoice", "contract").'),
  label: z.string().describe('The human-readable name of the document type (e.g., "Invoice", "Contract").'),
  allow_file: z.boolean().describe('Whether documents of this type can have an attached file.').default(false),
  fields: z.array(FieldConfigSchema).describe('A list of configured fields for this document type.'),
  tables: z.array(TableConfigSchema).describe('A list of configured tables for this document type.').optional(),
});
export type DocumentTypeDefinitionOutput = z.infer<typeof DocumentTypeDefinitionOutputSchema>;

export async function aiSuggestDocumentTypeSchema(input: DocumentNameInput): Promise<DocumentTypeDefinitionOutput> {
  return suggestDocumentTypeSchemaFlow(input);
}

const suggestDocumentTypeSchemaPrompt = ai.definePrompt({
  name: 'suggestDocumentTypeSchemaPrompt',
  input: { schema: DocumentNameInputSchema },
  output: { schema: DocumentTypeDefinitionOutputSchema },
  prompt: `You are an AI assistant that helps define document type schemas for a system called OpenForm Studio.

Your task is to propose a comprehensive initial configuration for a document type based on its name. You need to select relevant technical fields and tables from a predefined list, assign meaningful labels, set required status, and determine their display order.

Here are the available technical fields and their types:
- text_1 to text_20 (type: text)
- date_1 to date_10 (type: date)
- int_1 to int_10 (type: int)
- decimal_1 to decimal_10 (type: decimal)
- bool_1 to bool_10 (type: bool)
- select_1 to select_10 (type: select)

Here are the available technical table keys:
- table_1 to table_5

For each table, you can define columns using these technical keys and their types:
- text_1 to text_2 (type: text)
- date_1 to date_2 (type: date)
- int_1 to int_3 (type: int)
- decimal_1 to decimal_3 (type: decimal)
- bool_1 to bool_2 (type: bool)

Based on the user-provided document name, generate a JSON object representing the document type definition. Only include fields and tables that are logically relevant for the document type.

For each field:
- 'key': Use one of the available technical field keys.
- 'type': Automatically determined from the 'key' (e.g., 'text_1' is 'text').
- 'enabled': Set to 'true' if the field is relevant, 'false' otherwise (though you should only include enabled fields).
- 'label': Provide a clear, human-readable name for the field.
- 'order': Assign a unique positive integer to determine its display order. Start from 1 and increment.
- 'required': Set to 'true' if the field is essential for this document type, 'false' otherwise.
- 'default_value', 'placeholder', 'description': Set if a logical default value, placeholder or description comes to mind for the field, otherwise omit.
- 'display_on_list': Set to 'true' for the 1-3 most important fields that would identify the document in a list, 'false' otherwise.

For each table:
- 'key': Use one of the available technical table keys.
- 'enabled': Set to 'true' if the table is relevant.
- 'label': Provide a clear, human-readable name for the table (e.g., 'Items', 'Products').
- 'order': Assign a unique positive integer to determine its display order.
- 'columns': Define the relevant columns for the table, following the same rules for fields regarding 'key', 'type', 'enabled', 'label', 'order', 'required', 'default_value'.

For the document type itself:
- 'id': A kebab-case version of the document name.
- 'label': The human-readable name (e.g., "Invoice").
- 'allow_file': Determine if this document type typically allows attachments (e.g., PDF, image) and set to 'true' or 'false'.

Document Name: {{{name}}}`,
});

const suggestDocumentTypeSchemaFlow = ai.defineFlow(
  {
    name: 'aiSuggestDocumentTypeSchemaFlow',
    inputSchema: DocumentNameInputSchema,
    outputSchema: DocumentTypeDefinitionOutputSchema,
  },
  async (input) => {
    const { output } = await suggestDocumentTypeSchemaPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate document type schema.');
    }

    // Post-processing to ensure 'type' is correctly set based on 'key' and 'id' is kebab-case.
    const processedOutput = { ...output };

    processedOutput.id = input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    processedOutput.label = input.name;

    processedOutput.fields = processedOutput.fields.map(field => ({
      ...field,
      type: getTypeFromKey(field.key),
    }));

    if (processedOutput.tables) {
      processedOutput.tables = processedOutput.tables.map(table => ({
        ...table,
        columns: table.columns.map(column => ({
          ...column,
          type: getTypeFromKey(column.key),
        })),
      }));
    }

    return processedOutput;
  }
);
