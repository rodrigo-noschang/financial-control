import { apiRequest } from "@/lib/api-client";
import type { ExpenseInput, ListExpensesQuery } from "@/shared/schemas/expense.schema";
import type { PaginatedExpensesDto } from "@/shared/types/finance";

function toSearchParams(params: Partial<ListExpensesQuery>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
}

export const expensesApi = {
  list(params: Partial<ListExpensesQuery>) {
    const query = toSearchParams(params);
    return apiRequest<PaginatedExpensesDto>(`/api/expenses${query ? `?${query}` : ""}`);
  },

  create(input: ExpenseInput) {
    return apiRequest<{ success: true }>("/api/expenses", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  update(id: string, input: ExpenseInput) {
    return apiRequest<{ success: true }>(`/api/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  delete(id: string) {
    return apiRequest<{ success: true }>(`/api/expenses/${id}`, {
      method: "DELETE",
    });
  },
};
