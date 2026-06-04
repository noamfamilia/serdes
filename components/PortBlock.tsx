import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useEffect, useState } from "react";
import type { PortBlock as PortBlockType } from "@/types/port-config";
import { ChannelBar } from "./ChannelBar";
import { ClockingDialog } from "./ClockingDialog";
import { ModuleCard } from "./ModuleCard";

type PortBlockProps = {
  block: PortBlockType;
  isDragging?: boolean;
  dragHandleProps?: {
    attributes: DraggableAttributes;
    listeners: SyntheticListenerMap | undefined;
  };
  onRemove?: () => void;
};

export function PortBlock({
  block,
  isDragging = false,
  dragHandleProps,
  onRemove,
}: PortBlockProps) {
  const [clockingOpen, setClockingOpen] = useState(false);

  useEffect(() => {
    if (!clockingOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setClockingOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clockingOpen]);

  return (
    <>
      <div
      className={`flex w-[220px] shrink-0 flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-md transition-shadow ${
        isDragging ? "scale-[1.02] shadow-xl ring-2 ring-violet-300" : ""
      }`}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex flex-1 cursor-grab items-center gap-2 rounded-lg bg-zinc-100 px-2 py-1.5 text-left active:cursor-grabbing"
          aria-label={`Drag ${block.label}`}
          {...dragHandleProps?.attributes}
          {...dragHandleProps?.listeners}
        >
          <svg
            className="h-4 w-4 shrink-0 text-zinc-400"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden
          >
            <circle cx="5" cy="4" r="1.2" />
            <circle cx="11" cy="4" r="1.2" />
            <circle cx="5" cy="8" r="1.2" />
            <circle cx="11" cy="8" r="1.2" />
            <circle cx="5" cy="12" r="1.2" />
            <circle cx="11" cy="12" r="1.2" />
          </svg>
          <span className="truncate text-xs font-semibold text-zinc-700">
            {block.label}
          </span>
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label={`Remove ${block.label}`}
          >
            ×
          </button>
        )}
      </div>

      <ModuleCard label="PMA" variant="config" />

      <div className="flex w-full gap-1">
        {Array.from({ length: 4 }, (_, i) => (
          <ModuleCard
            key={`rx-${i}`}
            label={`RX ${i + 1}`}
            variant="rx"
            orientation="vertical"
          />
        ))}
      </div>

      <ChannelBar onClick={() => setClockingOpen(true)} />

      <div className="flex w-full gap-1">
        {Array.from({ length: 4 }, (_, i) => (
          <ModuleCard
            key={`tx-${i}`}
            label={`TX ${i + 1}`}
            variant="tx"
            orientation="vertical"
          />
        ))}
      </div>
      </div>

      <ClockingDialog
        quadLabel={block.label}
        open={clockingOpen}
        onClose={() => setClockingOpen(false)}
      />
    </>
  );
}
