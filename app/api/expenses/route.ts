import { expenseService } from "@/server/services/expense.service";
import { handleApiError, ok } from "@/server/utils/api-response";
import { expensePayloadSchema, listExpensesQuerySchema } from "@/shared/schemas/expense.schema";

export async function GET(request: Request) {
  try {
    const searchParams = Object.fromEntries(new URL(request.url).searchParams.entries());
    const query = listExpensesQuerySchema.parse(searchParams);
    return ok(await expenseService.list(query));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = expensePayloadSchema.parse(await request.json());
    await expenseService.create(input);
    return ok({ success: true }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
