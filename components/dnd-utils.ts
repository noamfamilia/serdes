import type {
  ModuleLinkHighlight,
  ModuleType,
  Port,
  PortAssignments,
  PortBlock,
  QuadModuleRef,
} from "@/types/port-config";
import { getPortLaneCount } from "@/types/port-config";

export function quadModuleId(
  blockId: string,
  moduleType: ModuleType,
  moduleIndex: number,
) {
  return `quad-module:${blockId}:${moduleType}:${moduleIndex}`;
}

export function portLaneId(
  portId: string,
  moduleType: ModuleType,
  laneIndex: number,
) {
  return `port-lane:${portId}:${moduleType}:${laneIndex}`;
}

export const MODULE_UNLINK_DROP_ID = "module-unlink-drop";

export function parseQuadModuleId(id: string): QuadModuleRef | null {
  const match = /^quad-module:([^:]+):(rx|tx):(\d+)$/.exec(id);
  if (!match) return null;

  return {
    blockId: match[1],
    moduleType: match[2] as ModuleType,
    moduleIndex: Number(match[3]),
  };
}

export function parsePortLaneId(
  id: string,
): { portId: string; moduleType: ModuleType; laneIndex: number } | null {
  const match = /^port-lane:([^:]+):(rx|tx):(\d+)$/.exec(id);
  if (!match) return null;

  return {
    portId: match[1],
    moduleType: match[2] as ModuleType,
    laneIndex: Number(match[3]),
  };
}

export function moduleRefKey(ref: QuadModuleRef) {
  return `${ref.blockId}:${ref.moduleType}:${ref.moduleIndex}`;
}

export function createPortAssignments(port: Port): PortAssignments[string] {
  const laneCount = getPortLaneCount(port.speed);
  return {
    rx: Array.from({ length: laneCount }, () => null),
    tx: Array.from({ length: laneCount }, () => null),
  };
}

export function ensurePortAssignments(
  assignments: PortAssignments,
  port: Port,
): PortAssignments {
  const existing = assignments[port.id];
  const laneCount = getPortLaneCount(port.speed);

  if (existing && existing.rx.length === laneCount) {
    return assignments;
  }

  return {
    ...assignments,
    [port.id]: createPortAssignments(port),
  };
}

export function assignModuleToLane(
  assignments: PortAssignments,
  port: Port,
  moduleType: ModuleType,
  laneIndex: number,
  module: QuadModuleRef,
): PortAssignments {
  const next = ensurePortAssignments(assignments, port);
  const portAssignment = {
    rx: [...next[port.id].rx],
    tx: [...next[port.id].tx],
  };

  for (const type of ["rx", "tx"] as const) {
    portAssignment[type] = portAssignment[type].map((assigned) =>
      assigned && moduleRefKey(assigned) === moduleRefKey(module)
        ? null
        : assigned,
    );
  }

  portAssignment[moduleType][laneIndex] = module;

  return {
    ...next,
    [port.id]: portAssignment,
  };
}

export function unlinkModule(
  assignments: PortAssignments,
  module: QuadModuleRef,
): PortAssignments {
  const key = moduleRefKey(module);
  const next: PortAssignments = {};

  for (const [portId, lanes] of Object.entries(assignments)) {
    next[portId] = {
      rx: lanes.rx.map((assigned) =>
        assigned && moduleRefKey(assigned) === key ? null : assigned,
      ),
      tx: lanes.tx.map((assigned) =>
        assigned && moduleRefKey(assigned) === key ? null : assigned,
      ),
    };
  }

  return next;
}

export function removeAssignmentsForBlock(
  assignments: PortAssignments,
  blockId: string,
): PortAssignments {
  const next: PortAssignments = {};

  for (const [portId, lanes] of Object.entries(assignments)) {
    next[portId] = {
      rx: lanes.rx.map((assigned) =>
        assigned?.blockId === blockId ? null : assigned,
      ),
      tx: lanes.tx.map((assigned) =>
        assigned?.blockId === blockId ? null : assigned,
      ),
    };
  }

  return next;
}

export function removeAssignmentsForPort(
  assignments: PortAssignments,
  portId: string,
): PortAssignments {
  const next = { ...assignments };
  delete next[portId];
  return next;
}

export function getModuleLabel(moduleType: ModuleType, moduleIndex: number) {
  return `${moduleType.toUpperCase()} ${moduleIndex + 1}`;
}

export function formatPortLaneLabel(
  blockLabel: string,
  moduleType: ModuleType,
  moduleIndex: number,
) {
  const quad = blockLabel.replace(/\s/g, "");
  return `${quad}/${moduleType.toUpperCase()}${moduleIndex + 1}`;
}

export function getPortLaneLabel(
  blocks: PortBlock[],
  assignment: QuadModuleRef | null,
  moduleType: ModuleType,
) {
  if (assignment) {
    const block = blocks.find((item) => item.id === assignment.blockId);
    if (block) {
      return formatPortLaneLabel(
        block.label,
        assignment.moduleType,
        assignment.moduleIndex,
      );
    }
  }

  return moduleType.toUpperCase();
}

export function findModuleAssignment(
  assignments: PortAssignments,
  ports: Port[],
  ref: QuadModuleRef,
): {
  portId: string;
  colorIndex: number;
  moduleType: ModuleType;
  laneIndex: number;
} | null {
  const key = moduleRefKey(ref);

  for (let colorIndex = 0; colorIndex < ports.length; colorIndex++) {
    const port = ports[colorIndex];
    const lanes = assignments[port.id];
    if (!lanes) continue;

    for (const type of ["rx", "tx"] as const) {
      const laneIndex = lanes[type].findIndex(
        (assigned) => assigned && moduleRefKey(assigned) === key,
      );
      if (laneIndex !== -1) {
        return { portId: port.id, colorIndex, moduleType: type, laneIndex };
      }
    }
  }

  return null;
}

export function highlightFromLane(
  portId: string,
  moduleType: ModuleType,
  laneIndex: number,
  assignment: QuadModuleRef | null,
): ModuleLinkHighlight {
  if (assignment) {
    return {
      kind: "assigned",
      module: assignment,
      portId,
      moduleType,
      laneIndex,
    };
  }

  return { kind: "lane", portId, moduleType, laneIndex };
}

export function highlightFromModule(
  assignments: PortAssignments,
  ports: Port[],
  module: QuadModuleRef,
): ModuleLinkHighlight | null {
  const found = findModuleAssignment(assignments, ports, module);
  if (!found) return null;

  return {
    kind: "assigned",
    module,
    portId: found.portId,
    moduleType: found.moduleType,
    laneIndex: found.laneIndex,
  };
}

export function highlightsMatch(
  a: ModuleLinkHighlight | null,
  b: ModuleLinkHighlight | null,
): boolean {
  if (!a || !b) return false;
  if (a.kind !== b.kind) return false;

  if (a.kind === "lane" && b.kind === "lane") {
    return (
      a.portId === b.portId &&
      a.moduleType === b.moduleType &&
      a.laneIndex === b.laneIndex
    );
  }

  if (a.kind === "assigned" && b.kind === "assigned") {
    return (
      a.portId === b.portId &&
      a.moduleType === b.moduleType &&
      a.laneIndex === b.laneIndex &&
      moduleRefKey(a.module) === moduleRefKey(b.module)
    );
  }

  return false;
}

export function isLaneLinked(
  highlight: ModuleLinkHighlight | null,
  portId: string,
  moduleType: ModuleType,
  laneIndex: number,
): boolean {
  if (!highlight) return false;

  return (
    highlight.portId === portId &&
    highlight.moduleType === moduleType &&
    highlight.laneIndex === laneIndex
  );
}

export function isModuleLinked(
  highlight: ModuleLinkHighlight | null,
  module: QuadModuleRef,
): boolean {
  if (!highlight || highlight.kind !== "assigned") return false;
  return moduleRefKey(highlight.module) === moduleRefKey(module);
}
