"use client";

import { useEffect } from "react";
import { getPortColor } from "@/components/port-colors";
import { getPortLaneLabel } from "@/components/dnd-utils";
import { DroppablePortLane } from "@/components/DroppablePortLane";
import {
  getPortLaneCount,
  type ModuleLinkHighlight,
  type Port,
  type PortBlock,
  type PortLaneAssignments,
} from "@/types/port-config";

type PortDetailPanelProps = {
  port: Port;
  blocks: PortBlock[];
  colorIndex: number;
  assignments: PortLaneAssignments;
  activeLink: ModuleLinkHighlight | null;
  onLinkHover: (highlight: ModuleLinkHighlight | null) => void;
  onLinkSelect: (highlight: ModuleLinkHighlight) => void;
  onClearLink: () => void;
  onClose: () => void;
};

export function PortDetailPanel({
  port,
  blocks,
  colorIndex,
  assignments,
  activeLink,
  onLinkHover,
  onLinkSelect,
  onClearLink,
  onClose,
}: PortDetailPanelProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const laneCount = getPortLaneCount(port.speed);

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-md"
      onClick={onClearLink}
    >
      <div className="relative flex shrink-0 items-center justify-center px-7 pb-3">
        <div
          className={`flex h-10 w-full max-w-[180px] items-center justify-center rounded-xl border text-xs font-medium shadow-sm ${getPortColor(colorIndex)}`}
        >
          {port.speed}
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className="absolute right-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          aria-label={`Close ${port.speed} details`}
        >
          ×
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-max shrink-0 flex-col gap-2">
          <div className="flex gap-1">
            {Array.from({ length: laneCount }, (_, i) => (
              <DroppablePortLane
                key={`rx-${i}`}
                portId={port.id}
                moduleType="rx"
                laneIndex={i}
                label={getPortLaneLabel(
                  blocks,
                  assignments.rx[i] ?? null,
                  "rx",
                  i,
                )}
                assignment={assignments.rx[i] ?? null}
                colorIndex={colorIndex}
                activeLink={activeLink}
                onLinkHover={onLinkHover}
                onLinkSelect={onLinkSelect}
              />
            ))}
          </div>
          <div className="flex gap-1">
            {Array.from({ length: laneCount }, (_, i) => (
              <DroppablePortLane
                key={`tx-${i}`}
                portId={port.id}
                moduleType="tx"
                laneIndex={i}
                label={getPortLaneLabel(
                  blocks,
                  assignments.tx[i] ?? null,
                  "tx",
                  i,
                )}
                assignment={assignments.tx[i] ?? null}
                colorIndex={colorIndex}
                activeLink={activeLink}
                onLinkHover={onLinkHover}
                onLinkSelect={onLinkSelect}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
