'use server';
/**
 * @fileOverview This file defines a Genkit flow that analyzes an imported document's configuration
 * and generates a human-readable summary of the proposed new document type. This summary helps
 * users understand and confirm the creation of new document types when importing external documents.
 *
 * - aiAssistDocumentTypeImport - A function that triggers the AI analysis and summary generation.
 * - AiAssistDocumentTypeImportInput - The input type for the aiAssistDocumentTypeImport function.
 * - AiAssistDocumentTypeImportOutput - The return type for the aiAssistDocumentTypeImport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FieldConfigSchema = z.object({
  key: z.string().describe('The technical key of the field (e.g., text_1).'),
  type: z.string().describe('The data type of the field (e.g., text, date, int).'),
  enabled: z.boolean().describe('Whether the field is active in this document type.'),
  label: z.string().describe('The user-visible label for the field.'),
  order: z.number().describe('The display order of the field.'),
  required: z.boolean().describe('Whether the field is required.'),
  default_value: z.any().optional().describe('The default value for the field.'),
  placeholder: z.string().optional().describe('An optional placeholder text.'),
  description: z.string().optional().describe('An optional help description.'),
});

const ColumnConfigSchema = z.object({
  key: z.string().describe('The technical key of the column (e.g., text_1).'),
  type: z.string().describe('The data type of the column (e.g., text, date, int).'),
  enabled: z.boolean().describe('Whether the column is active in this table.'),
  label: z.string().describe('The user-visible label for the column.'),
  order: z.number().describe('The display order of the column.'),
  required: z.boolean().describe('Whether the column is required.'),
  default_value: z.any().optional().describe('The default value for the column.'),
});

const TableConfigSchema = z.object({
  key: z.string().describe('The technical key of the table (e.g., table_1).'),
  label: z.string().describe('The user-visible label for the table.'),
  enabled: z.boolean().describe('Whether the table is active in this document type.'),
  order: z.number().describe('The display order of the table.'),
  columns: z.array(ColumnConfigSchema).describe('Configuration for columns within the table.'),
  rows: z.array(z.record(z.any())).optional().describe('Data rows for the table, if any.'),
});

const DocumentTypeDefinitionSchema = z.object({
  id: z.string().describe('The unique identifier for the document type.'),
  label: z.string().describe('The user-visible name of the document type (e.g., Umowa).'),
  allow_file: z.boolean().describe('Whether this document type can have an attached file.'),
});

export const AiAssistDocumentTypeImportInputSchema = z.object({
  documentType: DocumentTypeDefinitionSchema.describe('Definition of the document type.'),
  fields: z.array(FieldConfigSchema).describe('List of field configurations for the document type.'),
  tables: z.array(TableConfigSchema).optional().describe('List of table configurations for the document type.'),
});

export type AiAssistDocumentTypeImportInput = z.infer<typeof AiAssistDocumentTypeImportInputSchema>;

export const AiAssistDocumentTypeImportOutputSchema = z.object({
  summary: z.string().describe('A human-readable summary of the proposed document type.'),
});

export type AiAssistDocumentTypeImportOutput = z.infer<typeof AiAssistDocumentTypeImportOutputSchema>;

export async function aiAssistDocumentTypeImport(
  input: AiAssistDocumentTypeImportInput
): Promise<AiAssistDocumentTypeImportOutput> {
  return aiAssistDocumentTypeImportFlow(input);
}

const aiAssistDocumentTypeImportPrompt = ai.definePrompt({
  name: 'aiAssistDocumentTypeImportPrompt',
  input: { schema: AiAssistDocumentTypeImportInputSchema },
  output: { schema: AiAssistDocumentTypeImportOutputSchema },
  prompt: `You are an AI assistant specialized in summarizing document type configurations. Your goal is to provide a clear, human-readable summary of a proposed new document type based on its configuration, which will be used to ask a user if they want to create this new document type.

The document type is named '{{{documentType.label}}}' (ID: {{{documentType.id}}}).
{{#if documentType.allow_file}}It allows file attachments.{{else}}It does not allow file attachments.{{/if}}

Here are the active fields configured for this document type:
{{#each fields}}
{{#if enabled}}
- Key: {{{key}}}, Label: '{{{label}}}', Type: {{{type}}}{{#if required}}, (Required){{/if}}
{{/if}}
{{/each}}

{{#if tables}}
Here are the active table configurations for this document type:
{{#each tables}}
{{#if enabled}}
- Table: '{{{label}}}' (Key: {{{key}}})
  Columns:
  {{#each columns}}
  {{#if enabled}}
  - Key: {{{key}}}, Label: '{{{label}}}', Type: {{{type}}}{{#if required}}, (Required){{/if}}
  {{/if}}
  {{/each}}
{{/if}}
{{/each}}
{{/if}}

Please provide a concise summary of this document type, highlighting its name, file attachment capability, and the purpose of its main fields and tables. Make it easy for a user to understand what this document type represents. For example, if it's a contract, mention key fields like 'Date signed' and 'Contractor'.`,
});

const aiAssistDocumentTypeImportFlow = ai.defineFlow(
  {
    name: 'aiAssistDocumentTypeImportFlow',
    inputSchema: AiAssistDocumentTypeImportInputSchema,
    outputSchema: AiAssistDocumentTypeImportOutputSchema,
  },
  async (input) => {
    const { output } = await aiAssistDocumentTypeImportPrompt(input);
    if (!output) {
      throw new Error('Failed to generate document type summary.');
    }
    return output;
  }
);
