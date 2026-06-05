"use client";

import type { MouseEvent } from "react";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import { getModuleLinkColor } from "@/components/port-colors";
import {
  assignmentHiddenDuringDrag,
  getDragHiddenModuleKeys,
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

type ActiveModuleDrag = {
  anchor: QuadModuleRef;
  isGroup: boolean;
  groupModules: QuadModuleRef[];
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
  activeModuleDrag: ActiveModuleDrag | null;
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
  activeModuleDrag,
  onLinkHover,
  onLinkSelect,
}: DroppablePortLaneProps) {
  const hiddenDragKeys = getDragHiddenModuleKeys(
    activeModuleDrag?.anchor,
    activeModuleDrag?.groupModules,
    activeModuleDrag?.isGroup ?? false,
  );
  const displayAssignment = assignmentHiddenDuringDrag(
    assignment,
    hiddenDragKeys,
  );

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
  const laneEmpty = displayAssignment === null;
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
  const assignmentKey = displayAssignment ? moduleRefKey(displayAssignment) : null;
  const canDropAssignedToEmpty =
    isAssignedDrag &&
    !groupMode &&
    activeData?.moduleType === moduleType &&
    laneEmpty;
  const canDropAssignedSwap =
    isAssignedDrag &&
    !groupMode &&
    activeData?.moduleType === moduleType &&
    displayAssignment !== null &&
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
      highlightFromLane(portId, moduleType, laneIndex, displayAssignment),
    );
  }

  function handlePointerLeave() {
    onLinkHover(null);
  }

  function handleClick(event: MouseEvent) {
    event.stopPropagation();
    onLinkSelect(highlightFromLane(portId, moduleType, laneIndex, displayAssignment));
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
          displayAssignment ? colorIndex : undefined,
          displayAssignment !== null,
          isLinked,
        )}
        highlightClassName={highlightClassName}
      />
    </div>
  );
}
