import {
  assignModuleToLane,
  ensureBlocksForGlobalColumn,
  findModuleAssignment,
  globalColumnFromModule,
  globalColumnOffset,
  maxGroupDropTargetColumn,
  moduleRefFromGlobalColumn,
  moduleRefKey,
  unlinkModule,
} from "@/components/dnd-utils";
import type {
  Port,
  PortAssignments,
  PortBlock,
  QuadModuleRef,
} from "@/types/port-config";

export type GroupDropMove = {
  member: QuadModuleRef;
  target: QuadModuleRef;
  sourceLane: number;
};

export type GroupDropPlan =
  | {
      ok: true;
      moves: GroupDropMove[];
      columnOffset: number;
    }
  | {
      ok: false;
      error: string;
      details?: Record<string, unknown>;
    };

export function computeGroupMemberTarget(
  blocks: PortBlock[],
  member: QuadModuleRef,
  anchor: QuadModuleRef,
  dropSlot: QuadModuleRef,
): QuadModuleRef | null {
  const offset = globalColumnOffset(blocks, anchor, dropSlot);
  if (offset === null) return null;

  const memberColumn = globalColumnFromModule(blocks, member);
  if (memberColumn === null) return null;

  return moduleRefFromGlobalColumn(
    blocks,
    memberColumn + offset,
    member.moduleType,
  );
}

export function planGroupDrop(
  blocks: PortBlock[],
  assignments: PortAssignments,
  ports: Port[],
  port: Port,
  anchor: QuadModuleRef,
  groupModules: QuadModuleRef[],
  dropSlot: QuadModuleRef,
): GroupDropPlan {
  const columnOffset = globalColumnOffset(blocks, anchor, dropSlot);
  if (columnOffset === null) {
    return {
      ok: false,
      error: "group_drop_column_unresolved",
      details: { anchor, dropSlot },
    };
  }

  const groupKeys = new Set(groupModules.map(moduleRefKey));
  const moves: GroupDropMove[] = [];

  for (const member of groupModules) {
    const target = computeGroupMemberTarget(blocks, member, anchor, dropSlot);
    if (!target) {
      return {
        ok: false,
        error: "group_target_out_of_range",
        details: { member, columnOffset, dropSlot },
      };
    }

    const source = findModuleAssignment(assignments, ports, member);
    if (!source) {
      return {
        ok: false,
        error: "group_member_not_assigned",
        details: { member },
      };
    }

    if (source.portId !== port.id) {
      return {
        ok: false,
        error: "port_mismatch",
        details: {
          member,
          sourcePortId: source.portId,
          expectedPortId: port.id,
        },
      };
    }

    const targetAssignment = findModuleAssignment(assignments, ports, target);
    if (targetAssignment) {
      if (targetAssignment.portId !== port.id) {
        return {
          ok: false,
          error: "target_assigned_elsewhere",
          details: { target, targetAssignment },
        };
      }

      if (!groupKeys.has(moduleRefKey(target))) {
        return {
          ok: false,
          error: "group_target_occupied",
          details: { member, target, targetAssignment },
        };
      }
    }

    moves.push({
      member,
      target,
      sourceLane: source.laneIndex,
    });
  }

  return { ok: true, moves, columnOffset };
}

export function isGroupDropNoOp(moves: GroupDropMove[]): boolean {
  return moves.every(
    (move) => moduleRefKey(move.member) === moduleRefKey(move.target),
  );
}

export function applyGroupDrop(
  assignments: PortAssignments,
  port: Port,
  moves: GroupDropMove[],
): PortAssignments {
  let next = assignments;

  for (const move of moves) {
    next = unlinkModule(next, move.member);
  }

  for (const move of moves) {
    next = assignModuleToLane(
      next,
      port,
      move.target.moduleType,
      move.sourceLane,
      move.target,
    );
  }

  return next;
}

export type GroupDropPreview = {
  moves: GroupDropMove[];
  previewBlocks: PortBlock[];
};

export function buildGroupDropPreview(
  blocks: PortBlock[],
  blockCounter: number,
  assignments: PortAssignments,
  ports: Port[],
  port: Port,
  anchor: QuadModuleRef,
  groupModules: QuadModuleRef[],
  dropSlot: QuadModuleRef,
): GroupDropPreview | null {
  const prepared = prepareBlocksForGroupDrop(
    blocks,
    blockCounter,
    anchor,
    dropSlot,
    groupModules,
  );
  const plan = planGroupDrop(
    prepared.blocks,
    assignments,
    ports,
    port,
    anchor,
    groupModules,
    dropSlot,
  );
  if (!plan.ok || isGroupDropNoOp(plan.moves)) {
    return null;
  }

  return {
    moves: plan.moves,
    previewBlocks: prepared.blocks,
  };
}

export function prepareBlocksForGroupDrop(
  blocks: PortBlock[],
  blockCounter: number,
  anchor: QuadModuleRef,
  dropSlot: QuadModuleRef,
  groupModules: QuadModuleRef[],
): { blocks: PortBlock[]; blockCounter: number } {
  const maxColumn = maxGroupDropTargetColumn(
    blocks,
    anchor,
    dropSlot,
    groupModules,
  );
  if (maxColumn === null) {
    return { blocks, blockCounter };
  }

  return ensureBlocksForGlobalColumn(blocks, blockCounter, maxColumn);
}

export function canGroupDropOnSlot(
  blocks: PortBlock[],
  blockCounter: number,
  assignments: PortAssignments,
  ports: Port[],
  port: Port,
  anchor: QuadModuleRef,
  groupModules: QuadModuleRef[],
  dropSlot: QuadModuleRef,
): boolean {
  const prepared = prepareBlocksForGroupDrop(
    blocks,
    blockCounter,
    anchor,
    dropSlot,
    groupModules,
  );
  const plan = planGroupDrop(
    prepared.blocks,
    assignments,
    ports,
    port,
    anchor,
    groupModules,
    dropSlot,
  );
  return plan.ok && !isGroupDropNoOp(plan.moves);
}
