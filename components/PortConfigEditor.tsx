"use client";

import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BlockCanvas } from "@/components/BlockCanvas";
import { ModuleCard } from "@/components/ModuleCard";
import { ModuleUnlinkDropZone } from "@/components/ModuleUnlinkDropZone";
import { PortDetailPanel } from "@/components/PortDetailPanel";
import { PortsPanel } from "@/components/PortsPanel";
import { getPortColor } from "@/components/port-colors";
import {
  assignModuleToLane,
  createPortAssignments,
  ensurePortAssignments,
  findModuleAssignment,
  getModuleLabel,
  highlightFromModule,
  highlightsMatch,
  MODULE_UNLINK_DROP_ID,
  parsePortLaneId,
  parseQuadModuleId,
  removeAssignmentsForBlock,
  unlinkModule,
} from "@/components/dnd-utils";
import type {
  ModuleType,
  ModuleLinkHighlight,
  Port,
  PortAssignments,
  PortBlock,
  PortSpeed,
  QuadModuleRef,
} from "@/types/port-config";

type ActiveModuleDrag = {
  blockId: string;
  moduleType: ModuleType;
  moduleIndex: number;
  isAssigned: boolean;
};

const restrictBlocksToHorizontalAxis: Modifier = (args) => {
  const activeId = String(args.active?.id ?? "");
  if (activeId.startsWith("quad-module:")) {
    return args.transform;
  }

  return restrictToHorizontalAxis(args);
};

export function PortConfigEditor() {
  const [blocks, setBlocks] = useState<PortBlock[]>([
    { id: "quad-1", label: "Quad 1" },
  ]);
  const [blockCounter, setBlockCounter] = useState(2);
  const [ports, setPorts] = useState<Port[]>([]);
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
  const [portAssignments, setPortAssignments] = useState<PortAssignments>({});
  const [activeModuleDrag, setActiveModuleDrag] =
    useState<ActiveModuleDrag | null>(null);
  const [hoveredLink, setHoveredLink] = useState<ModuleLinkHighlight | null>(
    null,
  );
  const [selectedLink, setSelectedLink] = useState<ModuleLinkHighlight | null>(
    null,
  );

  const activeLink = hoveredLink ?? selectedLink;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function addBlock() {
    setBlocks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: `Quad ${blockCounter}`,
      },
    ]);
    setBlockCounter((n) => n + 1);
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setPortAssignments((prev) => removeAssignmentsForBlock(prev, id));
  }

  function addPort(speed: PortSpeed) {
    const id = crypto.randomUUID();
    const port = { id, speed };
    setPorts((prev) => [...prev, port]);
    setPortAssignments((prev) => ({
      ...prev,
      [id]: createPortAssignments(port),
    }));
    setSelectedPortId(id);
  }

  function closePortDetail() {
    setSelectedPortId(null);
    clearLinkHighlight();
  }

  function clearLinkHighlight() {
    setHoveredLink(null);
    setSelectedLink(null);
  }

  function handleLinkHover(highlight: ModuleLinkHighlight | null) {
    setHoveredLink(highlight);
  }

  function handleLinkSelect(highlight: ModuleLinkHighlight) {
    setSelectedLink((prev) =>
      highlightsMatch(prev, highlight) ? null : highlight,
    );
  }

  function handleModuleLinkHover(module: QuadModuleRef) {
    setHoveredLink(highlightFromModule(portAssignments, ports, module));
  }

  function handleModuleLinkLeave() {
    setHoveredLink(null);
  }

  function handleModuleLinkSelect(module: QuadModuleRef) {
    const highlight = highlightFromModule(portAssignments, ports, module);
    if (!highlight) return;
    handleLinkSelect(highlight);
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Element;
      if (target.closest("[data-link-surface]")) return;
      clearLinkHighlight();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as
      | {
          type?: string;
          blockId?: string;
          moduleType?: ModuleType;
          moduleIndex?: number;
          isAssigned?: boolean;
        }
      | undefined;

    if (data?.type === "quad-module") {
      setActiveModuleDrag({
        blockId: data.blockId!,
        moduleType: data.moduleType!,
        moduleIndex: data.moduleIndex!,
        isAssigned: data.isAssigned === true,
      });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveModuleDrag(null);

    const { active, over } = event;
    if (!over) return;

    const moduleRef = parseQuadModuleId(String(active.id));
    if (moduleRef) {
      if (String(over.id) === MODULE_UNLINK_DROP_ID) {
        if (findModuleAssignment(portAssignments, ports, moduleRef)) {
          setPortAssignments((prev) => unlinkModule(prev, moduleRef));
          clearLinkHighlight();
        }
        return;
      }

      const lane = parsePortLaneId(String(over.id));
      if (!lane || moduleRef.moduleType !== lane.moduleType) return;

      if (findModuleAssignment(portAssignments, ports, moduleRef)) return;

      const port = ports.find((item) => item.id === lane.portId);
      if (!port) return;

      const portLanes = ensurePortAssignments(portAssignments, port)[port.id];
      if (portLanes[lane.moduleType][lane.laneIndex]) return;

      setPortAssignments((prev) =>
        assignModuleToLane(prev, port, lane.moduleType, lane.laneIndex, moduleRef),
      );
      return;
    }

    if (active.id === over.id) return;

    const oldIndex = blocks.findIndex((block) => block.id === active.id);
    const newIndex = blocks.findIndex((block) => block.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    setBlocks(arrayMove(blocks, oldIndex, newIndex));
  }

  const selectedPort = ports.find((port) => port.id === selectedPortId) ?? null;
  const selectedPortColorIndex = selectedPort
    ? ports.findIndex((port) => port.id === selectedPortId)
    : -1;
  const selectedPortAssignments = useMemo(() => {
    if (!selectedPort) return null;
    return ensurePortAssignments(portAssignments, selectedPort)[selectedPort.id];
  }, [portAssignments, selectedPort]);

  const getModuleColor = useCallback(
    (blockId: string, moduleType: ModuleType, moduleIndex: number) => {
      const assignment = findModuleAssignment(portAssignments, ports, {
        blockId,
        moduleType,
        moduleIndex,
      });
      if (!assignment) return undefined;
      return getPortColor(assignment.colorIndex);
    },
    [portAssignments, ports],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictBlocksToHorizontalAxis]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full min-h-screen flex-col bg-zinc-100">
        <header className="border-b border-zinc-200 bg-white px-6 py-4 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Interface</h1>
        </header>

        <main className="flex min-h-0 flex-1 flex-col gap-4 p-6">
          <div className="min-h-0 flex-1 overflow-x-auto">
            <BlockCanvas
              blocks={blocks}
              onRemove={removeBlock}
              onAddBlock={addBlock}
              getModuleColor={getModuleColor}
              activeLink={activeLink}
              onModuleLinkHover={handleModuleLinkHover}
              onModuleLinkLeave={handleModuleLinkLeave}
              onModuleLinkSelect={handleModuleLinkSelect}
            />
          </div>
          <div className="flex min-h-0 flex-1 items-start gap-4">
            <PortsPanel
              ports={ports}
              onSelectPort={(id) => {
                setSelectedPortId(id);
                clearLinkHighlight();
              }}
              onAddPort={addPort}
            />
            <ModuleUnlinkDropZone />
            {selectedPort && selectedPortAssignments && (
              <PortDetailPanel
                port={selectedPort}
                blocks={blocks}
                colorIndex={selectedPortColorIndex}
                assignments={selectedPortAssignments}
                activeLink={activeLink}
                onLinkHover={handleLinkHover}
                onLinkSelect={handleLinkSelect}
                onClearLink={clearLinkHighlight}
                onClose={closePortDetail}
              />
            )}
          </div>
        </main>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeModuleDrag ? (
          <ModuleCard
            label={getModuleLabel(
              activeModuleDrag.moduleType,
              activeModuleDrag.moduleIndex,
            )}
            variant={activeModuleDrag.moduleType}
            orientation="vertical"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
