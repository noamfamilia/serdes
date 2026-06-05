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
  groupModuleKeys?: Set<string>;
  activeGroupDrag?: {
    portId: string;
    sourceLane: number;
    isGroup: boolean;
  } | null;
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
  groupModuleKeys,
  activeGroupDrag,
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
            groupModuleKeys={groupModuleKeys}
            activeGroupDrag={activeGroupDrag}
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
            groupModuleKeys={groupModuleKeys}
            activeGroupDrag={activeGroupDrag}
            onModuleLinkHover={onModuleLinkHover}
            onModuleLinkLeave={onModuleLinkLeave}
            onModuleLinkSelect={onModuleLinkSelect}
          />
        </div>
      )}
    </div>
  );
}
