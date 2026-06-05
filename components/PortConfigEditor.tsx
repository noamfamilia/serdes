"use client";

import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BlockCanvas } from "@/components/BlockCanvas";
import { DropDiagnosticPanel } from "@/components/DropDiagnosticPanel";
import {
  createDiagnosticEntry,
  summarizePortAssignments,
  type DropDiagnosticEntry,
} from "@/components/drop-diagnostics";
import { GroupDragOverlay } from "@/components/GroupDragOverlay";
import { ModuleCard } from "@/components/ModuleCard";
import { getPortColor } from "@/components/port-colors";
import { QUAD_MODULE_FIXED_WIDTH_CLASS } from "@/components/quad-module-dimensions";
import { PortDetailPanel } from "@/components/PortDetailPanel";
import { portLaneCollision } from "@/components/port-lane-collision";
import { PortMenuPanel, type PortMenuItem } from "@/components/PortMenuPanel";
import { PortsPanel } from "@/components/PortsPanel";
import {
  createInitialBlocks,
  ensureTrailingPlaceholder,
  getPlaceholderBlock,
  insertRealQuads,
  materializePlaceholderQuad,
  usesPlaceholderBlock,
} from "@/components/quad-blocks";
import {
  assignModuleToLane,
  createPortAssignments,
  ensurePortAssignments,
  findModuleAssignment,
  formatPortLaneLabel,
  getPortGroupForModule,
  highlightFromModule,
  highlightsMatch,
  moduleRefKey,
  parsePortLaneId,
  parseQuadModuleId,
  removeAssignmentsForPort,
  shiftPortAssignments,
  swapModuleLanes,
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
import { getPortLaneCount } from "@/types/port-config";

type ActiveModuleDrag = {
  anchor: QuadModuleRef;
  colorIndex: number;
  isAssigned: boolean;
  isGroup: boolean;
  portId?: string;
  sourceLane?: number;
  groupModules: QuadModuleRef[];
  sourceAssignment: {
    portId: string;
    moduleType: ModuleType;
    laneIndex: number;
  };
};

const MODULES_PER_QUAD = 4;

export function PortConfigEditor() {
  const [blocks, setBlocks] = useState<PortBlock[]>(createInitialBlocks);
  const [blockCounter, setBlockCounter] = useState(1);
  const [ports, setPorts] = useState<Port[]>([]);
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
  const [layoutPanelOpen, setLayoutPanelOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState<PortMenuItem | null>(null);
  const [groupMode, setGroupMode] = useState(false);
  const [portAssignments, setPortAssignments] = useState<PortAssignments>({});
  const [activeModuleDrag, setActiveModuleDrag] =
    useState<ActiveModuleDrag | null>(null);
  const [hoveredLink, setHoveredLink] = useState<ModuleLinkHighlight | null>(
    null,
  );
  const [selectedLink, setSelectedLink] = useState<ModuleLinkHighlight | null>(
    null,
  );
  const [diagnosticEntries, setDiagnosticEntries] = useState<
    DropDiagnosticEntry[]
  >([]);
  const [diagnosticPanelOpen, setDiagnosticPanelOpen] = useState(false);

  const activeLink = hoveredLink ?? selectedLink;

  const dragContextRef = useRef({
    portAssignments,
    ports,
    groupMode,
    selectedPortId,
    layoutPanelOpen,
    activeModuleDrag: null as ActiveModuleDrag | null,
  });
  const lastOverRef = useRef<string | null>(null);
  const lastLoggedOverRef = useRef<string | null>(null);
  const dragDiagnosticLogRef = useRef<DropDiagnosticEntry[]>([]);

  useEffect(() => {
    dragContextRef.current.portAssignments = portAssignments;
    dragContextRef.current.ports = ports;
    dragContextRef.current.groupMode = groupMode;
    dragContextRef.current.selectedPortId = selectedPortId;
    dragContextRef.current.layoutPanelOpen = layoutPanelOpen;
  }, [portAssignments, ports, groupMode, selectedPortId, layoutPanelOpen]);

  function appendDragDiagnostic(
    phase: string,
    message: string,
    data?: Record<string, unknown>,
  ) {
    dragDiagnosticLogRef.current.push(
      createDiagnosticEntry(phase, message, data),
    );
  }

  function commitDragDiagnostics(openOnFailure: boolean, applied: boolean) {
    const entries = [...dragDiagnosticLogRef.current];
    dragDiagnosticLogRef.current = [];
    setDiagnosticEntries(entries);
    if (openOnFailure && !applied) {
      setDiagnosticPanelOpen(true);
    }
  }

  function clearDiagnostics() {
    dragDiagnosticLogRef.current = [];
    setDiagnosticEntries([]);
    setDiagnosticPanelOpen(false);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  function applyAssignmentsAndBlocks(
    nextAssignments: PortAssignments,
    sourceBlocks: PortBlock[] = blocks,
    sourceCounter: number = blockCounter,
  ) {
    const placeholder = getPlaceholderBlock(sourceBlocks);
    let nextBlocks = ensureTrailingPlaceholder(sourceBlocks);
    let nextCounter = sourceCounter;

    if (placeholder && usesPlaceholderBlock(nextAssignments, placeholder.id)) {
      const materialized = materializePlaceholderQuad(nextBlocks, nextCounter);
      nextBlocks = materialized.blocks;
      nextCounter = materialized.blockCounter;
    }

    setBlocks(nextBlocks);
    setBlockCounter(nextCounter);
    setPortAssignments(nextAssignments);
  }

  function deletePort(portId: string) {
    const remaining = ports.filter((port) => port.id !== portId);
    setPorts(remaining);
    setPortAssignments((prev) => removeAssignmentsForPort(prev, portId));
    clearLinkHighlight();

    if (selectedPortId !== portId) return;

    const next = remaining[0];
    if (next) {
      selectPort(next.id);
      return;
    }

    setSelectedPortId(null);
    setLayoutPanelOpen(false);
    setActiveMenuItem(null);
  }

  function addPort(speed: PortSpeed) {
    const id = crypto.randomUUID();
    const port = { id, speed };

    const laneCount = getPortLaneCount(speed);
    const assignedKeys = new Set<string>();
    for (const lanes of Object.values(portAssignments)) {
      for (const type of ["rx", "tx"] as const) {
        for (const assigned of lanes[type]) {
          if (!assigned) continue;
          assignedKeys.add(
            `${assigned.blockId}:${assigned.moduleType}:${assigned.moduleIndex}`,
          );
        }
      }
    }

    const getFreeModules = (
      sourceBlocks: PortBlock[],
      moduleType: ModuleType,
      usedKeys: Set<string>,
    ) => {
      const refs: QuadModuleRef[] = [];

      for (const block of sourceBlocks) {
        for (let moduleIndex = 0; moduleIndex < MODULES_PER_QUAD; moduleIndex++) {
          const key = `${block.id}:${moduleType}:${moduleIndex}`;
          if (usedKeys.has(key)) continue;
          refs.push({ blockId: block.id, moduleType, moduleIndex });
        }
      }

      return refs;
    };

    const freeRx = getFreeModules(blocks, "rx", assignedKeys).length;
    const freeTx = getFreeModules(blocks, "tx", assignedKeys).length;
    const extraNeeded = Math.max(0, laneCount - freeRx, laneCount - freeTx);
    const quadsNeeded = Math.ceil(extraNeeded / MODULES_PER_QUAD);

    let nextCounter = blockCounter;
    let nextBlocks = insertRealQuads(blocks, quadsNeeded, nextCounter);
    if (quadsNeeded > 0) {
      nextCounter += quadsNeeded;
    }

    const nextAssignments = ensurePortAssignments(portAssignments, port);
    const nextPortAssignments = createPortAssignments(port);

    const freeRxRefs = getFreeModules(nextBlocks, "rx", assignedKeys);
    const freeTxRefs = getFreeModules(nextBlocks, "tx", assignedKeys);
    for (let laneIndex = 0; laneIndex < laneCount; laneIndex++) {
      nextPortAssignments.rx[laneIndex] = freeRxRefs[laneIndex] ?? null;
      nextPortAssignments.tx[laneIndex] = freeTxRefs[laneIndex] ?? null;
    }

    const mergedAssignments = {
      ...nextAssignments,
      [id]: nextPortAssignments,
    };

    setPorts((prev) => [...prev, port]);
    applyAssignmentsAndBlocks(mergedAssignments, nextBlocks, nextCounter);
    selectPort(id);
  }

  function selectPort(id: string) {
    setSelectedPortId(id);
    setActiveMenuItem("layout");
    setLayoutPanelOpen(true);
    clearLinkHighlight();
  }

  function closeLayoutPanel() {
    setLayoutPanelOpen(false);
    setActiveMenuItem(null);
    clearLinkHighlight();
  }

  function handleMenuSelect(item: PortMenuItem) {
    if (item === "delete") {
      if (selectedPortId) {
        deletePort(selectedPortId);
      }
      return;
    }

    if (item === "layout") {
      const nextOpen = !layoutPanelOpen;
      setLayoutPanelOpen(nextOpen);
      setActiveMenuItem(nextOpen ? "layout" : null);
      return;
    }

    setActiveMenuItem(item);
    setLayoutPanelOpen(false);
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
          groupMode?: boolean;
        }
      | undefined;

    if (data?.type !== "quad-module") return;

    const anchor: QuadModuleRef = {
      blockId: data.blockId!,
      moduleType: data.moduleType!,
      moduleIndex: data.moduleIndex!,
    };
    const assignment = findModuleAssignment(portAssignments, ports, anchor);
    if (!assignment) return;

    selectPort(assignment.portId);

    const isAssigned = true;
    const useGroupMode = data.groupMode === true;

    let isGroup = false;
    let portId: string | undefined;
    let sourceLane: number | undefined;
    let groupModules: QuadModuleRef[] = [anchor];

    if (useGroupMode) {
      const portGroup = getPortGroupForModule(
        portAssignments,
        ports,
        anchor,
      );
      if (portGroup) {
        isGroup = true;
        portId = portGroup.portId;
        sourceLane = assignment.laneIndex;
        groupModules = [
          ...portGroup.rx.map((entry) => entry.module),
          ...portGroup.tx.map((entry) => entry.module),
        ];
      }
    }

    const dragState = {
      anchor,
      colorIndex: assignment.colorIndex,
      isAssigned,
      isGroup,
      portId,
      sourceLane,
      groupModules,
      sourceAssignment: {
        portId: assignment.portId,
        moduleType: assignment.moduleType,
        laneIndex: assignment.laneIndex,
      },
    };

    setActiveModuleDrag(dragState);
    dragContextRef.current.activeModuleDrag = dragState;
    lastOverRef.current = null;
    lastLoggedOverRef.current = null;
    dragDiagnosticLogRef.current = [];
    appendDragDiagnostic("drag_start", "Drag started", {
      activeId: String(event.active.id),
      anchor,
      sourceAssignment: dragState.sourceAssignment,
      groupMode: useGroupMode,
      isGroup,
      portId,
      sourceLane,
      groupModules,
      selectedPortId,
      layoutPanelOpen,
      ports: ports.map((port) => ({ id: port.id, speed: port.speed })),
    });
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over ? String(event.over.id) : null;
    if (overId?.startsWith("port-lane:")) {
      lastOverRef.current = overId;
      if (overId !== lastLoggedOverRef.current) {
        lastLoggedOverRef.current = overId;
        appendDragDiagnostic("drag_over", "Pointer over port lane", {
          overId,
          collisions: event.collisions?.map((collision) => String(collision.id)),
        });
      }
    }
  }

  function handleDragCancel(event: DragCancelEvent) {
    appendDragDiagnostic("drag_cancel", "Drag canceled", {
      activeId: String(event.active.id),
    });
    commitDragDiagnostics(false, true);
    dragContextRef.current.activeModuleDrag = null;
    setActiveModuleDrag(null);
    lastOverRef.current = null;
    lastLoggedOverRef.current = null;
  }

  function handleDragEnd(event: DragEndEvent) {
    const {
      portAssignments: currentAssignments,
      ports: currentPorts,
      groupMode: currentGroupMode,
      selectedPortId: currentSelectedPortId,
      layoutPanelOpen: currentLayoutPanelOpen,
      activeModuleDrag: dragState,
    } = dragContextRef.current;
    dragContextRef.current.activeModuleDrag = null;
    setActiveModuleDrag(null);

    const { active, collisions, delta } = event;
    const eventOverId = event.over ? String(event.over.id) : null;
    const collisionLaneIds =
      collisions?.map((collision) => String(collision.id)) ?? [];
    const collisionLaneId = collisionLaneIds.find((id) =>
      id.startsWith("port-lane:"),
    );
    const lastOverBeforeClear = lastOverRef.current;
    const overId =
      (eventOverId?.startsWith("port-lane:") ? eventOverId : null) ??
      collisionLaneId ??
      lastOverBeforeClear;
    lastOverRef.current = null;
    lastLoggedOverRef.current = null;

    let applied = false;
    let failureReason: string | null = null;

    appendDragDiagnostic("drag_end", "Drag ended", {
      activeId: String(active.id),
      eventOverId,
      collisionLaneIds,
      collisionLaneId: collisionLaneId ?? null,
      lastOverRef: lastOverBeforeClear,
      resolvedOverId: overId,
      delta,
      groupMode: currentGroupMode,
      selectedPortId: currentSelectedPortId,
      layoutPanelOpen: currentLayoutPanelOpen,
      dragState,
      assignments: summarizePortAssignments(currentAssignments),
    });

    if (!dragState) {
      appendDragDiagnostic("reject", "No drag state captured on drag end");
      commitDragDiagnostics(false, true);
      return;
    }

    if (!overId) {
      failureReason = "no_drop_target";
      appendDragDiagnostic("reject", failureReason, {
        hint: "No port-lane resolved from event.over, collisions, or lastOverRef",
      });
      commitDragDiagnostics(true, applied);
      return;
    }

    const moduleRef = parseQuadModuleId(String(active.id));
    if (!moduleRef) {
      failureReason = "invalid_active_id";
      appendDragDiagnostic("reject", failureReason, {
        activeId: String(active.id),
      });
      commitDragDiagnostics(true, applied);
      return;
    }

    const lane = parsePortLaneId(overId);
    if (!lane) {
      failureReason = "invalid_port_lane_id";
      appendDragDiagnostic("reject", failureReason, { overId });
      commitDragDiagnostics(true, applied);
      return;
    }

    const port = currentPorts.find((item) => item.id === lane.portId);
    if (!port) {
      failureReason = "port_not_found";
      appendDragDiagnostic("reject", failureReason, {
        lanePortId: lane.portId,
        knownPortIds: currentPorts.map((item) => item.id),
      });
      commitDragDiagnostics(true, applied);
      return;
    }

    const sourceAssignment = dragState.sourceAssignment;
    if (!sourceAssignment) {
      failureReason = "missing_source_assignment";
      appendDragDiagnostic("reject", failureReason);
      commitDragDiagnostics(true, applied);
      return;
    }

    if (sourceAssignment.portId !== lane.portId) {
      failureReason = "port_mismatch";
      appendDragDiagnostic("reject", failureReason, {
        sourcePortId: sourceAssignment.portId,
        targetPortId: lane.portId,
        selectedPortId: currentSelectedPortId,
      });
      commitDragDiagnostics(true, applied);
      return;
    }

    if (moduleRef.moduleType !== lane.moduleType) {
      failureReason = "module_type_mismatch";
      appendDragDiagnostic("reject", failureReason, {
        draggedType: moduleRef.moduleType,
        targetLaneType: lane.moduleType,
      });
      commitDragDiagnostics(true, applied);
      return;
    }

    const isSameLane =
      sourceAssignment.moduleType === lane.moduleType &&
      sourceAssignment.laneIndex === lane.laneIndex;
    if (isSameLane) {
      failureReason = "same_lane";
      appendDragDiagnostic("reject", failureReason, {
        laneIndex: lane.laneIndex,
      });
      commitDragDiagnostics(true, applied);
      return;
    }

    const portLanes = ensurePortAssignments(currentAssignments, port)[port.id];
    const targetModule = portLanes[lane.moduleType][lane.laneIndex];

    appendDragDiagnostic("target", "Resolved drop target", {
      lane,
      targetModule,
      sourceAssignment,
      portSpeed: port.speed,
      portLanes: summarizePortAssignments({ [port.id]: portLanes })[port.id],
    });

    if (
      currentGroupMode &&
      dragState.isGroup &&
      dragState.portId === lane.portId &&
      dragState.sourceLane !== undefined &&
      dragState.sourceLane !== lane.laneIndex
    ) {
      const shifted = shiftPortAssignments(
        currentAssignments,
        port,
        dragState.sourceLane,
        lane.laneIndex,
      );
      if (shifted) {
        applyAssignmentsAndBlocks(shifted);
        applied = true;
        appendDragDiagnostic("success", "Group shift applied", {
          sourceLane: dragState.sourceLane,
          targetLane: lane.laneIndex,
        });
      } else {
        failureReason = "group_shift_failed";
        appendDragDiagnostic("reject", failureReason, {
          sourceLane: dragState.sourceLane,
          targetLane: lane.laneIndex,
        });
      }
      commitDragDiagnostics(true, applied);
      return;
    }

    if (targetModule === null) {
      applyAssignmentsAndBlocks(
        assignModuleToLane(
          unlinkModule(currentAssignments, moduleRef),
          port,
          lane.moduleType,
          lane.laneIndex,
          moduleRef,
        ),
      );
      applied = true;
      appendDragDiagnostic("success", "Moved module to empty lane", {
        targetLane: lane.laneIndex,
      });
      commitDragDiagnostics(true, applied);
      return;
    }

    if (
      !currentGroupMode &&
      moduleRefKey(targetModule) !== moduleRefKey(moduleRef)
    ) {
      applyAssignmentsAndBlocks(
        swapModuleLanes(
          currentAssignments,
          port,
          moduleRef,
          sourceAssignment,
          lane.laneIndex,
        ),
      );
      applied = true;
      appendDragDiagnostic("success", "Swapped modules between lanes", {
        sourceLane: sourceAssignment.laneIndex,
        targetLane: lane.laneIndex,
        targetModule,
      });
      commitDragDiagnostics(true, applied);
      return;
    }

    failureReason = "target_occupied_no_swap";
    appendDragDiagnostic("reject", failureReason, {
      targetModule,
      groupMode: currentGroupMode,
      hint: "Target lane occupied and swap/group rules did not apply",
    });
    commitDragDiagnostics(true, applied);
  }

  const selectedPort = ports.find((port) => port.id === selectedPortId) ?? null;
  const selectedPortColorIndex = selectedPort
    ? ports.findIndex((port) => port.id === selectedPortId)
    : -1;
  const selectedPortAssignments = useMemo(() => {
    if (!selectedPort) return null;
    return ensurePortAssignments(portAssignments, selectedPort)[selectedPort.id];
  }, [portAssignments, selectedPort]);

  const getModulePortColorIndex = useCallback(
    (blockId: string, moduleType: ModuleType, moduleIndex: number) => {
      const assignment = findModuleAssignment(portAssignments, ports, {
        blockId,
        moduleType,
        moduleIndex,
      });
      return assignment?.colorIndex;
    },
    [portAssignments, ports],
  );

  const groupModuleKeys = useMemo(() => {
    if (!activeModuleDrag?.isGroup) return new Set<string>();
    return new Set(activeModuleDrag.groupModules.map(moduleRefKey));
  }, [activeModuleDrag]);

  const activeGroupDrag =
    activeModuleDrag?.isGroup &&
    activeModuleDrag.portId &&
    activeModuleDrag.sourceLane !== undefined
      ? {
          portId: activeModuleDrag.portId,
          sourceLane: activeModuleDrag.sourceLane,
          isGroup: true,
        }
      : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={portLaneCollision}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full min-h-screen flex-col bg-zinc-100">
        <header className="border-b border-zinc-200 bg-white px-6 py-4 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Interface</h1>
        </header>

        <main className="flex min-h-0 flex-1 flex-col gap-4 p-6">
          <div className="flex min-h-0 flex-1 items-start gap-4">
            <PortsPanel
              ports={ports}
              selectedPortId={selectedPortId}
              onSelectPort={selectPort}
              onAddPort={addPort}
            />
            <PortMenuPanel
              activeItem={activeMenuItem}
              onSelectItem={handleMenuSelect}
            />
            {layoutPanelOpen && selectedPort && selectedPortAssignments && (
              <PortDetailPanel
                port={selectedPort}
                blocks={blocks}
                colorIndex={selectedPortColorIndex}
                assignments={selectedPortAssignments}
                activeLink={activeLink}
                groupMode={groupMode}
                activeGroupDrag={activeGroupDrag}
                onGroupModeChange={setGroupMode}
                onLinkHover={handleLinkHover}
                onLinkSelect={handleLinkSelect}
                onClearLink={clearLinkHighlight}
                onClose={closeLayoutPanel}
              />
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-x-auto">
            <BlockCanvas
              blocks={blocks}
              getModulePortColorIndex={getModulePortColorIndex}
              activeLink={activeLink}
              groupMode={groupMode}
              groupModuleKeys={groupModuleKeys}
              onModuleLinkHover={handleModuleLinkHover}
              onModuleLinkLeave={handleModuleLinkLeave}
              onModuleLinkSelect={handleModuleLinkSelect}
            />
          </div>
        </main>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeModuleDrag ? (
          activeModuleDrag.isGroup ? (
            <GroupDragOverlay
              blocks={blocks}
              anchor={activeModuleDrag.anchor}
              groupModules={activeModuleDrag.groupModules}
            />
          ) : (
            <ModuleCard
              label={formatPortLaneLabel(
                blocks.find((block) => block.id === activeModuleDrag.anchor.blockId)
                  ?.label ?? "",
                activeModuleDrag.anchor.moduleType,
                activeModuleDrag.anchor.moduleIndex,
              )}
              variant={activeModuleDrag.anchor.moduleType}
              orientation="vertical"
              grow={false}
              className={QUAD_MODULE_FIXED_WIDTH_CLASS}
              colorClassName={getPortColor(activeModuleDrag.colorIndex)}
            />
          )
        ) : null}
      </DragOverlay>

      {diagnosticPanelOpen && (
        <DropDiagnosticPanel
          entries={diagnosticEntries}
          onClear={clearDiagnostics}
          onClose={() => setDiagnosticPanelOpen(false)}
        />
      )}
    </DndContext>
  );
}
