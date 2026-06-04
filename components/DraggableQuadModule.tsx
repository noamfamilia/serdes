"use client";

import { useDraggable } from "@dnd-kit/core";
import { MODULE_LINK_HIGHLIGHT } from "@/components/port-colors";
import { quadModuleId } from "@/components/dnd-utils";
import { ModuleCard } from "@/components/ModuleCard";
import type { ModuleType } from "@/types/port-config";

type DraggableQuadModuleProps = {
  blockId: string;
  moduleType: ModuleType;
  moduleIndex: number;
  size?: "default" | "sm";
  colorClassName?: string;
  isAssigned?: boolean;
  isLinked?: boolean;
  onLinkHover?: () => void;
  onLinkLeave?: () => void;
  onLinkSelect?: () => void;
};

export function DraggableQuadModule({
  blockId,
  moduleType,
  moduleIndex,
  size = "default",
  colorClassName,
  isAssigned = false,
  isLinked = false,
  onLinkHover,
  onLinkLeave,
  onLinkSelect,
}: DraggableQuadModuleProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: quadModuleId(blockId, moduleType, moduleIndex),
    data: {
      type: "quad-module",
      blockId,
      moduleType,
      moduleIndex,
      isAssigned,
    },
  });

  const label = `${moduleType.toUpperCase()} ${moduleIndex + 1}`;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onPointerEnter={onLinkHover}
      onPointerLeave={onLinkLeave}
      onClick={onLinkSelect}
      className={`min-w-0 flex-1 touch-none ${isDragging ? "cursor-grabbing opacity-40" : "cursor-grab"}`}
      data-link-surface=""
    >
      <ModuleCard
        label={label}
        variant={moduleType}
        orientation="vertical"
        size={size}
        colorClassName={colorClassName}
        highlightClassName={isLinked ? MODULE_LINK_HIGHLIGHT : undefined}
      />
    </div>
  );
}
