"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api-client";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/features/categories/hooks/use-categories";
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
} from "@/features/expenses/hooks/use-expenses";
import { categoryPayloadSchema, type CategoryInput, type CategoryPayload } from "@/shared/schemas/category.schema";
import { expensePayloadSchema, type ExpenseInput, type ExpensePayload } from "@/shared/schemas/expense.schema";
import type { CategoryDto } from "@/shared/types/finance";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Nao foi possivel concluir a operacao.";
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "total" | "essential" | "recurring" }) {
  const toneClass = {
    total: "border-slate-300 bg-slate-950 text-white",
    essential: "border-emerald-200 bg-emerald-50 text-emerald-950",
    recurring: "border-amber-200 bg-amber-50 text-amber-950",
  }[tone];

  return (
    <section className={`rounded-lg border p-5 ${toneClass}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <strong className="mt-3 block text-3xl font-semibold tracking-normal">
        {currencyFormatter.format(value)}
      </strong>
    </section>
  );
}

function CategoryManager({ categories }: { categories: CategoryDto[] }) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<CategoryPayload, unknown, CategoryInput>({
    resolver: zodResolver(categoryPayloadSchema),
    defaultValues: {
      name: "",
      color: "#2563eb",
    },
  });

  const editForm = useForm<CategoryPayload, unknown, CategoryInput>({
    resolver: zodResolver(categoryPayloadSchema),
    defaultValues: {
      name: "",
      color: "#2563eb",
    },
  });

  function startEditing(category: CategoryDto) {
    setEditingId(category.id);
    editForm.reset({
      name: category.name,
      color: category.color ?? "#2563eb",
    });
  }

  async function submitCategory(input: CategoryInput) {
    await createCategory.mutateAsync(input);
    form.reset({ name: "", color: "#2563eb" });
  }

  async function submitCategoryUpdate(input: CategoryInput) {
    if (!editingId) return;

    await updateCategory.mutateAsync({ id: editingId, input });
    setEditingId(null);
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">Categorias</h2>
          <p className="mt-1 text-sm text-zinc-500">Crie, edite e remova categorias sem despesas vinculadas.</p>
        </div>
      </div>

      <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_72px_auto]" onSubmit={form.handleSubmit(submitCategory)}>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Nome
          <input
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-950"
            placeholder="Mercado"
            {...form.register("name")}
          />
          {form.formState.errors.name ? <span className="text-xs text-red-600">{form.formState.errors.name.message}</span> : null}
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Cor
          <input className="h-10 rounded-md border border-zinc-300 p-1" type="color" {...form.register("color")} />
        </label>
        <button
          className="h-10 self-end rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={createCategory.isPending}
          type="submit"
        >
          Adicionar
        </button>
      </form>
      {createCategory.error ? <p className="mt-3 text-sm text-red-600">{getErrorMessage(createCategory.error)}</p> : null}

      <div className="mt-5 divide-y divide-zinc-100">
        {categories.length === 0 ? (
          <p className="py-4 text-sm text-zinc-500">Nenhuma categoria cadastrada ainda.</p>
        ) : (
          categories.map((category) => (
            <div className="py-3" key={category.id}>
              {editingId === category.id ? (
                <form className="grid gap-3 sm:grid-cols-[1fr_72px_auto_auto]" onSubmit={editForm.handleSubmit(submitCategoryUpdate)}>
                  <input
                    className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-950"
                    {...editForm.register("name")}
                  />
                  <input className="h-10 rounded-md border border-zinc-300 p-1" type="color" {...editForm.register("color")} />
                  <button className="rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white" disabled={updateCategory.isPending} type="submit">
                    Salvar
                  </button>
                  <button className="rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-700" onClick={() => setEditingId(null)} type="button">
                    Cancelar
                  </button>
                </form>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-full border border-zinc-200" style={{ backgroundColor: category.color ?? "#71717a" }} />
                    <span className="font-medium text-zinc-900">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50" onClick={() => startEditing(category)} type="button">
                      Editar
                    </button>
                    <button
                      className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                      disabled={deleteCategory.isPending}
                      onClick={() => deleteCategory.mutate(category.id)}
                      type="button"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {deleteCategory.error ? <p className="mt-3 text-sm text-red-600">{getErrorMessage(deleteCategory.error)}</p> : null}
      {updateCategory.error ? <p className="mt-3 text-sm text-red-600">{getErrorMessage(updateCategory.error)}</p> : null}
    </section>
  );
}

function ExpenseForm({ categories }: { categories: CategoryDto[] }) {
  const createExpense = useCreateExpense();
  const form = useForm<ExpensePayload, unknown, ExpenseInput>({
    resolver: zodResolver(expensePayloadSchema),
    defaultValues: {
      description: "",
      amount: 0,
      paidAt: todayDateOnly(),
      categoryId: "",
      isEssential: false,
      isRecurring: false,
    },
  });

  useEffect(() => {
    if (!form.getValues("categoryId") && categories[0]) {
      form.setValue("categoryId", categories[0].id);
    }
  }, [categories, form]);

  async function submitExpense(input: ExpenseInput) {
    await createExpense.mutateAsync(input);
    form.reset({
      description: "",
      amount: 0,
      paidAt: todayDateOnly(),
      categoryId: categories[0]?.id ?? "",
      isEssential: false,
      isRecurring: false,
    });
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-950">Nova despesa</h2>
      <form className="mt-5 grid gap-4" onSubmit={form.handleSubmit(submitExpense)}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            Descricao
            <input className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-950" placeholder="Conta de luz" {...form.register("description")} />
            {form.formState.errors.description ? <span className="text-xs text-red-600">{form.formState.errors.description.message}</span> : null}
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            Valor
            <input className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-950" min="0" step="0.01" type="number" {...form.register("amount", { valueAsNumber: true })} />
            {form.formState.errors.amount ? <span className="text-xs text-red-600">{form.formState.errors.amount.message}</span> : null}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            Data de pagamento
            <input className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-950" type="date" {...form.register("paidAt")} />
            {form.formState.errors.paidAt ? <span className="text-xs text-red-600">{form.formState.errors.paidAt.message}</span> : null}
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            Categoria
            <select className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-950" disabled={categories.length === 0} {...form.register("categoryId")}>
              <option value="">Selecione</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {form.formState.errors.categoryId ? <span className="text-xs text-red-600">{form.formState.errors.categoryId.message}</span> : null}
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700">
            <input className="h-4 w-4" type="checkbox" {...form.register("isEssential")} />
            Essencial
          </label>
          <label className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700">
            <input className="h-4 w-4" type="checkbox" {...form.register("isRecurring")} />
            Recorrente
          </label>
        </div>

        <button
          className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={createExpense.isPending || categories.length === 0}
          type="submit"
        >
          Cadastrar despesa
        </button>
      </form>
      {categories.length === 0 ? <p className="mt-3 text-sm text-amber-700">Crie uma categoria antes de cadastrar despesas.</p> : null}
      {createExpense.error ? <p className="mt-3 text-sm text-red-600">{getErrorMessage(createExpense.error)}</p> : null}
    </section>
  );
}

export function FinanceDashboard() {
  const [page, setPage] = useState(1);
  const categoriesQuery = useCategories();
  const expensesQuery = useExpenses({ page, pageSize: 25 });
  const deleteExpense = useDeleteExpense();

  const categories = categoriesQuery.data ?? [];
  const expenses = expensesQuery.data?.data ?? [];
  const summary = expensesQuery.data?.summary ?? { total: 0, essential: 0, recurring: 0 };
  const pagination = expensesQuery.data?.pagination;
  const period = expensesQuery.data?.period;

  const subtitle = useMemo(() => {
    if (!period) return "Carregando periodo atual";
    return `${period.startDate} ate ${period.endDate}`;
  }, [period]);

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-zinc-500">Controle financeiro</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">Gastos do mes atual</h1>
            <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm">
            Listagem paginada em 25 despesas
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Total no periodo" tone="total" value={summary.total} />
          <SummaryCard label="Gastos essenciais" tone="essential" value={summary.essential} />
          <SummaryCard label="Gastos recorrentes" tone="recurring" value={summary.recurring} />
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-zinc-100 p-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold text-zinc-950">Ultimos gastos</h2>
                <p className="mt-1 text-sm text-zinc-500">Do mais recente para o mais antigo.</p>
              </div>
              {pagination ? (
                <span className="text-sm text-zinc-500">
                  {pagination.totalItems} despesa{pagination.totalItems === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-normal text-zinc-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Despesa</th>
                    <th className="px-5 py-3 font-semibold">Categoria</th>
                    <th className="px-5 py-3 font-semibold">Data</th>
                    <th className="px-5 py-3 font-semibold">Tipo</th>
                    <th className="px-5 py-3 text-right font-semibold">Valor</th>
                    <th className="px-5 py-3 text-right font-semibold">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {expensesQuery.isLoading ? (
                    <tr>
                      <td className="px-5 py-8 text-center text-zinc-500" colSpan={6}>Carregando despesas...</td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-center text-zinc-500" colSpan={6}>Nenhuma despesa cadastrada no periodo.</td>
                    </tr>
                  ) : (
                    expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="px-5 py-4 font-medium text-zinc-950">{expense.description}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: expense.category.color ?? "#71717a" }} />
                            {expense.category.name}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-zinc-600">{expense.paidAt}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            {expense.isEssential ? <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Essencial</span> : null}
                            {expense.isRecurring ? <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">Recorrente</span> : null}
                            {!expense.isEssential && !expense.isRecurring ? <span className="text-xs text-zinc-400">Avulsa</span> : null}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-zinc-950">{currencyFormatter.format(expense.amount)}</td>
                        <td className="px-5 py-4 text-right">
                          <button className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50" onClick={() => deleteExpense.mutate(expense.id)} type="button">
                            Deletar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-100 p-5">
              <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:text-zinc-300" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">
                Anterior
              </button>
              <span className="text-sm text-zinc-500">
                Pagina {pagination?.page ?? page} de {pagination?.totalPages ?? 1}
              </span>
              <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:text-zinc-300" disabled={!pagination || page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} type="button">
                Proxima
              </button>
            </div>
            {expensesQuery.error ? <p className="px-5 pb-5 text-sm text-red-600">{getErrorMessage(expensesQuery.error)}</p> : null}
            {deleteExpense.error ? <p className="px-5 pb-5 text-sm text-red-600">{getErrorMessage(deleteExpense.error)}</p> : null}
          </section>

          <aside className="flex flex-col gap-6">
            <ExpenseForm categories={categories} />
            <CategoryManager categories={categories} />
          </aside>
        </div>
      </div>
    </main>
  );
}

