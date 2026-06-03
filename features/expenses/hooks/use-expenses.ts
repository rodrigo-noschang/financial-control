"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExpenseInput, ListExpensesQuery } from "@/shared/schemas/expense.schema";
import { expensesApi } from "../api/expenses-api";

export const expenseKeys = {
  all: ["expenses"] as const,
  list: (params: Partial<ListExpensesQuery>) => [...expenseKeys.all, params] as const,
};

export function useExpenses(params: Partial<ListExpensesQuery>) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => expensesApi.list(params),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ExpenseInput) => expensesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExpenseInput }) => expensesApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}
