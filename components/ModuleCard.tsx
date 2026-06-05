import { QUAD_MODULE_HEIGHT_CLASS } from "@/components/quad-module-dimensions";

type ModuleCardProps = {
  label: string;
  variant?: "config" | "rx" | "tx";
  orientation?: "horizontal" | "vertical";
  size?: "default" | "sm";
  grow?: boolean;
  outline?: boolean;
  colorClassName?: string;
  highlightClassName?: string;
  className?: string;
};

const variantStyles = {
  config: "border-zinc-300 bg-zinc-200 text-zinc-700",
  rx: "border-zinc-200 bg-white text-zinc-800",
  tx: "border-zinc-200 bg-white text-zinc-800",
};

const outlineStyles = {
  config: "border-zinc-200 bg-white text-zinc-400",
  rx: "border-zinc-200 bg-white text-zinc-400",
  tx: "border-zinc-200 bg-white text-zinc-400",
};

export function ModuleCard({
  label,
  variant = "config",
  orientation = "horizontal",
  size = "default",
  grow = true,
  outline = false,
  colorClassName,
  highlightClassName,
  className,
}: ModuleCardProps) {
  const styleClass =
    colorClassName ??
    (outline ? outlineStyles[variant] : variantStyles[variant]);

  if (orientation === "vertical") {
    const sizeClass =
      size === "sm"
        ? "h-16 w-8 rounded-lg"
        : grow
          ? `${QUAD_MODULE_HEIGHT_CLASS} min-w-0 flex-1 rounded-xl`
          : `${QUAD_MODULE_HEIGHT_CLASS} shrink-0 rounded-xl`;

    return (
      <div
        className={`flex items-center justify-center border shadow-sm ${styleClass} ${highlightClassName ?? ""} ${className ?? ""} ${sizeClass} ${outline ? "shadow-none" : ""}`}
      >
        <span
          className={`-rotate-90 whitespace-nowrap font-medium ${
            size === "sm" ? "text-[8px]" : "text-[10px]"
          }`}
        >
          {label}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-xl border px-2 font-medium shadow-sm ${styleClass} ${highlightClassName ?? ""} ${className ?? ""} ${
        size === "sm" ? "h-8 text-[10px]" : "h-10 text-xs"
      }`}
    >
      {label}
    </div>
  );
}
