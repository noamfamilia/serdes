"use client";

import { ModuleCard } from "@/components/ModuleCard";
import { LinkedQuadModule } from "@/components/LinkedQuadModule";
import { QUAD_MODULE_FIXED_WIDTH_CLASS } from "@/components/quad-module-dimensions";
import type { ModuleType, QuadModuleRef } from "@/types/port-config";

type QuadModuleSlotProps = {
  blockId: string;
  blockLabel: string;
  moduleType: ModuleType;
  moduleIndex: number;
  isAssigned: boolean;
  portColorIndex?: number;
  isLinked?: boolean;
  groupMode?: boolean;
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
  isLinked = false,
  groupMode = false,
  isInGroupDrag = false,
  onLinkHover,
  onLinkLeave,
  onLinkSelect,
}: QuadModuleSlotProps) {
  const moduleRef: QuadModuleRef = { blockId, moduleType, moduleIndex };
  const outlineLabel = moduleType.toUpperCase();

  return (
    <div className={`relative ${QUAD_MODULE_FIXED_WIDTH_CLASS} shrink-0`}>
      <ModuleCard
        label={outlineLabel}
        variant={moduleType}
        orientation="vertical"
        grow={false}
        outline
        className={QUAD_MODULE_FIXED_WIDTH_CLASS}
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
