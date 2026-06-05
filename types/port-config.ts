export type PortBlock = {
  id: string;
  label: string;
  isPlaceholder?: boolean;
};

export const PORT_SPEEDS = ["100G", "200G", "400G", "800G"] as const;

export type PortSpeed = (typeof PORT_SPEEDS)[number];

export type Port = {
  id: string;
  speed: PortSpeed;
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

export function getPortLaneCount(speed: PortSpeed): number {
  return parseInt(speed, 10) / 100;
}
