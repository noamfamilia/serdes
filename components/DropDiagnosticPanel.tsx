"use client";

import { useState } from "react";
import {
  formatDiagnosticLog,
  getFailureSummary,
  type DropDiagnosticEntry,
} from "@/components/drop-diagnostics";

type DropDiagnosticPanelProps = {
  entries: DropDiagnosticEntry[];
  onClear: () => void;
  onClose: () => void;
};

export function DropDiagnosticPanel({
  entries,
  onClear,
  onClose,
}: DropDiagnosticPanelProps) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const failureSummary = getFailureSummary(entries);
  const logText = formatDiagnosticLog(entries);

  async function handleCopySummary() {
    try {
      await navigator.clipboard.writeText(failureSummary);
      setCopyStatus("Summary copied");
    } catch (error) {
      setCopyStatus(
        error instanceof Error ? error.message : "Copy failed",
      );
    }
  }

  async function handleCopyFull() {
    try {
      await navigator.clipboard.writeText(logText);
      setCopyStatus("Full log copied");
    } catch (error) {
      setCopyStatus(
        error instanceof Error ? error.message : "Copy failed",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              Drop diagnostics
            </h2>
            <p className="text-xs text-zinc-500">
              Failed drop — copy the summary line below and send it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Close diagnostics"
          >
            ×
          </button>
        </div>

        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
            Failure
          </p>
          <p className="mt-1 break-all font-mono text-sm font-semibold text-amber-950">
            {failureSummary}
          </p>
        </div>

        <pre className="min-h-48 flex-1 overflow-auto whitespace-pre-wrap break-words bg-zinc-950 px-4 py-3 font-mono text-xs leading-relaxed text-zinc-100">
          {logText}
        </pre>

        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 px-4 py-3">
          <button
            type="button"
            onClick={handleCopySummary}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
          >
            Copy summary
          </button>
          <button
            type="button"
            onClick={handleCopyFull}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Copy full log
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Clear
          </button>
          {copyStatus && (
            <span className="text-xs text-zinc-500">{copyStatus}</span>
          )}
        </div>
      </div>
    </div>
  );
}
