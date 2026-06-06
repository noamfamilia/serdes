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
  type DragMoveEvent,
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
import { ModuleCard } from "@/components/ModuleCard";
import { getPortColor } from "@/components/port-colors";
import { QUAD_MODULE_FIXED_WIDTH_CLASS } from "@/components/quad-module-dimensions";
import { PortBasicPanel } from "@/components/PortBasicPanel";
import {
  findClosestQuadSlotAtPointer,
  quadSlotCollision,
  resolveQuadSlotFromCollisions,
} from "@/components/quad-slot-collision";
import { PortMenuPanel, type PortMenuItem } from "@/components/PortMenuPanel";
import { PortsPanel } from "@/components/PortsPanel";
import {
  createInitialBlocks,
  ensureTrailingPlaceholder,
  getPlaceholderBlock,
  insertRealQuads,
  materializePlaceholderQuad,
  removeEmptyRealQuads,
  usesPlaceholderBlock,
} from "@/components/quad-blocks";
import {
  assignModuleToLane,
  buildPortAssignmentsForPort,
  collectAssignedModuleKeys,
  ensurePortAssignments,
  findFreeColumnsForPort,
  findModuleAssignment,
  formatPortLaneLabel,
  getPortGroupForModule,
  highlightFromModule,
  highlightsMatch,
  moduleRefKey,
  parseQuadModuleId,
  parseQuadSlotId,
  removeAssignmentsForPort,
  swapModuleLanes,
  unlinkModule,
} from "@/components/dnd-utils";
import type {
  ModuleType,
  ModuleLinkHighlight,
  Port,
  PortAssignments,
  PortBlock,
  QuadModuleRef,
} from "@/types/port-config";
import {
  generateUniquePortName,
  isPortConfigured,
  isPortNameUnique,
} from "@/types/port-config";
import {
  applyGroupDrop,
  buildGroupDropPreview,
  canGroupDropOnSlot,
  isGroupDropNoOp,
  planGroupDrop,
  prepareBlocksForGroupDrop,
  type GroupDropPreview,
} from "@/components/group-drop";

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
const MICRO_DRAG_CANCEL_THRESHOLD = 12;

export function PortConfigEditor() {
  const [blocks, setBlocks] = useState<PortBlock[]>(createInitialBlocks);
  const [blockCounter, setBlockCounter] = useState(1);
  const [ports, setPorts] = useState<Port[]>([]);
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
  const [activeMenuItem, setActiveMenuItem] = useState<PortMenuItem | null>(null);
  const [groupMode, setGroupMode] = useState(true);
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
  const [groupDropPreview, setGroupDropPreview] =
    useState<GroupDropPreview | null>(null);

  const activeLink = hoveredLink ?? selectedLink;

  const dragContextRef = useRef({
    blocks,
    blockCounter,
    portAssignments,
    ports,
    groupMode,
    selectedPortId,
    activeMenuItem: null as PortMenuItem | null,
    activeModuleDrag: null as ActiveModuleDrag | null,
  });
  const lastOverRef = useRef<string | null>(null);
  const lastLoggedOverRef = useRef<string | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const pointerListenerRef = useRef<((event: PointerEvent) => void) | null>(
    null,
  );
  const dragDiagnosticLogRef = useRef<DropDiagnosticEntry[]>([]);

  useEffect(() => {
    if (selectedPortId) {
      setActiveMenuItem("basic");
    }
  }, [selectedPortId]);

  useEffect(() => {
    dragContextRef.current.blocks = blocks;
    dragContextRef.current.blockCounter = blockCounter;
    dragContextRef.current.portAssignments = portAssignments;
    dragContextRef.current.ports = ports;
    dragContextRef.current.groupMode = groupMode;
    dragContextRef.current.selectedPortId = selectedPortId;
    dragContextRef.current.activeMenuItem = activeMenuItem;
  }, [blocks, blockCounter, portAssignments, ports, groupMode, selectedPortId, activeMenuItem]);

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

  function startPointerTracking() {
    stopPointerTracking();
    const listener = (event: PointerEvent) => {
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
    };
    pointerListenerRef.current = listener;
    window.addEventListener("pointermove", listener);
  }

  function stopPointerTracking() {
    const listener = pointerListenerRef.current;
    if (listener) {
      window.removeEventListener("pointermove", listener);
      pointerListenerRef.current = null;
    }
    lastPointerRef.current = null;
  }

  function rememberQuadSlotHover(
    overId: string | null,
    collisions: DragOverEvent["collisions"] | DragMoveEvent["collisions"],
  ) {
    const slotId = resolveQuadSlotFromCollisions(overId, collisions);
    if (slotId) {
      lastOverRef.current = slotId;
      if (slotId !== lastLoggedOverRef.current) {
        lastLoggedOverRef.current = slotId;
        appendDragDiagnostic("drag_over", "Pointer over quad slot", {
          overId: slotId,
          collisions: collisions?.map((collision) => String(collision.id)),
        });
      }
    }
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

    nextBlocks = removeEmptyRealQuads(nextBlocks, nextAssignments);

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
    setActiveMenuItem(null);
  }

  function addPort() {
    const id = crypto.randomUUID();
    const port: Port = {
      id,
      name: generateUniquePortName(ports),
      ratePerLane: null,
      laneCount: null,
      mode: null,
      colorIndex: 0,
    };

    setPorts((prev) => [...prev, port]);
    selectPort(id);
  }

  function renamePort(portId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed || !isPortNameUnique(ports, trimmed, portId)) {
      return false;
    }

    setPorts((prev) =>
      prev.map((port) =>
        port.id === portId ? { ...port, name: trimmed } : port,
      ),
    );
    return true;
  }

  function allocateConfiguredPort(
    nextPorts: Port[],
    portId: string,
    sourceBlocks: PortBlock[] = blocks,
    sourceCounter: number = blockCounter,
    sourceAssignments: PortAssignments = portAssignments,
  ) {
    const port = nextPorts.find((item) => item.id === portId);
    if (!port || !isPortConfigured(port)) return;

    const assignedKeys = collectAssignedModuleKeys(sourceAssignments, portId);
    const laneCount = port.laneCount ?? 0;
    const groupedAvailable = findFreeColumnsForPort(
      sourceBlocks,
      assignedKeys,
      port,
    ).length;
    const extraNeeded = Math.max(0, laneCount - groupedAvailable);
    const quadsNeeded = Math.ceil(extraNeeded / MODULES_PER_QUAD);

    let nextCounter = sourceCounter;
    let nextBlocks = insertRealQuads(sourceBlocks, quadsNeeded, nextCounter);
    if (quadsNeeded > 0) {
      nextCounter += quadsNeeded;
    }

    const columns = findFreeColumnsForPort(nextBlocks, assignedKeys, port);
    const clearedAssignments = removeAssignmentsForPort(sourceAssignments, portId);
    const nextPortAssignments = buildPortAssignmentsForPort(port, columns);
    const mergedAssignments = {
      ...clearedAssignments,
      [port.id]: nextPortAssignments,
    };

    applyAssignmentsAndBlocks(mergedAssignments, nextBlocks, nextCounter);
  }

  function updatePortConfig(
    portId: string,
    updates: Partial<
      Pick<Port, "ratePerLane" | "laneCount" | "mode" | "colorIndex">
    >,
  ) {
    const nextPorts = ports.map((port) =>
      port.id === portId ? { ...port, ...updates } : port,
    );
    const nextPort = nextPorts.find((port) => port.id === portId);
    if (!nextPort) return;

    setPorts(nextPorts);

    if (!isPortConfigured(nextPort)) {
      const nextAssignments = removeAssignmentsForPort(portAssignments, portId);
      applyAssignmentsAndBlocks(nextAssignments);
      return;
    }

    const layoutChanged =
      updates.laneCount !== undefined || updates.mode !== undefined;

    if (layoutChanged) {
      allocateConfiguredPort(nextPorts, portId);
    }
  }

  function selectPort(id: string) {
    setSelectedPortId(id);
    setActiveMenuItem("basic");
    clearLinkHighlight();
  }

  function handleMenuSelect(item: PortMenuItem) {
    setActiveMenuItem(item);
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
    setGroupDropPreview(null);
    lastOverRef.current = null;
    lastLoggedOverRef.current = null;
    startPointerTracking();
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
      activeMenuItem,
      ports: ports.map((port) => ({
        id: port.id,
        name: port.name,
        configured: isPortConfigured(port),
      })),
    });
  }

  function updateGroupDropPreview(resolvedSlotId: string | null) {
    const dragState = dragContextRef.current.activeModuleDrag;
    const {
      blocks: currentBlocks,
      blockCounter: currentBlockCounter,
      portAssignments: currentAssignments,
      ports: currentPorts,
      groupMode: currentGroupMode,
    } = dragContextRef.current;

    if (!currentGroupMode || !dragState?.isGroup || !resolvedSlotId) {
      setGroupDropPreview(null);
      return;
    }

    const dropSlot = parseQuadSlotId(resolvedSlotId);
    if (!dropSlot) {
      setGroupDropPreview(null);
      return;
    }

    const port = currentPorts.find((item) => item.id === dragState.portId);
    if (!port) {
      setGroupDropPreview(null);
      return;
    }

    const preview = buildGroupDropPreview(
      currentBlocks,
      currentBlockCounter,
      currentAssignments,
      currentPorts,
      port,
      dragState.anchor,
      dragState.groupModules,
      dropSlot,
    );
    setGroupDropPreview(preview);
  }

  function handleDragMove(event: DragMoveEvent) {
    const overId = event.over ? String(event.over.id) : null;
    rememberQuadSlotHover(overId, event.collisions);
    const resolvedSlotId =
      resolveQuadSlotFromCollisions(overId, event.collisions) ??
      lastOverRef.current;
    updateGroupDropPreview(resolvedSlotId);
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over ? String(event.over.id) : null;
    rememberQuadSlotHover(overId, event.collisions);
    const resolvedSlotId =
      resolveQuadSlotFromCollisions(overId, event.collisions) ??
      lastOverRef.current;
    updateGroupDropPreview(resolvedSlotId);
  }

  function handleDragCancel(event: DragCancelEvent) {
    appendDragDiagnostic("drag_cancel", "Drag canceled", {
      activeId: String(event.active.id),
    });
    commitDragDiagnostics(false, true);
    dragContextRef.current.activeModuleDrag = null;
    setActiveModuleDrag(null);
    setGroupDropPreview(null);
    lastOverRef.current = null;
    lastLoggedOverRef.current = null;
    stopPointerTracking();
  }

  function handleDragEnd(event: DragEndEvent) {
    const {
      blocks: currentBlocks,
      blockCounter: currentBlockCounter,
      portAssignments: currentAssignments,
      ports: currentPorts,
      groupMode: currentGroupMode,
      selectedPortId: currentSelectedPortId,
      activeMenuItem: currentActiveMenuItem,
      activeModuleDrag: dragState,
    } = dragContextRef.current;
    dragContextRef.current.activeModuleDrag = null;
    setActiveModuleDrag(null);
    setGroupDropPreview(null);

    const { active, collisions, delta } = event;
    const eventOverId = event.over ? String(event.over.id) : null;
    const collisionSlotIds =
      collisions?.map((collision) => String(collision.id)) ?? [];
    const collisionSlotId = resolveQuadSlotFromCollisions(
      eventOverId,
      collisions,
    );
    const lastOverBeforeClear = lastOverRef.current;
    const pointerFallback =
      dragState && lastPointerRef.current
        ? findClosestQuadSlotAtPointer(
            lastPointerRef.current,
            dragState.anchor.moduleType,
          )
        : null;
    const overId =
      collisionSlotId ?? lastOverBeforeClear ?? pointerFallback;
    const microDrag =
      Math.hypot(delta.x, delta.y) < MICRO_DRAG_CANCEL_THRESHOLD;
    lastOverRef.current = null;
    lastLoggedOverRef.current = null;
    stopPointerTracking();

    let applied = false;
    let failureReason: string | null = null;

    appendDragDiagnostic("drag_end", "Drag ended", {
      activeId: String(active.id),
      eventOverId,
      collisionSlotIds,
      collisionSlotId: collisionSlotId ?? null,
      lastOverRef: lastOverBeforeClear,
      pointerFallback,
      resolvedOverId: overId,
      delta,
      microDrag,
      groupMode: currentGroupMode,
      selectedPortId: currentSelectedPortId,
      activeMenuItem: currentActiveMenuItem,
      dragState,
      assignments: summarizePortAssignments(currentAssignments),
    });

    if (!dragState) {
      appendDragDiagnostic("reject", "No drag state captured on drag end");
      commitDragDiagnostics(false, true);
      return;
    }

    if (!overId) {
      if (microDrag) {
        commitDragDiagnostics(false, applied);
        return;
      }
      failureReason = "no_drop_target";
      appendDragDiagnostic("reject", failureReason, {
        hint: "No quad slot resolved from event.over, collisions, lastOverRef, or pointer fallback",
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

    const targetRef = parseQuadSlotId(overId);
    if (!targetRef) {
      failureReason = "invalid_quad_slot_id";
      appendDragDiagnostic("reject", failureReason, { overId });
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

    const port = currentPorts.find((item) => item.id === sourceAssignment.portId);
    if (!port) {
      failureReason = "port_not_found";
      appendDragDiagnostic("reject", failureReason, {
        sourcePortId: sourceAssignment.portId,
        knownPortIds: currentPorts.map((item) => item.id),
      });
      commitDragDiagnostics(true, applied);
      return;
    }

    if (currentGroupMode && dragState.isGroup && dragState.groupModules.length) {
      const prepared = prepareBlocksForGroupDrop(
        currentBlocks,
        currentBlockCounter,
        dragState.anchor,
        targetRef,
        dragState.groupModules,
      );
      const plan = planGroupDrop(
        prepared.blocks,
        currentAssignments,
        currentPorts,
        port,
        dragState.anchor,
        dragState.groupModules,
        targetRef,
      );

      if (!plan.ok) {
        failureReason = plan.error;
        appendDragDiagnostic("reject", failureReason, plan.details);
        commitDragDiagnostics(true, applied);
        return;
      }

      if (isGroupDropNoOp(plan.moves)) {
        commitDragDiagnostics(false, applied);
        return;
      }

      const nextAssignments = applyGroupDrop(
        currentAssignments,
        port,
        plan.moves,
      );
      applyAssignmentsAndBlocks(
        nextAssignments,
        prepared.blocks,
        prepared.blockCounter,
      );
      applied = true;
      appendDragDiagnostic("success", "Group drop applied", {
        columnOffset: plan.columnOffset,
        dropSlot: targetRef,
        moves: plan.moves.map((move) => ({
          from: move.member,
          to: move.target,
          lane: move.sourceLane,
        })),
      });
      commitDragDiagnostics(true, applied);
      return;
    }

    if (moduleRefKey(moduleRef) === moduleRefKey(targetRef)) {
      commitDragDiagnostics(false, applied);
      return;
    }

    if (moduleRef.moduleType !== targetRef.moduleType) {
      failureReason = "module_type_mismatch";
      appendDragDiagnostic("reject", failureReason, {
        draggedType: moduleRef.moduleType,
        targetSlotType: targetRef.moduleType,
      });
      commitDragDiagnostics(true, applied);
      return;
    }

    const targetAssignment = findModuleAssignment(
      currentAssignments,
      currentPorts,
      targetRef,
    );

    if (!targetAssignment) {
      applyAssignmentsAndBlocks(
        assignModuleToLane(
          unlinkModule(currentAssignments, moduleRef),
          port,
          sourceAssignment.moduleType,
          sourceAssignment.laneIndex,
          targetRef,
        ),
      );
      applied = true;
      appendDragDiagnostic("success", "Assigned canvas module to port lane", {
        sourceLane: sourceAssignment.laneIndex,
        targetRef,
      });
      commitDragDiagnostics(true, applied);
      return;
    }

    if (targetAssignment.portId !== sourceAssignment.portId) {
      failureReason = "port_mismatch";
      appendDragDiagnostic("reject", failureReason, {
        sourcePortId: sourceAssignment.portId,
        targetPortId: targetAssignment.portId,
        selectedPortId: currentSelectedPortId,
      });
      commitDragDiagnostics(true, applied);
      return;
    }

    const lane = {
      portId: targetAssignment.portId,
      moduleType: targetAssignment.moduleType,
      laneIndex: targetAssignment.laneIndex,
    };

    const isSameLane =
      sourceAssignment.moduleType === lane.moduleType &&
      sourceAssignment.laneIndex === lane.laneIndex;
    if (isSameLane) {
      commitDragDiagnostics(false, applied);
      return;
    }

    const portLanes = ensurePortAssignments(currentAssignments, port)[port.id];
    const targetModule = portLanes[lane.moduleType][lane.laneIndex];

    appendDragDiagnostic("target", "Resolved drop target", {
      targetRef,
      lane,
      targetModule,
      sourceAssignment,
      portName: port.name,
      portRate: port.ratePerLane,
      portLaneCount: port.laneCount,
      portMode: port.mode,
      portLanes: summarizePortAssignments({ [port.id]: portLanes })[port.id],
    });

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
  const selectedPortColorIndex = selectedPort?.colorIndex ?? 0;
  const selectedPortAssignments = useMemo(() => {
    if (!selectedPort || !isPortConfigured(selectedPort)) return null;
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

  const getModuleLaneAssignment = useCallback(
    (blockId: string, moduleType: ModuleType, moduleIndex: number) => {
      const assignment = findModuleAssignment(portAssignments, ports, {
        blockId,
        moduleType,
        moduleIndex,
      });
      if (!assignment) return undefined;
      return {
        portId: assignment.portId,
        laneIndex: assignment.laneIndex,
      };
    },
    [portAssignments, ports],
  );

  const activeDragModuleKey = activeModuleDrag
    ? moduleRefKey(activeModuleDrag.anchor)
    : null;

  const groupPreviewDisplay = useMemo(() => {
    if (!groupDropPreview || !activeModuleDrag?.isGroup) return null;

    const anchorKey = moduleRefKey(activeModuleDrag.anchor);
    const sourceHiddenKeys = new Set<string>();
    const targetPreview = new Map<
      string,
      {
        member: QuadModuleRef;
        portColorIndex: number;
        blockLabel: string;
      }
    >();

    for (const move of groupDropPreview.moves) {
      const memberKey = moduleRefKey(move.member);
      const targetKey = moduleRefKey(move.target);
      if (memberKey === targetKey) continue;

      if (memberKey !== anchorKey) {
        sourceHiddenKeys.add(memberKey);
      }

      if (targetKey !== anchorKey) {
        const block = groupDropPreview.previewBlocks.find(
          (item) => item.id === move.member.blockId,
        );
        targetPreview.set(targetKey, {
          member: move.member,
          portColorIndex: activeModuleDrag.colorIndex,
          blockLabel: block?.label ?? "",
        });
      }
    }

    return { sourceHiddenKeys, targetPreview };
  }, [groupDropPreview, activeModuleDrag]);

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

  const checkGroupDropOnSlot = useCallback(
    (dropSlot: QuadModuleRef) => {
      if (!activeModuleDrag?.isGroup || !activeModuleDrag.portId) return false;
      const port = ports.find((item) => item.id === activeModuleDrag.portId);
      if (!port) return false;
      const previewBlocks = groupDropPreview?.previewBlocks ?? blocks;
      return canGroupDropOnSlot(
        previewBlocks,
        blockCounter,
        portAssignments,
        ports,
        port,
        activeModuleDrag.anchor,
        activeModuleDrag.groupModules,
        dropSlot,
      );
    },
    [
      activeModuleDrag,
      blocks,
      blockCounter,
      groupDropPreview,
      portAssignments,
      ports,
    ],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={quadSlotCollision}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full min-h-screen flex-col bg-zinc-100">
        <header className="border-b border-zinc-200 bg-white px-6 py-4 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">
            FPGA High-Speed Serial Interface
          </h1>
        </header>

        <main className="flex min-h-0 flex-1 flex-col gap-4 p-6">
          <div className="flex h-[400px] shrink-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-md">
            <h2 className="shrink-0 bg-zinc-100 py-2.5 text-center text-sm font-semibold text-zinc-800">
              Ports
            </h2>
            <div className="flex min-h-0 flex-1 items-stretch bg-zinc-100">
              <PortsPanel
                ports={ports}
                selectedPortId={selectedPortId}
                onSelectPort={selectPort}
                onAddPort={addPort}
                onDeletePort={deletePort}
                onRenamePort={renamePort}
              />
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-zinc-100">
              <PortMenuPanel
                activeItem={activeMenuItem}
                onSelectItem={handleMenuSelect}
              />
              <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-white p-4">
                {!selectedPort ? (
                  <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-zinc-400">
                    Select a port to configure
                  </div>
                ) : activeMenuItem === "basic" ? (
                  <PortBasicPanel
                    port={selectedPort}
                    blocks={blocks}
                    assignments={selectedPortAssignments}
                    activeLink={activeLink}
                    groupMode={groupMode}
                    onRateChange={(rate) =>
                      updatePortConfig(selectedPort.id, { ratePerLane: rate })
                    }
                    onLaneCountChange={(laneCount) =>
                      updatePortConfig(selectedPort.id, { laneCount })
                    }
                    onModeChange={(mode) =>
                      updatePortConfig(selectedPort.id, { mode })
                    }
                    onColorChange={(colorIndex) =>
                      updatePortConfig(selectedPort.id, { colorIndex })
                    }
                    onGroupModeChange={setGroupMode}
                    onLinkHover={handleLinkHover}
                    onLinkSelect={handleLinkSelect}
                    onClearLink={clearLinkHighlight}
                  />
                ) : activeMenuItem === "menu1" ||
                  activeMenuItem === "menu2" ||
                  activeMenuItem === "menu3" ? (
                  <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-zinc-400">
                    {activeMenuItem === "menu1"
                      ? "Menu 1"
                      : activeMenuItem === "menu2"
                        ? "Menu 2"
                        : "Menu 3"}{" "}
                    — coming soon
                  </div>
                ) : (
                  <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-zinc-400">
                    Choose a tab above
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-md">
            <h2 className="shrink-0 bg-zinc-100 py-2.5 text-center text-sm font-semibold text-zinc-800">
              Layout
            </h2>
            <div className="min-h-0 flex-1 overflow-auto bg-zinc-100 p-4">
              <BlockCanvas
                blocks={groupDropPreview?.previewBlocks ?? blocks}
                getModulePortColorIndex={getModulePortColorIndex}
                getModuleLaneAssignment={getModuleLaneAssignment}
                activeLink={activeLink}
                groupMode={groupMode}
                activeGroupDrag={activeGroupDrag}
                activeDragModuleKey={activeDragModuleKey}
                groupPreviewDisplay={groupPreviewDisplay}
                canGroupDropOnSlot={checkGroupDropOnSlot}
                onModuleLinkHover={handleModuleLinkHover}
                onModuleLinkLeave={handleModuleLinkLeave}
                onModuleLinkSelect={handleModuleLinkSelect}
              />
            </div>
          </div>
        </main>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeModuleDrag ? (
          activeModuleDrag.isGroup ? (
            <ModuleCard
              label={formatPortLaneLabel(
                blocks.find(
                  (block) => block.id === activeModuleDrag.anchor.blockId,
                )?.label ?? "",
                activeModuleDrag.anchor.moduleType,
                activeModuleDrag.anchor.moduleIndex,
              )}
              variant={activeModuleDrag.anchor.moduleType}
              orientation="vertical"
              grow={false}
              className={QUAD_MODULE_FIXED_WIDTH_CLASS}
              colorClassName={getPortColor(activeModuleDrag.colorIndex)}
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
