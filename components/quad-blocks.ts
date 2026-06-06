import type { PortAssignments, PortBlock } from "@/types/port-config";

export function createPlaceholderQuad(id?: string): PortBlock {
  return {
    id: id ?? crypto.randomUUID(),
    label: "",
    isPlaceholder: true,
  };
}

export function createInitialBlocks(): PortBlock[] {
  return [createPlaceholderQuad()];
}

export function renumberRealQuads(blocks: PortBlock[]): PortBlock[] {
  let counter = 1;

  return blocks.map((block) =>
    block.isPlaceholder ? block : { ...block, label: `Quad ${counter++}` },
  );
}

export function getRealBlocks(blocks: PortBlock[]) {
  return blocks.filter((block) => !block.isPlaceholder);
}

export function getPlaceholderBlock(blocks: PortBlock[]) {
  return blocks.find((block) => block.isPlaceholder) ?? null;
}

export function ensureTrailingPlaceholder(blocks: PortBlock[]): PortBlock[] {
  const realBlocks = getRealBlocks(blocks);
  const placeholder = getPlaceholderBlock(blocks) ?? createPlaceholderQuad();
  return [...realBlocks, placeholder];
}

export function insertRealQuads(
  blocks: PortBlock[],
  count: number,
  startCounter: number,
): PortBlock[] {
  if (count <= 0) {
    return ensureTrailingPlaceholder(blocks);
  }

  const realBlocks = getRealBlocks(blocks);
  const placeholder = getPlaceholderBlock(blocks) ?? createPlaceholderQuad();
  const addedBlocks: PortBlock[] = Array.from({ length: count }, (_, index) => ({
    id: crypto.randomUUID(),
    label: `Quad ${startCounter + index}`,
    isPlaceholder: false,
  }));

  return renumberRealQuads([...realBlocks, ...addedBlocks, placeholder]);
}

export function materializePlaceholderQuad(
  blocks: PortBlock[],
  blockCounter: number,
): { blocks: PortBlock[]; blockCounter: number } {
  const placeholderIndex = blocks.findIndex((block) => block.isPlaceholder);
  if (placeholderIndex === -1) {
    return {
      blocks: ensureTrailingPlaceholder(blocks),
      blockCounter,
    };
  }

  const placeholder = blocks[placeholderIndex];
  const materialized: PortBlock = {
    id: placeholder.id,
    label: `Quad ${blockCounter}`,
    isPlaceholder: false,
  };
  const next = [...blocks];
  next[placeholderIndex] = materialized;
  next.push(createPlaceholderQuad());

  return {
    blocks: renumberRealQuads(next),
    blockCounter: blockCounter + 1,
  };
}

export function getAssignedBlockIds(assignments: PortAssignments): Set<string> {
  const ids = new Set<string>();

  for (const lanes of Object.values(assignments)) {
    for (const type of ["rx", "tx"] as const) {
      for (const module of lanes[type]) {
        if (module) {
          ids.add(module.blockId);
        }
      }
    }
  }

  return ids;
}

export function removeEmptyRealQuads(
  blocks: PortBlock[],
  assignments: PortAssignments,
): PortBlock[] {
  const assignedBlockIds = getAssignedBlockIds(assignments);
  const placeholder = getPlaceholderBlock(blocks) ?? createPlaceholderQuad();
  const activeRealBlocks = getRealBlocks(blocks).filter((block) =>
    assignedBlockIds.has(block.id),
  );

  return renumberRealQuads([...activeRealBlocks, placeholder]);
}

export function usesPlaceholderBlock(
  assignments: PortAssignments,
  placeholderId: string,
): boolean {
  for (const lanes of Object.values(assignments)) {
    for (const type of ["rx", "tx"] as const) {
      for (const module of lanes[type]) {
        if (module?.blockId === placeholderId) {
          return true;
        }
      }
    }
  }

  return false;
}
