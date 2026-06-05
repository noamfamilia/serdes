"use client";

import { formatPortLaneLabel } from "@/components/dnd-utils";
import { ModuleCard } from "@/components/ModuleCard";
import { QUAD_MODULE_FIXED_WIDTH_CLASS } from "@/components/quad-module-dimensions";
import type { PortBlock, QuadModuleRef } from "@/types/port-config";

type GroupDragOverlayProps = {
  blocks: PortBlock[];
  anchor: QuadModuleRef;
  groupModules: QuadModuleRef[];
};

function moduleLabel(blocks: PortBlock[], module: QuadModuleRef) {
  const block = blocks.find((item) => item.id === module.blockId);
  if (!block) {
    return `${module.moduleType.toUpperCase()}${module.moduleIndex + 1}`;
  }
  return formatPortLaneLabel(block.label, module.moduleType, module.moduleIndex);
}

export function GroupDragOverlay({
  blocks,
  anchor,
  groupModules,
}: GroupDragOverlayProps) {
  const rxModules = groupModules
    .filter((module) => module.moduleType === "rx")
    .sort((a, b) => a.moduleIndex - b.moduleIndex);
  const txModules = groupModules
    .filter((module) => module.moduleType === "tx")
    .sort((a, b) => a.moduleIndex - b.moduleIndex);

  if (rxModules.length === 0 && txModules.length === 0) {
    return (
      <ModuleCard
        label={moduleLabel(blocks, anchor)}
        variant={anchor.moduleType}
        orientation="vertical"
        grow={false}
        className={QUAD_MODULE_FIXED_WIDTH_CLASS}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {rxModules.length > 0 && (
        <div className="flex gap-1">
          {rxModules.map((module) => (
            <ModuleCard
              key={`rx-${module.blockId}-${module.moduleIndex}`}
              label={moduleLabel(blocks, module)}
              variant="rx"
              orientation="vertical"
              grow={false}
              className={QUAD_MODULE_FIXED_WIDTH_CLASS}
            />
          ))}
        </div>
      )}
      {txModules.length > 0 && (
        <div className="flex gap-1">
          {txModules.map((module) => (
            <ModuleCard
              key={`tx-${module.blockId}-${module.moduleIndex}`}
              label={moduleLabel(blocks, module)}
              variant="tx"
              orientation="vertical"
              grow={false}
              className={QUAD_MODULE_FIXED_WIDTH_CLASS}
            />
          ))}
        </div>
      )}
    </div>
  );
}
