import { z } from "zod";
import { paginationSchema, uuidSchema } from "./common.schema";

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data valida.");

const descriptionSchema = z
  .string()
  .trim()
  .max(120)
  .nullish()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || value.length >= 2, "Informe pelo menos 2 caracteres.");

export const expensePayloadSchema = z.object({
  description: descriptionSchema,
  amount: z.coerce.number().positive("Informe um valor maior que zero."),
  paidAt: dateOnlySchema,
  isEssential: z.coerce.boolean().default(false),
  isRecurring: z.coerce.boolean().default(false),
  categoryId: uuidSchema,
});

export const expenseParamsSchema = z.object({
  id: uuidSchema,
});

export const listExpensesQuerySchema = paginationSchema.extend({
  startDate: dateOnlySchema.optional(),
  endDate: dateOnlySchema.optional(),
  categoryId: uuidSchema.optional(),
  essential: z.enum(["true", "false"]).optional(),
  recurring: z.enum(["true", "false"]).optional(),
});

export type ExpensePayload = z.input<typeof expensePayloadSchema>;
export type ExpenseInput = z.output<typeof expensePayloadSchema>;
export type ListExpensesQuery = z.output<typeof listExpensesQuerySchema>;
