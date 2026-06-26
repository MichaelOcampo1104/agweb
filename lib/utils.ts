/** Build a querystring from a filter object, dropping empty values. */
export function toQuery(filters: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "" && value !== null) {
      params.set(key, String(value));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

/** Initial of a name, for the avatar badge in cards. */
export function initial(name: string): string {
  return (name?.trim()?.[0] ?? "?").toUpperCase();
}

/** Status → tailwind classes for the cert-status pill. */
export function statusBadge(status: string): string {
  switch (status) {
    case "active":
      return "bg-brand-100 text-brand-800 ring-brand-200";
    case "pending":
      return "bg-amber-100 text-amber-800 ring-amber-200";
    case "expired":
      return "bg-red-100 text-red-700 ring-red-200";
    case "suspended":
      return "bg-slate-200 text-slate-700 ring-slate-300";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}
