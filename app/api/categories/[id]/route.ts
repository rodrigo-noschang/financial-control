import { categoryService } from "@/server/services/category.service";
import { handleApiError, ok } from "@/server/utils/api-response";
import { categoryParamsSchema, categoryPayloadSchema } from "@/shared/schemas/category.schema";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: Context) {
  try {
    const params = categoryParamsSchema.parse(await context.params);
    const input = categoryPayloadSchema.parse(await request.json());
    return ok(await categoryService.update(params.id, input));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const params = categoryParamsSchema.parse(await context.params);
    await categoryService.delete(params.id);
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
