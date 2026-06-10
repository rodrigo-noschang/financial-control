"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ApiError } from "@/lib/api-client";
import {
  useCategories,
  useCreateCategory,
} from "@/features/categories/hooks/use-categories";
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
} from "@/features/expenses/hooks/use-expenses";
import { categoryPayloadSchema, type CategoryInput, type CategoryPayload } from "@/shared/schemas/category.schema";
import { expensePayloadSchema, type ExpenseInput, type ExpensePayload } from "@/shared/schemas/expense.schema";
import type { CategoryDto, ExpenseDto } from "@/shared/types/finance";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function todayDateOnly() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateOnlyForDisplay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return value;

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function maskDisplayDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join("/");
}

function currencyInputToNumber(value: string) {
  const digits = value.replace(/\D/g, "");

  return digits ? Number(digits) / 100 : 0;
}

function formatCurrencyInput(value: unknown) {
  const numericValue = Number(value);

  return currencyFormatter.format(Number.isFinite(numericValue) ? numericValue : 0);
}

function dateOnlyToLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return undefined;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return undefined;
  }

  return date;
}

function displayDateToDateOnly(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);

  if (!match) return "";

  const [, day, month, year] = match;
  const dateOnly = `${year}-${month}-${day}`;

  return dateOnlyToLocalDate(dateOnly) ? dateOnly : "";
}

function localDateToDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
    total: "border-primary/70 bg-primary text-primary-foreground shadow-lg shadow-orange-950/20",
    essential: "border-emerald-800/70 bg-emerald-950/50 text-emerald-100",
    recurring: "border-amber-800/70 bg-amber-950/40 text-amber-100",
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

function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <button aria-label="Fechar modal" className="absolute inset-0 !cursor-default" onClick={onClose} type="button" />
      <section className="relative max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card text-card-foreground shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground" onClick={onClose} type="button">
            Fechar
          </button>
        </div>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}

function CategoryForm({ onClose }: { onClose: () => void }) {
  const createCategory = useCreateCategory();

  const form = useForm<CategoryPayload, unknown, CategoryInput>({
    resolver: zodResolver(categoryPayloadSchema),
    defaultValues: {
      name: "",
      color: "#2563eb",
    },
  });

  async function submitCategory(input: CategoryInput) {
    await createCategory.mutateAsync(input);
    form.reset({ name: "", color: "#2563eb" });
    onClose();
  }

  return (
      <form className="grid gap-4" onSubmit={form.handleSubmit(submitCategory)}>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          Nome
          <input
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
            placeholder="Mercado"
            {...form.register("name")}
          />
          {form.formState.errors.name ? <span className="text-xs text-red-400">{form.formState.errors.name.message}</span> : null}
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          Cor
          <input className="h-10 rounded-md border border-input bg-background p-1" type="color" {...form.register("color")} />
        </label>
        <div className="flex justify-end gap-3">
          <button className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground" onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/85 disabled:bg-muted disabled:text-muted-foreground"
            disabled={createCategory.isPending}
            type="submit"
          >
            Criar categoria
          </button>
        </div>
        {createCategory.error ? <p className="text-sm text-red-400">{getErrorMessage(createCategory.error)}</p> : null}
      </form>
  );
}

function ExpenseForm({ categories, onClose, onOpenCategoryModal }: { categories: CategoryDto[]; onClose: () => void; onOpenCategoryModal: () => void }) {
  const createExpense = useCreateExpense();
  const defaultPaidAt = todayDateOnly();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [paidAtDisplay, setPaidAtDisplay] = useState(formatDateOnlyForDisplay(defaultPaidAt));
  const form = useForm<ExpensePayload, unknown, ExpenseInput>({
    resolver: zodResolver(expensePayloadSchema),
    defaultValues: {
      description: "",
      amount: 0,
      paidAt: defaultPaidAt,
      categoryId: "",
      isEssential: false,
      isRecurring: false,
    },
  });
  const paidAt = useWatch({ control: form.control, name: "paidAt" });

  useEffect(() => {
    if (!form.getValues("categoryId") && categories[0]) {
      form.setValue("categoryId", categories[0].id);
    }
  }, [categories, form]);

  async function submitExpense(input: ExpenseInput) {
    await createExpense.mutateAsync(input);
    const nextPaidAt = todayDateOnly();
    form.reset({
      description: "",
      amount: 0,
      paidAt: nextPaidAt,
      categoryId: categories[0]?.id ?? "",
      isEssential: false,
      isRecurring: false,
    });
    setPaidAtDisplay(formatDateOnlyForDisplay(nextPaidAt));
    onClose();
  }

  function handlePaidAtChange(value: string) {
    const displayValue = maskDisplayDate(value);
    setPaidAtDisplay(displayValue);
    form.setValue("paidAt", displayDateToDateOnly(displayValue), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function handlePaidAtSelect(value: Date | undefined) {
    if (!value) return;

    const dateOnly = localDateToDateOnly(value);
    setPaidAtDisplay(formatDateOnlyForDisplay(dateOnly));
    form.setValue("paidAt", dateOnly, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setIsCalendarOpen(false);
  }

  return (
      <form className="grid gap-4" onSubmit={form.handleSubmit(submitExpense)}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-foreground">
            Descricao
            <input className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary" placeholder="Conta de luz" {...form.register("description")} />
            {form.formState.errors.description ? <span className="text-xs text-red-400">{form.formState.errors.description.message}</span> : null}
          </label>
          <label className="grid gap-1 text-sm font-medium text-foreground">
            Valor
            <Controller
              control={form.control}
              name="amount"
              render={({ field }) => (
                <input
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  inputMode="numeric"
                  name={field.name}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(currencyInputToNumber(event.target.value))}
                  ref={field.ref}
                  type="text"
                  value={formatCurrencyInput(field.value)}
                />
              )}
            />
            {form.formState.errors.amount ? <span className="text-xs text-red-400">{form.formState.errors.amount.message}</span> : null}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1 text-sm font-medium text-foreground">
            <label htmlFor="paid-at">Data de pagamento</label>
            <input type="hidden" {...form.register("paidAt")} />
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <div className="flex h-10 overflow-hidden rounded-md border border-input bg-background transition focus-within:border-primary">
                <input
                  id="paid-at"
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground"
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(event) => handlePaidAtChange(event.target.value)}
                  placeholder="dd/mm/aaaa"
                  value={paidAtDisplay}
                />
                <PopoverTrigger asChild>
                  <button
                    aria-label="Abrir calendario"
                    className="flex w-10 shrink-0 items-center justify-center border-l border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    type="button"
                  >
                    <CalendarIcon className="size-4" />
                  </button>
                </PopoverTrigger>
              </div>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  autoFocus
                  locale={ptBR}
                  mode="single"
                  onSelect={handlePaidAtSelect}
                  selected={dateOnlyToLocalDate(paidAt)}
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.paidAt ? <span className="text-xs text-red-400">{form.formState.errors.paidAt.message}</span> : null}
          </div>
          <label className="grid gap-1 text-sm font-medium text-foreground">
            <span className="flex items-center justify-between gap-3">
              Categoria
              <button className="text-sm font-semibold text-primary underline-offset-4 hover:text-primary/80 hover:underline" onClick={onOpenCategoryModal} type="button">
                Criar categoria
              </button>
            </span>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary" disabled={categories.length === 0} {...form.register("categoryId")}>
              <option value="">Selecione</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {form.formState.errors.categoryId ? <span className="text-xs text-red-400">{form.formState.errors.categoryId.message}</span> : null}
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background/40 px-3 py-2 text-sm font-medium text-foreground">
            <input className="h-4 w-4 cursor-pointer accent-primary" type="checkbox" {...form.register("isEssential")} />
            Essencial
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background/40 px-3 py-2 text-sm font-medium text-foreground">
            <input className="h-4 w-4 cursor-pointer accent-primary" type="checkbox" {...form.register("isRecurring")} />
            Recorrente
          </label>
        </div>

        <button
          className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/85 disabled:bg-muted disabled:text-muted-foreground"
          disabled={createExpense.isPending || categories.length === 0}
          type="submit"
        >
          Cadastrar despesa
        </button>
      {categories.length === 0 ? <p className="mt-3 text-sm text-amber-300">Crie uma categoria antes de cadastrar despesas.</p> : null}
      {createExpense.error ? <p className="mt-3 text-sm text-red-400">{getErrorMessage(createExpense.error)}</p> : null}
      </form>
  );
}

export function FinanceDashboard() {
  const [page, setPage] = useState(1);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseDto | null>(null);
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
    return `${formatDateOnlyForDisplay(period.startDate)} ate ${formatDateOnlyForDisplay(period.endDate)}`;
  }, [period]);

  function openDeleteDialog(expense: ExpenseDto) {
    deleteExpense.reset();
    setExpenseToDelete(expense);
  }

  function closeDeleteDialog() {
    deleteExpense.reset();
    setExpenseToDelete(null);
  }

  async function confirmDeleteExpense() {
    if (!expenseToDelete) return;

    try {
      await deleteExpense.mutateAsync(expenseToDelete.id);
      setExpenseToDelete(null);
    } catch {
      // The mutation error remains visible in the confirmation dialog.
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="border-b border-border pb-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">Controle financeiro</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">Gastos do mes atual</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Total no periodo" tone="total" value={summary.total} />
          <SummaryCard label="Gastos essenciais" tone="essential" value={summary.essential} />
          <SummaryCard label="Gastos recorrentes" tone="recurring" value={summary.recurring} />
        </section>

        <section className="rounded-lg border border-border bg-card text-card-foreground shadow-xl shadow-black/10">
            <div className="flex flex-col justify-between gap-3 border-b border-border p-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Ultimos gastos</h2>
                <p className="mt-1 text-sm text-muted-foreground">Do mais recente para o mais antigo.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {pagination ? (
                  <span className="text-sm text-muted-foreground">
                    {pagination.totalItems} despesa{pagination.totalItems === 1 ? "" : "s"}
                  </span>
                ) : null}
                <button
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/85"
                  onClick={() => setIsExpenseModalOpen(true)}
                  type="button"
                >
                  Criar despesa
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-normal text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Despesa</th>
                    <th className="px-5 py-3 font-semibold">Categoria</th>
                    <th className="px-5 py-3 font-semibold">Data</th>
                    <th className="px-5 py-3 font-semibold">Tipo</th>
                    <th className="px-5 py-3 text-right font-semibold">Valor</th>
                    <th className="px-5 py-3 text-right font-semibold">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expensesQuery.isLoading ? (
                    <tr>
                      <td className="px-5 py-8 text-center text-muted-foreground" colSpan={6}>Carregando despesas...</td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-center text-muted-foreground" colSpan={6}>Nenhuma despesa cadastrada no periodo.</td>
                    </tr>
                  ) : (
                    expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="px-5 py-4 font-medium text-foreground">{expense.description}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background/40 px-2 py-1 text-xs font-medium text-muted-foreground">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: expense.category.color ?? "#71717a" }} />
                            {expense.category.name}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{formatDateOnlyForDisplay(expense.paidAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            {expense.isEssential ? <span className="rounded-md bg-emerald-950/70 px-2 py-1 text-xs font-medium text-emerald-300">Essencial</span> : null}
                            {expense.isRecurring ? <span className="rounded-md bg-amber-950/70 px-2 py-1 text-xs font-medium text-amber-300">Recorrente</span> : null}
                            {!expense.isEssential && !expense.isRecurring ? <span className="text-xs text-muted-foreground">Avulsa</span> : null}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-foreground">{currencyFormatter.format(expense.amount)}</td>
                        <td className="px-5 py-4 text-right">
                          <button className="rounded-md border border-red-900/80 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/60 hover:text-red-300" onClick={() => openDeleteDialog(expense)} type="button">
                            Deletar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-border p-5">
              <button className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:text-muted-foreground/40" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">
                Anterior
              </button>
              <span className="text-sm text-muted-foreground">
                Pagina {pagination?.page ?? page} de {pagination?.totalPages ?? 1}
              </span>
              <button className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:text-muted-foreground/40" disabled={!pagination || page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} type="button">
                Proxima
              </button>
            </div>
            {expensesQuery.error ? <p className="px-5 pb-5 text-sm text-red-400">{getErrorMessage(expensesQuery.error)}</p> : null}
            {deleteExpense.error ? <p className="px-5 pb-5 text-sm text-red-400">{getErrorMessage(deleteExpense.error)}</p> : null}
        </section>
      </div>

      {isExpenseModalOpen ? (
        <Modal onClose={() => setIsExpenseModalOpen(false)} title="Nova despesa">
          <ExpenseForm
            categories={categories}
            onClose={() => setIsExpenseModalOpen(false)}
            onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
          />
        </Modal>
      ) : null}

      {isCategoryModalOpen ? (
        <Modal onClose={() => setIsCategoryModalOpen(false)} title="Nova categoria">
          <CategoryForm onClose={() => setIsCategoryModalOpen(false)} />
        </Modal>
      ) : null}

      <Dialog
        onOpenChange={(open) => {
          if (!open && !deleteExpense.isPending) {
            closeDeleteDialog();
          }
        }}
        open={expenseToDelete !== null}
      >
        <DialogContent showCloseButton={!deleteExpense.isPending}>
          <DialogHeader>
            <DialogTitle>Deletar despesa?</DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja deletar a despesa <strong className="font-semibold text-foreground">{expenseToDelete?.description}</strong>? Esta acao e irreversivel.
            </DialogDescription>
          </DialogHeader>

          {deleteExpense.error ? <p className="text-sm text-red-400">{getErrorMessage(deleteExpense.error)}</p> : null}

          <DialogFooter>
            <Button
              disabled={deleteExpense.isPending}
              onClick={closeDeleteDialog}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={deleteExpense.isPending}
              onClick={confirmDeleteExpense}
              type="button"
              variant="destructive"
            >
              {deleteExpense.isPending ? "Deletando..." : "Deletar despesa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

