export const PORT_COLOR_LABELS = [
  "Grey",
  "Emerald",
  "Sky",
  "Violet",
  "Amber",
  "Rose",
  "Cyan",
  "Orange",
] as const;

export const PORT_PICKER_COLORS = [
  "border-zinc-300 bg-zinc-200 text-zinc-800",
  "border-emerald-200 bg-emerald-50 text-emerald-900",
  "border-sky-200 bg-sky-50 text-sky-900",
  "border-violet-200 bg-violet-50 text-violet-900",
  "border-amber-200 bg-amber-50 text-amber-900",
  "border-rose-200 bg-rose-50 text-rose-950",
  "border-cyan-200 bg-cyan-50 text-cyan-900",
  "border-orange-200 bg-orange-50 text-orange-900",
] as const;

export const PORT_COLORS = PORT_PICKER_COLORS;

export const PORT_COLORS_INTENSE = [
  "border-zinc-400 bg-zinc-300 text-zinc-950",
  "border-emerald-300 bg-emerald-100 text-emerald-950",
  "border-sky-300 bg-sky-100 text-sky-950",
  "border-violet-300 bg-violet-100 text-violet-950",
  "border-amber-300 bg-amber-100 text-amber-950",
  "border-rose-300 bg-rose-100 text-rose-950",
  "border-cyan-300 bg-cyan-100 text-cyan-950",
  "border-orange-300 bg-orange-100 text-orange-950",
] as const;

export const MODULE_UNASSIGNED_INTENSE =
  "border-zinc-300 bg-zinc-100 text-zinc-900";

export const PORT_LIST_DEFAULT =
  "border-zinc-200 bg-zinc-100 text-zinc-600";

export const PORT_LIST_SELECTED =
  "border-zinc-300 bg-zinc-200 text-zinc-800";

export const QUAD_PLACEHOLDER_MODULE =
  "border-zinc-200 bg-white text-zinc-500";

export function getPortColorClasses(index: number) {
  return PORT_COLORS[index % PORT_COLORS.length];
}

export function getPortColor(index: number) {
  return PORT_COLORS[index % PORT_COLORS.length];
}

export function getPortColorIntense(index: number) {
  return PORT_COLORS_INTENSE[index % PORT_COLORS_INTENSE.length];
}

export function getModuleLinkColor(
  colorIndex: number | undefined,
  isAssigned: boolean,
  isLinked: boolean,
): string | undefined {
  if (!isLinked) {
    return isAssigned && colorIndex !== undefined
      ? getPortColor(colorIndex)
      : undefined;
  }

  if (isAssigned && colorIndex !== undefined) {
    return getPortColorIntense(colorIndex);
  }

  return MODULE_UNASSIGNED_INTENSE;
}
