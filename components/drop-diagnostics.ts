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

export function formatDiagnosticLog(entries: DropDiagnosticEntry[]): string {
  if (entries.length === 0) return "(empty log)";

  return entries
    .map((entry) => {
      const header = `[${entry.timestamp}] ${entry.phase}: ${entry.message}`;
      if (!entry.data || Object.keys(entry.data).length === 0) {
        return header;
      }
      return `${header}\n${JSON.stringify(entry.data, null, 2)}`;
    })
    .join("\n\n");
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
