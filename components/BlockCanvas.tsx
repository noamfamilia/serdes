"use client";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import type { PortBlock } from "@/types/port-config";
import { PortBlock as PortBlockComponent } from "./PortBlock";

type BlockCanvasProps = {
  blocks: PortBlock[];
  onReorder: (blocks: PortBlock[]) => void;
  onRemove: (id: string) => void;
  onAddBlock: () => void;
};

function AddBlockButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-violet-400 bg-white text-violet-500 shadow-md transition-colors hover:border-violet-600 hover:bg-violet-50 hover:text-violet-700"
      aria-label="Add quad"
    >
      <span className="select-none text-6xl font-light leading-none">+</span>
    </button>
  );
}

function AddBlockSlot({
  onClick,
  solo,
}: {
  onClick: () => void;
  solo: boolean;
}) {
  if (solo) {
    return (
      <div className="grid shrink-0">
        <div
          className="invisible col-start-1 row-start-1 pointer-events-none"
          aria-hidden
        >
          <PortBlockComponent block={{ id: "height-ref", label: "Quad" }} />
        </div>
        <div className="col-start-1 row-start-1 flex h-full w-full">
          <AddBlockButton onClick={onClick} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 self-stretch">
      <AddBlockButton onClick={onClick} />
    </div>
  );
}

function SortablePortBlock({
  block,
  onRemove,
}: {
  block: PortBlock;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="shrink-0 self-stretch">
      <PortBlockComponent
        block={block}
        isDragging={isDragging}
        dragHandleProps={{ attributes, listeners }}
        onRemove={() => onRemove(block.id)}
      />
    </div>
  );
}

export function BlockCanvas({
  blocks,
  onReorder,
  onRemove,
  onAddBlock,
}: BlockCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    onReorder(arrayMove(blocks, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div className="flex w-max max-w-full items-stretch gap-4 overflow-x-auto p-1 pb-2">
          {blocks.map((block) => (
            <SortablePortBlock
              key={block.id}
              block={block}
              onRemove={onRemove}
            />
          ))}
          <AddBlockSlot onClick={onAddBlock} solo={blocks.length === 0} />
        </div>
      </SortableContext>
    </DndContext>
  );
}
