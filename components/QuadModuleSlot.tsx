"use client";

import { useDndContext, useDroppable } from "@dnd-kit/core";
import { ModuleCard } from "@/components/ModuleCard";
import { LinkedQuadModule } from "@/components/LinkedQuadModule";
import { formatPortLaneLabel, moduleRefKey, quadSlotId } from "@/components/dnd-utils";
import { getModuleLinkColor } from "@/components/port-colors";
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
  canGroupDropOnSlot?: (dropSlot: QuadModuleRef) => boolean;
  activeDragModuleKey?: string | null;
  groupPreviewDisplay?: {
    sourceHiddenKeys: Set<string>;
    targetPreview: Map<
      string,
      {
        member: QuadModuleRef;
        portColorIndex: number;
        blockLabel: string;
      }
    >;
  } | null;
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
  canGroupDropOnSlot,
  activeDragModuleKey = null,
  groupPreviewDisplay = null,
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
  const canDropGroup =
    isGroupAssignedDrag &&
    !isSelf &&
    (canGroupDropOnSlot?.(moduleRef) ?? false);
  const canDrop =
    canDropAssignedToUnlinked ||
    canDropAssignedSwap ||
    canDropGroup;

  const highlightClassName = isOver && canDrop
    ? "ring-2 ring-violet-400 ring-inset"
    : canDrop
      ? "ring-1 ring-violet-200 ring-inset"
      : undefined;

  const previewEntry = groupPreviewDisplay?.targetPreview.get(slotModuleKey);
  const hideAssignedModule =
    activeDragModuleKey === slotModuleKey ||
    (groupPreviewDisplay?.sourceHiddenKeys.has(slotModuleKey) ?? false);

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
          hideDuringDrag={hideAssignedModule}
          onLinkHover={() => onLinkHover?.(moduleRef)}
          onLinkLeave={onLinkLeave}
          onLinkSelect={() => onLinkSelect?.(moduleRef)}
        />
      )}
      {previewEntry && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <ModuleCard
            label={formatPortLaneLabel(
              previewEntry.blockLabel,
              previewEntry.member.moduleType,
              previewEntry.member.moduleIndex,
            )}
            variant={previewEntry.member.moduleType}
            orientation="vertical"
            grow={false}
            className={`h-full ${QUAD_MODULE_FIXED_WIDTH_CLASS} opacity-90 ring-2 ring-violet-300 ring-inset`}
            colorClassName={getModuleLinkColor(
              previewEntry.portColorIndex,
              true,
              false,
            )}
          />
        </div>
      )}
    </div>
  );
}
