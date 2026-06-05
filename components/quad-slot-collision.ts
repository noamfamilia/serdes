import {
  pointerWithin,
  type Collision,
  type CollisionDetection,
} from "@dnd-kit/core";
import { parseQuadSlotId } from "@/components/dnd-utils";
import type { ModuleType } from "@/types/port-config";

export const QUAD_SLOT_SNAP_DISTANCE = 48;

function distanceToRect(
  point: { x: number; y: number },
  rect: { top: number; left: number; right: number; bottom: number },
) {
  const dx = Math.max(rect.left - point.x, 0, point.x - rect.right);
  const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom);
  return Math.hypot(dx, dy);
}

export function resolveQuadSlotFromCollisions(
  overId: string | null,
  collisions: Collision[] | null | undefined,
): string | null {
  if (overId?.startsWith("quad-slot:")) return overId;
  return (
    collisions
      ?.map((collision) => String(collision.id))
      .find((id) => id.startsWith("quad-slot:")) ?? null
  );
}

export function findClosestQuadSlotAtPointer(
  pointer: { x: number; y: number },
  moduleType: ModuleType,
): string | null {
  const nodes = document.querySelectorAll<HTMLElement>("[data-quad-slot-id]");
  let best: string | null = null;
  let bestDistance = Infinity;

  for (const node of nodes) {
    const id = node.dataset.quadSlotId;
    if (!id?.startsWith("quad-slot:")) continue;

    const slot = parseQuadSlotId(id);
    if (!slot || slot.moduleType !== moduleType) continue;

    const rect = node.getBoundingClientRect();
    const distance = distanceToRect(pointer, rect);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = id;
    }
  }

  if (best && bestDistance <= QUAD_SLOT_SNAP_DISTANCE) {
    return best;
  }

  return null;
}

function closestQuadSlotToPointer(
  args: Parameters<CollisionDetection>[0],
  moduleType?: ModuleType,
): Collision[] {
  const { pointerCoordinates, droppableContainers, droppableRects } = args;
  if (!pointerCoordinates) return [];

  let best: Collision | null = null;
  let bestDistance = Infinity;

  for (const container of droppableContainers) {
    const id = String(container.id);
    if (!id.startsWith("quad-slot:")) continue;

    const slot = parseQuadSlotId(id);
    if (!slot || (moduleType && slot.moduleType !== moduleType)) continue;

    const rect = droppableRects.get(container.id);
    if (!rect) continue;

    const distance = distanceToRect(pointerCoordinates, rect);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { id: container.id };
    }
  }

  if (best && bestDistance <= QUAD_SLOT_SNAP_DISTANCE) {
    return [best];
  }

  return [];
}

export const quadSlotCollision: CollisionDetection = (args) => {
  const slotArgs = {
    ...args,
    droppableContainers: args.droppableContainers.filter((container) =>
      String(container.id).startsWith("quad-slot:"),
    ),
  };

  const pointerHits = pointerWithin(slotArgs);
  if (pointerHits.length > 0) {
    return pointerHits;
  }

  const activeData = args.active.data.current as
    | { moduleType?: ModuleType; isAssigned?: boolean; type?: string }
    | undefined;

  if (activeData?.type !== "quad-module" || !activeData.isAssigned) {
    return [];
  }

  return closestQuadSlotToPointer(slotArgs, activeData.moduleType);
};
