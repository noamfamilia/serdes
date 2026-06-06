"use client";

import { useEffect } from "react";
import type { Port } from "@/types/port-config";

type DeletePortDialogProps = {
  port: Port | null;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeletePortDialog({
  port,
  open,
  onConfirm,
  onCancel,
}: DeletePortDialogProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open || !port) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-port-dialog-title"
      >
        <h2
          id="delete-port-dialog-title"
          className="text-base font-semibold text-zinc-900"
        >
          Delete port?
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Remove <span className="font-medium text-zinc-800">{port.name}</span>{" "}
          port and clear its lane assignments. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
