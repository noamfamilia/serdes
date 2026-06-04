export const PORT_COLORS = [
  "border-emerald-200 bg-emerald-50 text-emerald-900",
  "border-sky-200 bg-sky-50 text-sky-900",
  "border-violet-200 bg-violet-50 text-violet-900",
  "border-amber-200 bg-amber-50 text-amber-900",
  "border-rose-200 bg-rose-50 text-rose-900",
  "border-cyan-200 bg-cyan-50 text-cyan-900",
  "border-orange-200 bg-orange-50 text-orange-900",
  "border-indigo-200 bg-indigo-50 text-indigo-900",
] as const;

export const MODULE_LINK_HIGHLIGHT = "ring-2 ring-zinc-500 ring-inset";

export function getPortColorClasses(index: number) {
  return PORT_COLORS[index % PORT_COLORS.length];
}

export function getPortColor(index: number) {
  return PORT_COLORS[index % PORT_COLORS.length];
}
