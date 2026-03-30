export function formatMoney(amount: number, currency = "CLP") {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CLP" ? 0 : 2,
  }).format(amount);
}

export function monthBounds(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end), label: d.toLocaleString("es-CL", { month: "long", year: "numeric" }) };
}
