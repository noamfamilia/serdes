import { QUAD_MODULE_WIDTH_CLASS } from "@/components/quad-module-dimensions";

type ChannelBarProps = {
  label?: string;
  onClick?: () => void;
  orientation?: "horizontal" | "vertical";
  outline?: boolean;
};

export function ChannelBar({
  label = "CLOCKING",
  onClick,
  orientation = "horizontal",
  outline = false,
}: ChannelBarProps) {
  if (orientation === "vertical") {
    const className = outline
      ? `flex ${QUAD_MODULE_WIDTH_CLASS} shrink-0 items-center justify-center self-stretch rounded-xl border border-zinc-200 bg-white px-2 shadow-none`
      : `flex ${QUAD_MODULE_WIDTH_CLASS} shrink-0 cursor-pointer items-center justify-center self-stretch rounded-xl border border-amber-200 bg-amber-50 px-2 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-100`;

    const content = (
      <span
        className={`-rotate-90 whitespace-nowrap text-[10px] font-medium ${
          outline ? "text-zinc-400" : "text-amber-900"
        }`}
      >
        {label}
      </span>
    );

    if (outline && !onClick) {
      return <div className={className}>{content}</div>;
    }

    if (outline && onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          className={`${className} cursor-pointer transition-colors hover:border-zinc-300 hover:bg-zinc-50`}
        >
          {content}
        </button>
      );
    }

    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-full cursor-pointer items-center justify-center rounded-md border border-amber-200 bg-amber-50 px-3 text-xs font-medium text-amber-900 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-100"
    >
      {label}
    </button>
  );
}
