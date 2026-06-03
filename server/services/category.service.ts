import { Prisma } from "@/generated/prisma/client";
import { categoryRepository } from "@/server/repositories/category.repository";
import { AppError } from "@/server/utils/api-response";
import type { CategoryInput } from "@/shared/schemas/category.schema";
import type { CategoryDto } from "@/shared/types/finance";

function toCategoryDto(category: Awaited<ReturnType<typeof categoryRepository.findAll>>[number]): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

function normalizeUniqueError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new AppError("Ja existe uma categoria com esse nome.", 409);
  }

  throw error;
}

export const categoryService = {
  async list(): Promise<CategoryDto[]> {
    const categories = await categoryRepository.findAll();
    return categories.map(toCategoryDto);
  },

  async create(input: CategoryInput): Promise<CategoryDto> {
    try {
      return toCategoryDto(await categoryRepository.create(input));
    } catch (error) {
      normalizeUniqueError(error);
    }
  },

  async update(id: string, input: CategoryInput): Promise<CategoryDto> {
    try {
      return toCategoryDto(await categoryRepository.update(id, input));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError("Categoria nao encontrada.", 404);
      }

      normalizeUniqueError(error);
    }
  },

  async delete(id: string) {
    const linkedExpenses = await categoryRepository.countExpenses(id);

    if (linkedExpenses > 0) {
      throw new AppError("Nao e possivel deletar uma categoria com despesas associadas.", 409);
    }

    try {
      await categoryRepository.delete(id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError("Categoria nao encontrada.", 404);
      }

      throw error;
    }
  },
};
