export type CategoryDto = {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseDto = {
  id: string;
  description: string;
  amount: number;
  paidAt: string;
  isEssential: boolean;
  isRecurring: boolean;
  categoryId: string;
  category: Pick<CategoryDto, "id" | "name" | "color">;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseSummaryDto = {
  total: number;
  essential: number;
  recurring: number;
};

export type PaginatedExpensesDto = {
  data: ExpenseDto[];
  summary: ExpenseSummaryDto;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  period: {
    startDate: string;
    endDate: string;
  };
};
