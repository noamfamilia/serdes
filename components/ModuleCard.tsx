type ModuleCardProps = {
  label: string;
  variant?: "config" | "rx" | "tx";
  orientation?: "horizontal" | "vertical";
};

const variantStyles = {
  config:
    "border-violet-200 bg-violet-50 text-violet-900",
  rx: "border-sky-200 bg-sky-50 text-sky-900",
  tx: "border-amber-200 bg-amber-50 text-amber-900",
};

export function ModuleCard({
  label,
  variant = "config",
  orientation = "horizontal",
}: ModuleCardProps) {
  if (orientation === "vertical") {
    return (
      <div
        className={`flex h-24 min-w-0 flex-1 items-center justify-center rounded-xl border shadow-sm ${variantStyles[variant]}`}
      >
        <span className="-rotate-90 whitespace-nowrap text-[10px] font-medium">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex h-10 items-center justify-center rounded-xl border px-3 text-xs font-medium shadow-sm ${variantStyles[variant]}`}
    >
      {label}
    </div>
  );
}
