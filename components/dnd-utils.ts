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

export function quadSlotId(
  blockId: string,
  moduleType: ModuleType,
  moduleIndex: number,
) {
  return `quad-slot:${blockId}:${moduleType}:${moduleIndex}`;
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

export function parseQuadSlotId(id: string): QuadModuleRef | null {
  const match = /^quad-slot:([^:]+):(rx|tx):(\d+)$/.exec(id);
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
  const match = /^port-lane:(.+):(rx|tx):(\d+)$/.exec(id);
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

export function swapModuleLanes(
  assignments: PortAssignments,
  port: Port,
  module: QuadModuleRef,
  source: {
    moduleType: ModuleType;
    laneIndex: number;
  },
  targetLaneIndex: number,
): PortAssignments {
  const lanes = ensurePortAssignments(assignments, port)[port.id];
  const targetModule = lanes[module.moduleType][targetLaneIndex];
  if (!targetModule) return assignments;

  let next = unlinkModule(assignments, module);
  next = unlinkModule(next, targetModule);
  next = assignModuleToLane(
    next,
    port,
    module.moduleType,
    targetLaneIndex,
    module,
  );
  next = assignModuleToLane(
    next,
    port,
    source.moduleType,
    source.laneIndex,
    targetModule,
  );

  return next;
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

export function unlinkPort(
  assignments: PortAssignments,
  portId: string,
): PortAssignments {
  const lanes = assignments[portId];
  if (!lanes) return assignments;

  let next = assignments;
  for (const type of ["rx", "tx"] as const) {
    for (const module of lanes[type]) {
      if (module) {
        next = unlinkModule(next, module);
      }
    }
  }

  return next;
}

export function getPortGroupForModule(
  assignments: PortAssignments,
  ports: Port[],
  module: QuadModuleRef,
): {
  portId: string;
  rx: { laneIndex: number; module: QuadModuleRef }[];
  tx: { laneIndex: number; module: QuadModuleRef }[];
} | null {
  const found = findModuleAssignment(assignments, ports, module);
  if (!found) return null;

  const lanes = assignments[found.portId];
  if (!lanes) return null;

  const rx = lanes.rx.flatMap((assigned, laneIndex) =>
    assigned ? [{ laneIndex, module: assigned }] : [],
  );
  const tx = lanes.tx.flatMap((assigned, laneIndex) =>
    assigned ? [{ laneIndex, module: assigned }] : [],
  );

  return { portId: found.portId, rx, tx };
}

export function resolveGroupShiftTargetLane(
  anchor: QuadModuleRef,
  sourceLane: number,
  targetRef: QuadModuleRef,
  targetAssignment: {
    portId: string;
    laneIndex: number;
  } | null,
  sourcePortId: string,
): number | null {
  if (targetAssignment) {
    if (targetAssignment.portId !== sourcePortId) return null;
    return targetAssignment.laneIndex;
  }

  if (
    anchor.blockId === targetRef.blockId &&
    anchor.moduleType === targetRef.moduleType
  ) {
    return sourceLane + (targetRef.moduleIndex - anchor.moduleIndex);
  }

  return null;
}

export function reassignPortGroupByModuleIndexOffset(
  assignments: PortAssignments,
  ports: Port[],
  port: Port,
  moduleIndexOffset: number,
): PortAssignments | null {
  if (moduleIndexOffset === 0) return assignments;

  const lanes = ensurePortAssignments(assignments, port)[port.id];
  const laneCount = getPortLaneCount(port.speed);

  for (let laneIndex = 0; laneIndex < laneCount; laneIndex++) {
    for (const type of ["rx", "tx"] as const) {
      const module = lanes[type][laneIndex];
      if (!module) continue;

      const nextIndex = module.moduleIndex + moduleIndexOffset;
      if (nextIndex < 0 || nextIndex > 3) return null;

      const nextRef: QuadModuleRef = {
        blockId: module.blockId,
        moduleType: type,
        moduleIndex: nextIndex,
      };
      const existing = findModuleAssignment(assignments, ports, nextRef);
      if (existing && existing.portId !== port.id) return null;
    }
  }

  const newRx = [...lanes.rx];
  const newTx = [...lanes.tx];

  for (let laneIndex = 0; laneIndex < laneCount; laneIndex++) {
    for (const type of ["rx", "tx"] as const) {
      const module = lanes[type][laneIndex];
      if (!module) continue;

      const nextRef: QuadModuleRef = {
        blockId: module.blockId,
        moduleType: type,
        moduleIndex: module.moduleIndex + moduleIndexOffset,
      };

      if (type === "rx") {
        newRx[laneIndex] = nextRef;
      } else {
        newTx[laneIndex] = nextRef;
      }
    }
  }

  return {
    ...assignments,
    [port.id]: { rx: newRx, tx: newTx },
  };
}

export function shiftPortAssignments(
  assignments: PortAssignments,
  port: Port,
  sourceLane: number,
  targetLane: number,
): PortAssignments | null {
  const offset = targetLane - sourceLane;
  if (offset === 0) return assignments;

  const lanes = ensurePortAssignments(assignments, port)[port.id];
  const laneCount = getPortLaneCount(port.speed);
  const newRx: (QuadModuleRef | null)[] = Array.from(
    { length: laneCount },
    () => null,
  );
  const newTx: (QuadModuleRef | null)[] = Array.from(
    { length: laneCount },
    () => null,
  );

  for (const type of ["rx", "tx"] as const) {
    const source = lanes[type];
    const target = type === "rx" ? newRx : newTx;

    for (let laneIndex = 0; laneIndex < laneCount; laneIndex++) {
      const module = source[laneIndex];
      if (!module) continue;

      const nextLane = laneIndex + offset;
      if (nextLane < 0 || nextLane >= laneCount) return null;
      if (target[nextLane]) return null;

      target[nextLane] = module;
    }
  }

  return {
    ...assignments,
    [port.id]: { rx: newRx, tx: newTx },
  };
}

export function assignPortGroupFromAnchor(
  assignments: PortAssignments,
  ports: Port[],
  port: Port,
  anchor: QuadModuleRef,
  targetLane: number,
): PortAssignments | null {
  const laneCount = getPortLaneCount(port.speed);
  const next = ensurePortAssignments(assignments, port);
  const current = next[port.id];

  for (let lane = 0; lane < laneCount; lane++) {
    const moduleIndex = anchor.moduleIndex + (lane - targetLane);
    if (moduleIndex < 0 || moduleIndex > 3) return null;

    for (const type of ["rx", "tx"] as const) {
      if (current[type][lane]) return null;

      const ref: QuadModuleRef = {
        blockId: anchor.blockId,
        moduleType: type,
        moduleIndex,
      };
      if (findModuleAssignment(next, ports, ref)) return null;
    }
  }

  let result = next;
  for (let lane = 0; lane < laneCount; lane++) {
    const moduleIndex = anchor.moduleIndex + (lane - targetLane);
    const rxRef: QuadModuleRef = {
      blockId: anchor.blockId,
      moduleType: "rx",
      moduleIndex,
    };
    const txRef: QuadModuleRef = {
      blockId: anchor.blockId,
      moduleType: "tx",
      moduleIndex,
    };
    result = assignModuleToLane(result, port, "rx", lane, rxRef);
    result = assignModuleToLane(result, port, "tx", lane, txRef);
  }

  return result;
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
