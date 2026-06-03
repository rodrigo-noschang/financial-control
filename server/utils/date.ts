export function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getCurrentMonthPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    startDate: toDateOnly(start),
    endDate: toDateOnly(end),
  };
}
