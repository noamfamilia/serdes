"use client";

import type { MouseEvent } from "react";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import { MODULE_LINK_HIGHLIGHT, getPortColor } from "@/components/port-colors";
import {
  highlightFromLane,
  isLaneLinked,
  portLaneId,
} from "@/components/dnd-utils";
import { RotatedQuadModuleCard } from "@/components/ModuleCard";
import type { ModuleLinkHighlight, ModuleType, QuadModuleRef } from "@/types/port-config";

type ActiveQuadModuleData = {
  type?: string;
  moduleType?: ModuleType;
  isAssigned?: boolean;
};

type DroppablePortLaneProps = {
  portId: string;
  moduleType: ModuleType;
  laneIndex: number;
  label: string;
  assignment: QuadModuleRef | null;
  colorIndex: number;
  activeLink: ModuleLinkHighlight | null;
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
  const laneEmpty = assignment === null;
  const canDrop =
    isModuleDrag &&
    activeData?.moduleType === moduleType &&
    !isAssignedDrag &&
    laneEmpty;
  const isLinked = isLaneLinked(activeLink, portId, moduleType, laneIndex);

  const highlightClassName = isOver && canDrop
    ? "ring-2 ring-violet-400 ring-inset"
    : isLinked
      ? MODULE_LINK_HIGHLIGHT
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
      className="shrink-0 cursor-pointer"
    >
      <RotatedQuadModuleCard
        label={label}
        variant={moduleType}
        colorClassName={assignment ? getPortColor(colorIndex) : undefined}
        highlightClassName={highlightClassName}
      />
    </div>
  );
}
