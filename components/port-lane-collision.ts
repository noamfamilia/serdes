import { pointerWithin, type Collision, type CollisionDetection } from "@dnd-kit/core";
import { parsePortLaneId } from "@/components/dnd-utils";
import type { ModuleType } from "@/types/port-config";

const PORT_LANE_SNAP_DISTANCE = 120;

function distanceToRect(
  point: { x: number; y: number },
  rect: { top: number; left: number; right: number; bottom: number },
) {
  const dx = Math.max(rect.left - point.x, 0, point.x - rect.right);
  const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom);
  return Math.hypot(dx, dy);
}

function closestPortLaneToPointer(
  args: Parameters<CollisionDetection>[0],
  moduleType?: ModuleType,
): Collision[] {
  const { pointerCoordinates, droppableContainers, droppableRects } = args;
  if (!pointerCoordinates) return [];

  let best: Collision | null = null;
  let bestDistance = Infinity;

  for (const container of droppableContainers) {
    const id = String(container.id);
    if (!id.startsWith("port-lane:")) continue;

    const lane = parsePortLaneId(id);
    if (!lane || (moduleType && lane.moduleType !== moduleType)) continue;

    const rect = droppableRects.get(container.id);
    if (!rect) continue;

    const distance = distanceToRect(pointerCoordinates, rect);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { id: container.id };
    }
  }

  if (best && bestDistance <= PORT_LANE_SNAP_DISTANCE) {
    return [best];
  }

  return [];
}

export const portLaneCollision: CollisionDetection = (args) => {
  const portLaneArgs = {
    ...args,
    droppableContainers: args.droppableContainers.filter((container) =>
      String(container.id).startsWith("port-lane:"),
    ),
  };

  const pointerHits = pointerWithin(portLaneArgs);
  if (pointerHits.length > 0) {
    return pointerHits;
  }

  const activeData = args.active.data.current as
    | { moduleType?: ModuleType; isAssigned?: boolean; type?: string }
    | undefined;

  if (activeData?.type !== "quad-module" || !activeData.isAssigned) {
    return [];
  }

  return closestPortLaneToPointer(portLaneArgs, activeData.moduleType);
};
