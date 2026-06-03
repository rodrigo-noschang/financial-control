import { prisma } from "@/server/db/prisma";
import type { CategoryInput } from "@/shared/schemas/category.schema";

export const categoryRepository = {
  findAll() {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
    });
  },

  findById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  },

  create(data: CategoryInput) {
    return prisma.category.create({ data });
  },

  update(id: string, data: CategoryInput) {
    return prisma.category.update({
      where: { id },
      data,
    });
  },

  delete(id: string) {
    return prisma.category.delete({ where: { id } });
  },

  countExpenses(id: string) {
    return prisma.expense.count({
      where: { categoryId: id },
    });
  },
};
