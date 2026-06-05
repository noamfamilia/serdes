"use client";

import type { MouseEvent } from "react";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import { getModuleLinkColor } from "@/components/port-colors";
import {
  highlightFromLane,
  isLaneLinked,
  moduleRefKey,
  portLaneId,
} from "@/components/dnd-utils";
import { ModuleCard } from "@/components/ModuleCard";
import { QUAD_MODULE_FIXED_WIDTH_CLASS } from "@/components/quad-module-dimensions";
import type { ModuleLinkHighlight, ModuleType, QuadModuleRef } from "@/types/port-config";

type ActiveQuadModuleData = {
  type?: string;
  blockId?: string;
  moduleType?: ModuleType;
  moduleIndex?: number;
  isAssigned?: boolean;
  groupMode?: boolean;
};

type ActiveGroupDrag = {
  portId: string;
  sourceLane: number;
  isGroup: boolean;
};

type DroppablePortLaneProps = {
  portId: string;
  moduleType: ModuleType;
  laneIndex: number;
  label: string;
  assignment: QuadModuleRef | null;
  colorIndex: number;
  activeLink: ModuleLinkHighlight | null;
  groupMode: boolean;
  activeGroupDrag: ActiveGroupDrag | null;
  onLinkHover: (highlight: ModuleLinkHighlight | null) => void;
  onLinkSelect: (highlight: ModuleLinkHighlight) => void;
};

export function DroppablePortLane({
  portId,
  moduleType,
  laneIndex,
  label,
  assignment,
  colorIndex,
  activeLink,
  groupMode,
  activeGroupDrag,
  onLinkHover,
  onLinkSelect,
}: DroppablePortLaneProps) {
  const { active } = useDndContext();
  const { setNodeRef, isOver } = useDroppable({
    id: portLaneId(portId, moduleType, laneIndex),
    data: {
      type: "port-lane",
      portId,
      moduleType,
      laneIndex,
    },
  });

  const activeData = active?.data.current as ActiveQuadModuleData | undefined;
  const isModuleDrag = activeData?.type === "quad-module";
  const isAssignedDrag = isModuleDrag && activeData?.isAssigned === true;
  const isGroupAssignedDrag =
    groupMode &&
    isAssignedDrag &&
    activeGroupDrag?.isGroup &&
    activeGroupDrag.portId === portId;
  const laneEmpty = assignment === null;
  const activeModuleKey =
    activeData?.blockId !== undefined &&
    activeData.moduleType !== undefined &&
    activeData.moduleIndex !== undefined
      ? moduleRefKey({
          blockId: activeData.blockId,
          moduleType: activeData.moduleType,
          moduleIndex: activeData.moduleIndex,
        })
      : null;
  const assignmentKey = assignment ? moduleRefKey(assignment) : null;
  const canDropAssignedToEmpty =
    isAssignedDrag &&
    !groupMode &&
    activeData?.moduleType === moduleType &&
    laneEmpty;
  const canDropAssignedSwap =
    isAssignedDrag &&
    !groupMode &&
    activeData?.moduleType === moduleType &&
    assignment !== null &&
    activeModuleKey !== null &&
    activeModuleKey !== assignmentKey;
  const canDropGroupShift =
    isGroupAssignedDrag &&
    activeGroupDrag.sourceLane !== laneIndex;
  const canDrop =
    canDropAssignedToEmpty || canDropAssignedSwap || canDropGroupShift;
  const isLinked = isLaneLinked(activeLink, portId, moduleType, laneIndex);

  const highlightClassName = isOver && canDrop
    ? "ring-2 ring-violet-400 ring-inset"
    : canDrop
      ? "ring-1 ring-violet-200 ring-inset"
      : undefined;

  function handlePointerEnter() {
    onLinkHover(
      highlightFromLane(portId, moduleType, laneIndex, assignment),
    );
  }

  function handlePointerLeave() {
    onLinkHover(null);
  }

  function handleClick(event: MouseEvent) {
    event.stopPropagation();
    onLinkSelect(highlightFromLane(portId, moduleType, laneIndex, assignment));
  }

  return (
    <div
      ref={setNodeRef}
      data-link-surface=""
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      className={`shrink-0 cursor-pointer ${
        canDrop ? "rounded-xl p-2 -m-2" : ""
      }`}
    >
      <ModuleCard
        label={label}
        variant={moduleType}
        orientation="vertical"
        grow={false}
        className={QUAD_MODULE_FIXED_WIDTH_CLASS}
        colorClassName={getModuleLinkColor(
          assignment ? colorIndex : undefined,
          assignment !== null,
          isLinked,
        )}
        highlightClassName={highlightClassName}
      />
    </div>
  );
}
