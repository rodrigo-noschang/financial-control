import { Prisma } from "@/generated/prisma/client";
import { expenseRepository } from "@/server/repositories/expense.repository";
import { AppError } from "@/server/utils/api-response";
import { toDateOnly } from "@/server/utils/date";
import type { ExpenseInput, ListExpensesQuery } from "@/shared/schemas/expense.schema";
import type { ExpenseDto, PaginatedExpensesDto } from "@/shared/types/finance";

type ExpenseRecord = Awaited<ReturnType<typeof expenseRepository.findPaginated>>["data"][number];

function toExpenseDto(expense: ExpenseRecord): ExpenseDto {
  return {
    id: expense.id,
    description: expense.description,
    amount: Number(expense.amount),
    paidAt: toDateOnly(expense.paidAt),
    isEssential: expense.isEssential,
    isRecurring: expense.isRecurring,
    categoryId: expense.categoryId,
    category: expense.category,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}

function handlePrismaWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      throw new AppError("Categoria informada nao existe.", 422);
    }

    if (error.code === "P2025") {
      throw new AppError("Despesa nao encontrada.", 404);
    }
  }

  throw error;
}

export const expenseService = {
  async list(query: ListExpensesQuery): Promise<PaginatedExpensesDto> {
    const [{ data, totalItems }, summary] = await Promise.all([
      expenseRepository.findPaginated(query),
      expenseRepository.summarize(query),
    ]);

    return {
      data: data.map(toExpenseDto),
      summary,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / query.pageSize)),
      },
      period: expenseRepository.getPeriod(query),
    };
  },

  async create(input: ExpenseInput) {
    try {
      return await expenseRepository.create(input);
    } catch (error) {
      handlePrismaWriteError(error);
    }
  },

  async update(id: string, input: ExpenseInput) {
    try {
      return await expenseRepository.update(id, input);
    } catch (error) {
      handlePrismaWriteError(error);
    }
  },

  async delete(id: string) {
    try {
      await expenseRepository.delete(id);
    } catch (error) {
      handlePrismaWriteError(error);
    }
  },
};
