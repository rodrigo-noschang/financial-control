import { apiRequest } from "@/lib/api-client";
import type { CategoryInput } from "@/shared/schemas/category.schema";
import type { CategoryDto } from "@/shared/types/finance";

export const categoriesApi = {
  list() {
    return apiRequest<CategoryDto[]>("/api/categories");
  },

  create(input: CategoryInput) {
    return apiRequest<CategoryDto>("/api/categories", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  update(id: string, input: CategoryInput) {
    return apiRequest<CategoryDto>(`/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  delete(id: string) {
    return apiRequest<{ success: true }>(`/api/categories/${id}`, {
      method: "DELETE",
    });
  },
};
