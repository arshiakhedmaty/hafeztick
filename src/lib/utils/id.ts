/** Short, collision-resistant id for locally created records. */
export function uid(prefix?: string): string {
  const body =
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  return prefix ? `${prefix}_${body}` : body;
}
