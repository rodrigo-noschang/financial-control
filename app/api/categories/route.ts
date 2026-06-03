import { categoryService } from "@/server/services/category.service";
import { handleApiError, ok } from "@/server/utils/api-response";
import { categoryPayloadSchema } from "@/shared/schemas/category.schema";

export async function GET() {
  try {
    return ok(await categoryService.list());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = categoryPayloadSchema.parse(await request.json());
    return ok(await categoryService.create(input), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
