export function getDateString(d: Date): string {
  const offset = d.getTimezoneOffset() * 60000;
  const dateString = new Date(d.getTime() - offset).toISOString().split('T')[0];
  return dateString;
}
