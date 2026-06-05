"use client";

import { getModuleLinkColor } from "@/components/port-colors";
import { formatPortLaneLabel, moduleRefKey, quadModuleId } from "@/components/dnd-utils";
import { ModuleCard } from "@/components/ModuleCard";
import { QUAD_MODULE_FIXED_WIDTH_CLASS } from "@/components/quad-module-dimensions";
import { useDraggable } from "@dnd-kit/core";
import type { ModuleType } from "@/types/port-config";

type LinkedQuadModuleProps = {
  blockId: string;
  blockLabel: string;
  moduleType: ModuleType;
  moduleIndex: number;
  portColorIndex: number;
  isLinked?: boolean;
  groupMode?: boolean;
  isInGroupDrag?: boolean;
  onLinkHover?: () => void;
  onLinkLeave?: () => void;
  onLinkSelect?: () => void;
};

export function LinkedQuadModule({
  blockId,
  blockLabel,
  moduleType,
  moduleIndex,
  portColorIndex,
  isLinked = false,
  groupMode = false,
  isInGroupDrag = false,
  onLinkHover,
  onLinkLeave,
  onLinkSelect,
}: LinkedQuadModuleProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: quadModuleId(blockId, moduleType, moduleIndex),
    data: {
      type: "quad-module",
      blockId,
      moduleType,
      moduleIndex,
      isAssigned: true,
      groupMode,
    },
  });

  const label = formatPortLaneLabel(blockLabel, moduleType, moduleIndex);
  const moduleColor = getModuleLinkColor(portColorIndex, true, isLinked);
  const isHiddenDuringDrag = isDragging || isInGroupDrag;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onPointerEnter={onLinkHover}
      onPointerLeave={onLinkLeave}
      onClick={onLinkSelect}
      className={`absolute inset-0 z-10 touch-none ${
        isHiddenDuringDrag ? "invisible cursor-grabbing" : "cursor-grab"
      }`}
      data-link-surface=""
      data-module-key={moduleRefKey({ blockId, moduleType, moduleIndex })}
    >
      <ModuleCard
        label={label}
        variant={moduleType}
        orientation="vertical"
        grow={false}
        className={`h-full ${QUAD_MODULE_FIXED_WIDTH_CLASS}`}
        colorClassName={moduleColor}
      />
    </div>
  );
}
