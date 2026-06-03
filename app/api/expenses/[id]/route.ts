import { expenseService } from "@/server/services/expense.service";
import { handleApiError, ok } from "@/server/utils/api-response";
import { expenseParamsSchema, expensePayloadSchema } from "@/shared/schemas/expense.schema";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: Context) {
  try {
    const params = expenseParamsSchema.parse(await context.params);
    const input = expensePayloadSchema.parse(await request.json());
    await expenseService.update(params.id, input);
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const params = expenseParamsSchema.parse(await context.params);
    await expenseService.delete(params.id);
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
