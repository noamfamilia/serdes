"use client";

import type { PortBlock, ModuleType, ModuleLinkHighlight, QuadModuleRef } from "@/types/port-config";
import { PortBlock as PortBlockComponent } from "./PortBlock";

type BlockCanvasProps = {
  blocks: PortBlock[];
  getModulePortColorIndex?: (
    blockId: string,
    moduleType: ModuleType,
    moduleIndex: number,
  ) => number | undefined;
  getModuleLaneAssignment?: (
    blockId: string,
    moduleType: ModuleType,
    moduleIndex: number,
  ) => { portId: string; laneIndex: number } | undefined;
  activeLink?: ModuleLinkHighlight | null;
  groupMode?: boolean;
  activeGroupDrag?: {
    portId: string;
    sourceLane: number;
    isGroup: boolean;
  } | null;
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
  canGroupDropOnSlot?: (dropSlot: QuadModuleRef) => boolean;
  onModuleLinkHover?: (module: QuadModuleRef) => void;
  onModuleLinkLeave?: () => void;
  onModuleLinkSelect?: (module: QuadModuleRef) => void;
};

export function BlockCanvas({
  blocks,
  getModulePortColorIndex,
  getModuleLaneAssignment,
  activeLink,
  groupMode,
  activeGroupDrag,
  activeDragModuleKey,
  groupPreviewDisplay,
  canGroupDropOnSlot,
  onModuleLinkHover,
  onModuleLinkLeave,
  onModuleLinkSelect,
}: BlockCanvasProps) {
  const realBlocks = blocks.filter((block) => !block.isPlaceholder);
  const placeholderBlock = blocks.find((block) => block.isPlaceholder) ?? null;

  return (
    <div className="flex w-max max-w-full items-stretch gap-4 overflow-x-auto p-1 pb-2">
      {realBlocks.map((block) => (
        <div key={block.id} className="shrink-0 self-stretch">
          <PortBlockComponent
            block={block}
            getModulePortColorIndex={getModulePortColorIndex}
            getModuleLaneAssignment={getModuleLaneAssignment}
            activeLink={activeLink}
            groupMode={groupMode}
            activeGroupDrag={activeGroupDrag}
            activeDragModuleKey={activeDragModuleKey}
            groupPreviewDisplay={groupPreviewDisplay}
            canGroupDropOnSlot={canGroupDropOnSlot}
            onModuleLinkHover={onModuleLinkHover}
            onModuleLinkLeave={onModuleLinkLeave}
            onModuleLinkSelect={onModuleLinkSelect}
          />
        </div>
      ))}
      {placeholderBlock && (
        <div className="shrink-0 self-stretch">
          <PortBlockComponent
            block={placeholderBlock}
            getModulePortColorIndex={getModulePortColorIndex}
            getModuleLaneAssignment={getModuleLaneAssignment}
            activeLink={activeLink}
            groupMode={groupMode}
            activeGroupDrag={activeGroupDrag}
            activeDragModuleKey={activeDragModuleKey}
            groupPreviewDisplay={groupPreviewDisplay}
            canGroupDropOnSlot={canGroupDropOnSlot}
            onModuleLinkHover={onModuleLinkHover}
            onModuleLinkLeave={onModuleLinkLeave}
            onModuleLinkSelect={onModuleLinkSelect}
          />
        </div>
      )}
    </div>
  );
}
