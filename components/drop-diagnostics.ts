export type DropDiagnosticEntry = {
  timestamp: string;
  phase: string;
  message: string;
  data?: Record<string, unknown>;
};

export function createDiagnosticEntry(
  phase: string,
  message: string,
  data?: Record<string, unknown>,
): DropDiagnosticEntry {
  return {
    timestamp: new Date().toISOString(),
    phase,
    message,
    data,
  };
}

export function getFailureSummary(entries: DropDiagnosticEntry[]): string {
  const reject = [...entries].reverse().find((entry) => entry.phase === "reject");
  if (reject) {
    return `reject: ${reject.message}`;
  }

  const dragEnd = [...entries].reverse().find((entry) => entry.phase === "drag_end");
  if (!dragEnd) {
    return "log ends at drag_start only (no drag_end)";
  }

  const resolvedOverId = dragEnd.data?.resolvedOverId;
  if (resolvedOverId == null || resolvedOverId === undefined) {
    return "reject: no_drop_target (resolvedOverId is null)";
  }

  return `no reject line (resolvedOverId: ${String(resolvedOverId)})`;
}

export function formatDiagnosticLog(entries: DropDiagnosticEntry[]): string {
  if (entries.length === 0) return "(empty log)";

  const summary = getFailureSummary(entries);

  return `${summary}\n\n--- full log ---\n\n${entries
    .map((entry) => {
      const header = `[${entry.timestamp}] ${entry.phase}: ${entry.message}`;
      if (!entry.data || Object.keys(entry.data).length === 0) {
        return header;
      }
      return `${header}\n${JSON.stringify(entry.data, null, 2)}`;
    })
    .join("\n\n")}`;
}

export function summarizePortAssignments(
  assignments: Record<string, unknown>,
): Record<string, unknown> {
  const summary: Record<string, unknown> = {};
  for (const [portId, lanes] of Object.entries(assignments)) {
    const typed = lanes as { rx: unknown[]; tx: unknown[] };
    summary[portId] = {
      rx: typed.rx.map((item, index) => ({ lane: index, module: item })),
      tx: typed.tx.map((item, index) => ({ lane: index, module: item })),
    };
  }
  return summary;
}
