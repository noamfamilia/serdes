"use client";

import type { MouseEvent } from "react";
import { getModuleLinkColor } from "@/components/port-colors";
import { highlightFromLane, isLaneLinked } from "@/components/dnd-utils";
import { ModuleCard } from "@/components/ModuleCard";
import { QUAD_MODULE_FIXED_WIDTH_CLASS } from "@/components/quad-module-dimensions";
import type { ModuleLinkHighlight, ModuleType, QuadModuleRef } from "@/types/port-config";

type PortLaneDisplayProps = {
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

export function PortLaneDisplay({
  portId,
  moduleType,
  laneIndex,
  label,
  assignment,
  colorIndex,
  activeLink,
  onLinkHover,
  onLinkSelect,
}: PortLaneDisplayProps) {
  const isLinked = isLaneLinked(activeLink, portId, moduleType, laneIndex);

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
      data-link-surface=""
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      className="shrink-0 cursor-pointer"
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
      />
    </div>
  );
}
