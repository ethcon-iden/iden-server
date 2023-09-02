export function getMonday(d: Date = new Date()): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday

  const monday = new Date(d.setDate(diff));
  return monday;
}
