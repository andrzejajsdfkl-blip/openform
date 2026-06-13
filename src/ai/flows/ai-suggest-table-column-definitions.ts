'use server';
/**
 * @fileOverview This file implements a Genkit flow to suggest relevant technical column definitions
 * for a table field based on its user-provided label.
 *
 * - aiSuggestTableColumnDefinitions - The main function to call the Genkit flow.
 * - AiSuggestTableColumnDefinitionsInput - The input type for the flow.
 * - AiSuggestTableColumnDefinitionsOutput - The output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ColumnTypeEnum = z.enum(['text', 'date', 'int', 'decimal', 'bool']);

const ColumnKeyEnum = z.enum([
  'text_1',
  'text_2',
  'date_1',
  'date_2',
  'int_1',
  'int_2',
  'int_3',
  'decimal_1',
  'decimal_2',
  'decimal_3',
  'bool_1',
  'bool_2',
]);

const ColumnDefinitionSchema = z.object({
  key: ColumnKeyEnum.describe('The technical key of the column, e.g., text_1.'),
  type: ColumnTypeEnum.describe(
    'The data type of the column, derived from its key, e.g., text, int, decimal, date, bool.'
  ),
  label: z
    .string()
    .describe('The user-friendly label for the column, e.g., "Product Name".'),
  order: z.number().int().positive().describe('The display order of the column.'),
  required: z
    .boolean()
    .describe('Whether the column is required for data entry.'),
  default_value: z
    .any()
    .optional()
    .describe('An optional default value for the column.'),
  placeholder: z
    .string()
    .optional()
    .describe('An optional placeholder text for the input field.'),
  description: z
    .string()
    .optional()
    .describe('An optional description or help text for the column.'),
});
export type ColumnDefinition = z.infer<typeof ColumnDefinitionSchema>;

const AiSuggestTableColumnDefinitionsInputSchema = z.object({
  tableLabel: z
    .string()
    .describe(
      'The user-defined label for the table field (e.g., "Line Items", "Attendees", "Tasks").'
    ),
});
export type AiSuggestTableColumnDefinitionsInput = z.infer<
  typeof AiSuggestTableColumnDefinitionsInputSchema
>;

const AiSuggestTableColumnDefinitionsOutputSchema = z
  .array(ColumnDefinitionSchema)
  .describe('A list of suggested column configurations for the table.');
export type AiSuggestTableColumnDefinitionsOutput = z.infer<
  typeof AiSuggestTableColumnDefinitionsOutputSchema
>;

const suggestTableColumnDefinitionsPrompt = ai.definePrompt({
  name: 'suggestTableColumnDefinitionsPrompt',
  input: {schema: AiSuggestTableColumnDefinitionsInputSchema},
  output: {schema: AiSuggestTableColumnDefinitionsOutputSchema},
  prompt: `You are an expert in document structure and data modeling. Your task is to suggest a list of column configurations for a table field, given its user-defined label.

The goal is to provide logical and relevant columns that would typically be found in a table described by the given label.

Here are the available technical column keys and their corresponding types:
- text_1 (type: "text")
- text_2 (type: "text")
- date_1 (type: "date")
- date_2 (type: "date")
- int_1 (type: "int")
- int_2 (type: "int")
- int_3 (type: "int")
- decimal_1 (type: "decimal")
- decimal_2 (type: "decimal")
- decimal_3 (type: "decimal")
- bool_1 (type: "bool")
- bool_2 (type: "bool")

For each suggested column, you must provide:
- "key": One of the technical keys from the list above.
- "type": The correct type corresponding to the chosen key.
- "label": A user-friendly, descriptive label for the column.
- "order": A unique positive integer indicating the display order.
- "required": A boolean value (true/false) indicating if the column is mandatory.
- "default_value": An optional default value appropriate for the type.
- "placeholder": An optional placeholder text.
- "description": An optional description or help text.

Suggest between 3 and 6 relevant columns. Ensure default_value is appropriate for the field type (e.g., an empty string for text, 0 for int/decimal, false for bool, or null).

Table Label: "{{{tableLabel}}}"

Please provide your suggestions as a JSON array of objects, strictly following the output schema.`,
});

const aiSuggestTableColumnDefinitionsFlow = ai.defineFlow(
  {
    name: 'aiSuggestTableColumnDefinitionsFlow',
    inputSchema: AiSuggestTableColumnDefinitionsInputSchema,
    outputSchema: AiSuggestTableColumnDefinitionsOutputSchema,
  },
  async input => {
    const {output} = await suggestTableColumnDefinitionsPrompt(input);
    return output!;
  }
);

export async function aiSuggestTableColumnDefinitions(
  input: AiSuggestTableColumnDefinitionsInput
): Promise<AiSuggestTableColumnDefinitionsOutput> {
  return aiSuggestTableColumnDefinitionsFlow(input);
}
