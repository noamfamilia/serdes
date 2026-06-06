"use client";

import { useState } from "react";
import { DeletePortDialog } from "@/components/DeletePortDialog";
import type { Port } from "@/types/port-config";

type PortsPanelProps = {
  ports: Port[];
  selectedPortId: string | null;
  onSelectPort: (id: string) => void;
  onAddPort: () => void;
  onDeletePort: (id: string) => void;
  onRenamePort: (id: string, name: string) => boolean;
};

export function PortsPanel({
  ports,
  selectedPortId,
  onSelectPort,
  onAddPort,
  onDeletePort,
  onRenamePort,
}: PortsPanelProps) {
  const [pendingDeletePort, setPendingDeletePort] = useState<Port | null>(null);
  const [renamingPortId, setRenamingPortId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);

  function handleConfirmDelete() {
    if (!pendingDeletePort) return;
    onDeletePort(pendingDeletePort.id);
    setPendingDeletePort(null);
  }

  function startRename(port: Port) {
    setRenamingPortId(port.id);
    setRenameValue(port.name);
    setRenameError(null);
  }

  function cancelRename() {
    setRenamingPortId(null);
    setRenameValue("");
    setRenameError(null);
  }

  function commitRename(portId: string) {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenameError("Name is required");
      return;
    }

    const ok = onRenamePort(portId, trimmed);
    if (!ok) {
      setRenameError("Name must be unique");
      return;
    }

    cancelRename();
  }

  return (
    <>
      <div className="flex h-full w-max shrink-0 flex-col bg-zinc-100 pb-3 pl-3 pr-0 pt-3">
        <button
          type="button"
          onClick={onAddPort}
          className="shrink-0 cursor-pointer whitespace-nowrap text-left text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Add port
        </button>

        <nav
          className="mt-5 inline-grid w-max grid-cols-1 gap-1"
          aria-label="Ports"
        >
          <div
            aria-hidden
            className="pointer-events-none flex h-0 min-h-0 overflow-hidden opacity-0"
          >
            <span className="flex-1 whitespace-nowrap py-2 pl-3 pr-1">Port1</span>
            <span className="w-7 shrink-0" />
            <span className="w-7 shrink-0 pr-1" />
          </div>
          {ports.map((port) => {
            const isSelected = port.id === selectedPortId;
            const isRenaming = renamingPortId === port.id;

            return (
              <div
                key={port.id}
                className={`flex min-h-9 w-full items-stretch whitespace-nowrap rounded-l-lg rounded-r-none text-xs font-medium transition-colors ${
                  isSelected
                    ? "relative z-10 bg-white text-zinc-900"
                    : "mb-0.5 bg-zinc-300 text-zinc-700 hover:bg-zinc-400 hover:text-zinc-900"
                }`}
              >
                {isRenaming ? (
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-1 pl-3 pr-1">
                    <input
                      value={renameValue}
                      onChange={(event) => {
                        setRenameValue(event.target.value);
                        setRenameError(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") commitRename(port.id);
                        if (event.key === "Escape") cancelRename();
                      }}
                      className="w-full rounded-md border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                      autoFocus
                    />
                    {renameError && (
                      <span className="text-[10px] text-red-600">{renameError}</span>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectPort(port.id)}
                    className="flex flex-1 cursor-pointer items-center py-2 pl-3 pr-1 text-left"
                  >
                    {port.name}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    isRenaming ? commitRename(port.id) : startRename(port)
                  }
                  className="flex w-7 shrink-0 cursor-pointer items-center justify-center text-zinc-400 transition-colors hover:text-zinc-700"
                  aria-label={
                    isRenaming ? `Save ${port.name} rename` : `Rename ${port.name}`
                  }
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeletePort(port)}
                  className="flex w-7 shrink-0 cursor-pointer items-center justify-center pr-1 text-sm text-zinc-400 transition-colors hover:text-red-600"
                  aria-label={`Delete ${port.name}`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </nav>
      </div>

      <DeletePortDialog
        port={pendingDeletePort}
        open={pendingDeletePort !== null}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeletePort(null)}
      />
    </>
  );
}
