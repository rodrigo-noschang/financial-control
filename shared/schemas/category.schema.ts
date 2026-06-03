import { z } from "zod";
import { paginationSchema, uuidSchema } from "./common.schema";

export const categoryColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Informe uma cor hexadecimal valida.")
  .optional()
  .or(z.literal(""));

export const categoryPayloadSchema = z.object({
  name: z.string().trim().min(2, "Informe pelo menos 2 caracteres.").max(80),
  color: categoryColorSchema.transform((value) => value || undefined),
});

export const categoryParamsSchema = z.object({
  id: uuidSchema,
});

export const listCategoriesQuerySchema = paginationSchema.partial().optional();

export type CategoryPayload = z.input<typeof categoryPayloadSchema>;
export type CategoryInput = z.output<typeof categoryPayloadSchema>;
