"use client";

import { useEffect, useState } from "react";
import { BlockCanvas } from "@/components/BlockCanvas";
import type { PortBlock } from "@/types/port-config";

function EditorSkeleton() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-900">
          Port Configuration
        </h1>
        <p className="text-sm text-zinc-500">
          Add quads and drag to rearrange port layout
        </p>
      </header>
      <main className="flex flex-1 flex-col p-6">
        <div className="flex items-stretch gap-4 p-1">
          <div className="w-[220px] shrink-0 rounded-2xl border border-zinc-200 bg-white p-3 shadow-md">
            <div className="mb-2 h-7 rounded-lg bg-zinc-100" />
            <div className="mb-2 h-10 rounded-xl bg-violet-50" />
            <div className="mb-2 flex w-full gap-1">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-24 min-w-0 flex-1 rounded-xl bg-sky-50" />
              ))}
            </div>
            <div className="mb-2 h-8 rounded-md bg-zinc-200" />
            <div className="flex w-full gap-1">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-24 min-w-0 flex-1 rounded-xl bg-amber-50" />
              ))}
            </div>
          </div>
          <div className="w-20 shrink-0 rounded-2xl border-2 border-dashed border-violet-200 bg-white" />
        </div>
      </main>
    </div>
  );
}

export function PortConfigEditor() {
  const [mounted, setMounted] = useState(false);
  const [blocks, setBlocks] = useState<PortBlock[]>([
    { id: "quad-1", label: "Quad 1" },
  ]);
  const [blockCounter, setBlockCounter] = useState(2);

  useEffect(() => {
    setMounted(true);
  }, []);

  function addBlock() {
    setBlocks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: `Quad ${blockCounter}`,
      },
    ]);
    setBlockCounter((n) => n + 1);
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  if (!mounted) {
    return <EditorSkeleton />;
  }

  return (
    <div className="flex min-h-full flex-col bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-900">
          Port Configuration
        </h1>
        <p className="text-sm text-zinc-500">
          Add quads and drag to rearrange port layout
        </p>
      </header>

      <main className="flex flex-1 flex-col p-6">
        <BlockCanvas
          blocks={blocks}
          onReorder={setBlocks}
          onRemove={removeBlock}
          onAddBlock={addBlock}
        />
      </main>
    </div>
  );
}
