import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import type { ExpenseInput, ListExpensesQuery } from "@/shared/schemas/expense.schema";
import { getCurrentMonthPeriod, parseDateOnly } from "@/server/utils/date";

function buildWhere(query: ListExpensesQuery): Prisma.ExpenseWhereInput {
  const defaultPeriod = getCurrentMonthPeriod();
  const startDate = query.startDate ?? defaultPeriod.startDate;
  const endDate = query.endDate ?? defaultPeriod.endDate;

  return {
    paidAt: {
      gte: parseDateOnly(startDate),
      lte: parseDateOnly(endDate),
    },
    categoryId: query.categoryId,
    isEssential: query.essential === undefined ? undefined : query.essential === "true",
    isRecurring: query.recurring === undefined ? undefined : query.recurring === "true",
  };
}

export const expenseRepository = {
  getPeriod(query: ListExpensesQuery) {
    const defaultPeriod = getCurrentMonthPeriod();

    return {
      startDate: query.startDate ?? defaultPeriod.startDate,
      endDate: query.endDate ?? defaultPeriod.endDate,
    };
  },

  async findPaginated(query: ListExpensesQuery) {
    const where = buildWhere(query);
    const skip = (query.page - 1) * query.pageSize;

    const [data, totalItems] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
        orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: query.pageSize,
      }),
      prisma.expense.count({ where }),
    ]);

    return { data, totalItems };
  },

  async summarize(query: ListExpensesQuery) {
    const where = buildWhere(query);
    const [total, essential, recurring] = await Promise.all([
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, isEssential: true }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, isRecurring: true }, _sum: { amount: true } }),
    ]);

    return {
      total: Number(total._sum.amount ?? 0),
      essential: Number(essential._sum.amount ?? 0),
      recurring: Number(recurring._sum.amount ?? 0),
    };
  },

  create(data: ExpenseInput) {
    return prisma.expense.create({
      data: {
        ...data,
        paidAt: parseDateOnly(data.paidAt),
      },
    });
  },

  update(id: string, data: ExpenseInput) {
    return prisma.expense.update({
      where: { id },
      data: {
        ...data,
        paidAt: parseDateOnly(data.paidAt),
      },
    });
  },

  delete(id: string) {
    return prisma.expense.delete({ where: { id } });
  },
};
