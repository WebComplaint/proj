export function subMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() - amount, 1);
}

export function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function startOfMonthKey(date: Date) {
  return toMonthKey(new Date(date.getFullYear(), date.getMonth(), 1));
}
