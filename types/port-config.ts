export type PortBlock = {
  id: string;
  label: string;
  isPlaceholder?: boolean;
};

export const PORT_LANE_RATES = ["1G", "10G", "20G", "50G", "100G"] as const;
export const PORT_LANE_COUNTS = [1, 2, 4, 8] as const;
export const PORT_MODES = ["simplex-rx", "simplex-tx", "duplex"] as const;

export type PortLaneRate = (typeof PORT_LANE_RATES)[number];
export type PortLaneCountOption = (typeof PORT_LANE_COUNTS)[number];
export type PortMode = (typeof PORT_MODES)[number];

export type Port = {
  id: string;
  name: string;
  ratePerLane: PortLaneRate | null;
  laneCount: PortLaneCountOption | null;
  mode: PortMode | null;
  colorIndex: number;
};

export type ModuleType = "rx" | "tx";

export type QuadModuleRef = {
  blockId: string;
  moduleType: ModuleType;
  moduleIndex: number;
};

export type PortLaneAssignments = {
  rx: (QuadModuleRef | null)[];
  tx: (QuadModuleRef | null)[];
};

export type PortAssignments = Record<string, PortLaneAssignments>;

export type ModuleLinkHighlight =
  | {
      kind: "assigned";
      module: QuadModuleRef;
      portId: string;
      moduleType: ModuleType;
      laneIndex: number;
    }
  | {
      kind: "lane";
      portId: string;
      moduleType: ModuleType;
      laneIndex: number;
    };

export function isPortConfigured(port: Port): boolean {
  return (
    port.ratePerLane !== null && port.laneCount !== null && port.mode !== null
  );
}

export function getPortLaneCount(port: Port): number {
  return port.laneCount ?? 0;
}

export function generateUniquePortName(ports: Port[]): string {
  const used = new Set(ports.map((port) => port.name));
  let counter = 1;

  while (used.has(`Port${counter}`)) {
    counter += 1;
  }

  return `Port${counter}`;
}

export function isPortNameUnique(ports: Port[], name: string, portId?: string) {
  const trimmed = name.trim();
  if (!trimmed) return false;

  return !ports.some(
    (port) => port.name === trimmed && port.id !== portId,
  );
}

export function getPortModeLabel(mode: PortMode): string {
  switch (mode) {
    case "simplex-rx":
      return "Simplex-RX";
    case "simplex-tx":
      return "Simplex-TX";
    case "duplex":
      return "Duplex";
  }
}
