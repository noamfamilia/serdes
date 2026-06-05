"use client";

import { useEffect } from "react";
import {
  assignmentHiddenDuringDrag,
  getDragHiddenModuleKeys,
  getPortLaneLabel,
} from "@/components/dnd-utils";
import { DroppablePortLane } from "@/components/DroppablePortLane";
import {
  getPortLaneCount,
  type ModuleLinkHighlight,
  type Port,
  type PortBlock,
  type PortLaneAssignments,
  type ModuleType,
  type QuadModuleRef,
} from "@/types/port-config";

type ActiveModuleDrag = {
  anchor: QuadModuleRef;
  isGroup: boolean;
  groupModules: QuadModuleRef[];
};

type PortDetailPanelProps = {
  port: Port;
  blocks: PortBlock[];
  colorIndex: number;
  assignments: PortLaneAssignments;
  activeLink: ModuleLinkHighlight | null;
  groupMode: boolean;
  activeGroupDrag: {
    portId: string;
    sourceLane: number;
    isGroup: boolean;
  } | null;
  activeModuleDrag: ActiveModuleDrag | null;
  onGroupModeChange: (groupMode: boolean) => void;
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
  groupMode,
  activeGroupDrag,
  activeModuleDrag,
  onGroupModeChange,
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
  const hiddenDragKeys = getDragHiddenModuleKeys(
    activeModuleDrag?.anchor,
    activeModuleDrag?.groupModules,
    activeModuleDrag?.isGroup ?? false,
  );

  function laneLabel(
    assignment: QuadModuleRef | null,
    moduleType: ModuleType,
  ) {
    return getPortLaneLabel(
      blocks,
      assignmentHiddenDuringDrag(assignment, hiddenDragKeys),
      moduleType,
    );
  }

  return (
    <div
      className="flex w-max shrink-0 flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-md"
      onClick={onClearLink}
    >
      <div className="relative flex shrink-0 items-center justify-center px-7 pb-3">
        <h2 className="text-sm font-semibold text-zinc-800">Layout</h2>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className="absolute right-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="Close layout"
        >
          ×
        </button>
      </div>

      <div className="flex shrink-0">
        <div className="flex w-max shrink-0 flex-col gap-2">
          <div className="flex gap-1">
            {Array.from({ length: laneCount }, (_, i) => (
              <DroppablePortLane
                key={`rx-${i}`}
                portId={port.id}
                moduleType="rx"
                laneIndex={i}
                label={laneLabel(assignments.rx[i] ?? null, "rx")}
                assignment={assignments.rx[i] ?? null}
                colorIndex={colorIndex}
                activeLink={activeLink}
                groupMode={groupMode}
                activeGroupDrag={activeGroupDrag}
                activeModuleDrag={activeModuleDrag}
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
                label={laneLabel(assignments.tx[i] ?? null, "tx")}
                assignment={assignments.tx[i] ?? null}
                colorIndex={colorIndex}
                activeLink={activeLink}
                groupMode={groupMode}
                activeGroupDrag={activeGroupDrag}
                activeModuleDrag={activeModuleDrag}
                onLinkHover={onLinkHover}
                onLinkSelect={onLinkSelect}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className="mt-3 flex shrink-0 rounded-lg border border-zinc-200 p-0.5"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onGroupModeChange(true)}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            groupMode
              ? "bg-zinc-200 text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800"
          }`}
        >
          Group
        </button>
        <button
          type="button"
          onClick={() => onGroupModeChange(false)}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            !groupMode
              ? "bg-zinc-200 text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800"
          }`}
        >
          Ungroup
        </button>
      </div>
    </div>
  );
}
