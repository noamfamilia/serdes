"use client";

import { useDndContext, useDroppable } from "@dnd-kit/core";
import { ModuleCard } from "@/components/ModuleCard";
import { LinkedQuadModule } from "@/components/LinkedQuadModule";
import { moduleRefKey, quadSlotId } from "@/components/dnd-utils";
import { QUAD_MODULE_FIXED_WIDTH_CLASS } from "@/components/quad-module-dimensions";
import type { ModuleType, QuadModuleRef } from "@/types/port-config";

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

type QuadModuleSlotProps = {
  blockId: string;
  blockLabel: string;
  moduleType: ModuleType;
  moduleIndex: number;
  isAssigned: boolean;
  portColorIndex?: number;
  assignedPortId?: string;
  assignedLaneIndex?: number;
  isLinked?: boolean;
  groupMode?: boolean;
  activeGroupDrag?: ActiveGroupDrag | null;
  isInGroupDrag?: boolean;
  onLinkHover?: (module: QuadModuleRef) => void;
  onLinkLeave?: () => void;
  onLinkSelect?: (module: QuadModuleRef) => void;
};

export function QuadModuleSlot({
  blockId,
  blockLabel,
  moduleType,
  moduleIndex,
  isAssigned,
  portColorIndex,
  assignedPortId,
  assignedLaneIndex,
  isLinked = false,
  groupMode = false,
  activeGroupDrag = null,
  isInGroupDrag = false,
  onLinkHover,
  onLinkLeave,
  onLinkSelect,
}: QuadModuleSlotProps) {
  const moduleRef: QuadModuleRef = { blockId, moduleType, moduleIndex };
  const outlineLabel = moduleType.toUpperCase();
  const slotId = quadSlotId(blockId, moduleType, moduleIndex);

  const { active } = useDndContext();
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: {
      type: "quad-slot",
      blockId,
      moduleType,
      moduleIndex,
    },
  });

  const activeData = active?.data.current as ActiveQuadModuleData | undefined;
  const isModuleDrag = activeData?.type === "quad-module";
  const isAssignedDrag = isModuleDrag && activeData?.isAssigned === true;
  const slotModuleKey = moduleRefKey(moduleRef);
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
  const isSelf = activeModuleKey === slotModuleKey;
  const isGroupAssignedDrag =
    groupMode &&
    isAssignedDrag &&
    activeGroupDrag?.isGroup &&
    assignedPortId === activeGroupDrag.portId;
  const canDropAssignedToUnlinked =
    isAssignedDrag &&
    !groupMode &&
    activeData?.moduleType === moduleType &&
    !isSelf &&
    !isAssigned;
  const canDropAssignedSwap =
    isAssignedDrag &&
    !groupMode &&
    activeData?.moduleType === moduleType &&
    isAssigned &&
    activeModuleKey !== null &&
    !isSelf;
  const canDropGroupShift =
    isGroupAssignedDrag &&
    assignedLaneIndex !== undefined &&
    activeGroupDrag.sourceLane !== assignedLaneIndex;
  const canDropCrossQuadGroup =
    isGroupAssignedDrag &&
    activeData?.moduleType === moduleType &&
    !isSelf &&
    activeData?.blockId !== blockId;
  const canDrop =
    canDropAssignedToUnlinked ||
    canDropAssignedSwap ||
    canDropGroupShift ||
    canDropCrossQuadGroup;

  const highlightClassName = isOver && canDrop
    ? "ring-2 ring-violet-400 ring-inset"
    : canDrop
      ? "ring-1 ring-violet-200 ring-inset"
      : undefined;

  return (
    <div
      ref={setNodeRef}
      data-quad-slot-id={slotId}
      className={`relative ${QUAD_MODULE_FIXED_WIDTH_CLASS} shrink-0`}
    >
      <ModuleCard
        label={outlineLabel}
        variant={moduleType}
        orientation="vertical"
        grow={false}
        outline
        className={QUAD_MODULE_FIXED_WIDTH_CLASS}
        highlightClassName={highlightClassName}
      />
      {isAssigned && portColorIndex !== undefined && (
        <LinkedQuadModule
          blockId={blockId}
          blockLabel={blockLabel}
          moduleType={moduleType}
          moduleIndex={moduleIndex}
          portColorIndex={portColorIndex}
          isLinked={isLinked}
          groupMode={groupMode}
          isInGroupDrag={isInGroupDrag}
          onLinkHover={() => onLinkHover?.(moduleRef)}
          onLinkLeave={onLinkLeave}
          onLinkSelect={() => onLinkSelect?.(moduleRef)}
        />
      )}
    </div>
  );
}
