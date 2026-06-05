"use client";

import { useEffect, useState } from "react";
import type {
  PortBlock as PortBlockType,
  ModuleType,
  ModuleLinkHighlight,
  QuadModuleRef,
} from "@/types/port-config";
import { isModuleLinked, moduleRefKey } from "@/components/dnd-utils";
import { ChannelBar } from "./ChannelBar";
import { ClockingDialog } from "./ClockingDialog";
import { ModuleCard } from "./ModuleCard";
import { QuadModuleSlot } from "./QuadModuleSlot";

type PortBlockProps = {
  block: PortBlockType;
  getModulePortColorIndex?: (
    blockId: string,
    moduleType: ModuleType,
    moduleIndex: number,
  ) => number | undefined;
  activeLink?: ModuleLinkHighlight | null;
  groupMode?: boolean;
  groupModuleKeys?: Set<string>;
  onModuleLinkHover?: (module: QuadModuleRef) => void;
  onModuleLinkLeave?: () => void;
  onModuleLinkSelect?: (module: QuadModuleRef) => void;
};

export function PortBlock({
  block,
  getModulePortColorIndex,
  activeLink = null,
  groupMode = false,
  groupModuleKeys,
  onModuleLinkHover,
  onModuleLinkLeave,
  onModuleLinkSelect,
}: PortBlockProps) {
  const [clockingOpen, setClockingOpen] = useState(false);
  const isPlaceholder = block.isPlaceholder === true;

  useEffect(() => {
    if (!clockingOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setClockingOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clockingOpen]);

  function renderModuleSlot(moduleType: ModuleType, moduleIndex: number) {
    const portColorIndex = getModulePortColorIndex?.(
      block.id,
      moduleType,
      moduleIndex,
    );
    const moduleRef = { blockId: block.id, moduleType, moduleIndex };

    return (
      <QuadModuleSlot
        key={`${moduleType}-${moduleIndex}`}
        blockId={block.id}
        blockLabel={block.label}
        moduleType={moduleType}
        moduleIndex={moduleIndex}
        isAssigned={portColorIndex !== undefined}
        portColorIndex={portColorIndex}
        isLinked={isModuleLinked(activeLink, moduleRef)}
        groupMode={groupMode}
        isInGroupDrag={groupModuleKeys?.has(moduleRefKey(moduleRef))}
        onLinkHover={onModuleLinkHover}
        onLinkLeave={onModuleLinkLeave}
        onLinkSelect={onModuleLinkSelect}
      />
    );
  }

  return (
    <>
      <div className="flex w-[220px] shrink-0 flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-md">
        <div className="flex min-h-7 items-center justify-center py-0.5">
          {!isPlaceholder && (
            <h2 className="truncate text-center text-sm font-semibold text-zinc-800">
              {block.label}
            </h2>
          )}
        </div>

        <ModuleCard label="PMA" variant="config" outline />

        <div className="flex gap-1">
          <ChannelBar
            orientation="vertical"
            outline
            onClick={isPlaceholder ? undefined : () => setClockingOpen(true)}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex w-full gap-1">
              {Array.from({ length: 4 }, (_, i) => renderModuleSlot("rx", i))}
            </div>
            <div className="flex w-full gap-1">
              {Array.from({ length: 4 }, (_, i) => renderModuleSlot("tx", i))}
            </div>
          </div>
        </div>
      </div>

      {!isPlaceholder && (
        <ClockingDialog
          quadLabel={block.label}
          open={clockingOpen}
          onClose={() => setClockingOpen(false)}
        />
      )}
    </>
  );
}
