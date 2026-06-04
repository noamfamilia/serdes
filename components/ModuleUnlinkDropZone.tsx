"use client";

import { useDndContext, useDroppable } from "@dnd-kit/core";
import { MODULE_UNLINK_DROP_ID } from "@/components/dnd-utils";
import type { ModuleType } from "@/types/port-config";

type ActiveQuadModuleData = {
  type?: string;
  moduleType?: ModuleType;
  isAssigned?: boolean;
};

export function ModuleUnlinkDropZone() {
  const { active } = useDndContext();
  const activeData = active?.data.current as ActiveQuadModuleData | undefined;
  const isAssignedDrag =
    activeData?.type === "quad-module" && activeData.isAssigned === true;

  const { setNodeRef, isOver } = useDroppable({
    id: MODULE_UNLINK_DROP_ID,
    disabled: !isAssignedDrag,
  });

  if (!isAssignedDrag) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-6 py-4 transition-colors ${
        isOver
          ? "border-red-500 bg-red-50 text-red-700"
          : "border-zinc-300 bg-zinc-50 text-zinc-600"
      }`}
      aria-label="Drop here to unlink from port"
    >
      <svg
        className="h-8 w-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 0v11a2 2 0 002 2h4a2 2 0 002-2V7M10 11v5M14 11v5"
        />
      </svg>
      <span className="text-xs font-medium">Remove</span>
    </div>
  );
}
