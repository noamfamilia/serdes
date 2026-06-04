import {
  PORT_MODULE_WIDTH_CLASS,
  QUAD_MODULE_HEIGHT_CLASS,
  ROTATED_QUAD_MODULE_SLOT_CLASS,
} from "@/components/quad-module-dimensions";

type ModuleCardProps = {
  label: string;
  variant?: "config" | "rx" | "tx";
  orientation?: "horizontal" | "vertical";
  size?: "default" | "sm";
  grow?: boolean;
  colorClassName?: string;
  highlightClassName?: string;
  className?: string;
};

const variantStyles = {
  config: "border-zinc-200 bg-white text-zinc-800",
  rx: "border-zinc-200 bg-white text-zinc-800",
  tx: "border-zinc-200 bg-white text-zinc-800",
};

export function ModuleCard({
  label,
  variant = "config",
  orientation = "horizontal",
  size = "default",
  grow = true,
  colorClassName,
  highlightClassName,
  className,
}: ModuleCardProps) {
  const styleClass = colorClassName ?? variantStyles[variant];

  if (orientation === "vertical") {
    const sizeClass =
      size === "sm"
        ? "h-16 w-8 rounded-lg"
        : grow
          ? `${QUAD_MODULE_HEIGHT_CLASS} min-w-0 flex-1 rounded-xl`
          : `${QUAD_MODULE_HEIGHT_CLASS} shrink-0 rounded-xl`;

    return (
      <div
        className={`flex items-center justify-center border shadow-sm ${styleClass} ${highlightClassName ?? ""} ${className ?? ""} ${sizeClass}`}
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

type RotatedQuadModuleCardProps = Omit<
  ModuleCardProps,
  "orientation" | "grow" | "size"
>;

export function RotatedQuadModuleCard(props: RotatedQuadModuleCardProps) {
  return (
    <div className={`relative shrink-0 ${ROTATED_QUAD_MODULE_SLOT_CLASS}`}>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90">
        <ModuleCard
          {...props}
          orientation="vertical"
          grow={false}
          className={PORT_MODULE_WIDTH_CLASS}
        />
      </div>
    </div>
  );
}
