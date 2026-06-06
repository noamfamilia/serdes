"use client";

import { getPortLaneLabel } from "@/components/dnd-utils";
import { PORT_COLOR_LABELS } from "@/components/port-colors";
import { PortLaneDisplay } from "@/components/PortLaneDisplay";
import {
  PORT_LANE_COUNTS,
  PORT_LANE_RATES,
  PORT_MODES,
  getPortLaneCount,
  getPortModeLabel,
  isPortConfigured,
  type ModuleLinkHighlight,
  type Port,
  type PortBlock,
  type PortLaneAssignments,
  type PortLaneCountOption,
  type PortLaneRate,
  type PortMode,
} from "@/types/port-config";

type PortBasicPanelProps = {
  port: Port;
  blocks: PortBlock[];
  assignments: PortLaneAssignments | null;
  activeLink: ModuleLinkHighlight | null;
  groupMode: boolean;
  onRateChange: (rate: PortLaneRate | null) => void;
  onLaneCountChange: (laneCount: PortLaneCountOption | null) => void;
  onModeChange: (mode: PortMode | null) => void;
  onColorChange: (colorIndex: number) => void;
  onGroupModeChange: (groupMode: boolean) => void;
  onLinkHover: (highlight: ModuleLinkHighlight | null) => void;
  onLinkSelect: (highlight: ModuleLinkHighlight) => void;
  onClearLink: () => void;
};

const SELECT_CLASS =
  "min-w-[120px] rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs font-medium text-zinc-700 outline-none transition-colors hover:border-zinc-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-200";

const LABEL_CLASS = "w-28 shrink-0 text-xs font-medium text-zinc-500";

const MAP_LANE_WIDTH_PX = 34;
const MAP_LANE_GAP_PX = 4;
const MAP_CONTAINER_PADDING_X_PX = 32;

const MAP_CONTAINER_CLASS =
  "flex h-full flex-col gap-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-3";

function mapWidthForLanes(laneCount: number) {
  return (
    laneCount * MAP_LANE_WIDTH_PX +
    Math.max(0, laneCount - 1) * MAP_LANE_GAP_PX +
    MAP_CONTAINER_PADDING_X_PX
  );
}

export function PortBasicPanel({
  port,
  blocks,
  assignments,
  activeLink,
  groupMode,
  onRateChange,
  onLaneCountChange,
  onModeChange,
  onColorChange,
  onGroupModeChange,
  onLinkHover,
  onLinkSelect,
  onClearLink,
}: PortBasicPanelProps) {
  const configured = isPortConfigured(port);
  const laneCount = getPortLaneCount(port);
  const showRx = port.mode === "simplex-rx" || port.mode === "duplex";
  const showTx = port.mode === "simplex-tx" || port.mode === "duplex";

  return (
    <div className="flex h-full w-full flex-col" onClick={onClearLink}>
      <div className="flex h-full w-full items-stretch justify-between gap-4">
        <div className="flex shrink-0 flex-col gap-2">
          <label
            className="flex items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <span className={LABEL_CLASS}>Rate Per-Lane</span>
            <select
              value={port.ratePerLane ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                onRateChange(value ? (value as PortLaneRate) : null);
              }}
              className={SELECT_CLASS}
            >
              <option value="" disabled>
                Select
              </option>
              {PORT_LANE_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}
                </option>
              ))}
            </select>
          </label>

          <label
            className="flex items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <span className={LABEL_CLASS}># Lanes</span>
            <select
              value={port.laneCount ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                onLaneCountChange(
                  value ? (Number(value) as PortLaneCountOption) : null,
                );
              }}
              className={SELECT_CLASS}
            >
              <option value="" disabled>
                Select
              </option>
              {PORT_LANE_COUNTS.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>

          <label
            className="flex items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <span className={LABEL_CLASS}>Mode</span>
            <select
              value={port.mode ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                onModeChange(value ? (value as PortMode) : null);
              }}
              className={SELECT_CLASS}
            >
              <option value="" disabled>
                Select
              </option>
              {PORT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {getPortModeLabel(mode)}
                </option>
              ))}
            </select>
          </label>

          <label
            className="flex items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <span className={LABEL_CLASS}>Color</span>
            <select
              value={port.colorIndex}
              onChange={(event) => onColorChange(Number(event.target.value))}
              className={SELECT_CLASS}
            >
              {PORT_COLOR_LABELS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div
            className="flex items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <span className={LABEL_CLASS}>Drag & Drop</span>
            <div className="flex w-max shrink-0 rounded-lg border border-zinc-200 p-0.5">
              <button
                type="button"
                onClick={() => onGroupModeChange(true)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  groupMode
                    ? "bg-zinc-200 text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800"
                }`}
              >
                Group
              </button>
              <button
                type="button"
                onClick={() => onGroupModeChange(false)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  !groupMode
                    ? "bg-zinc-200 text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800"
                }`}
              >
                Ungroup
              </button>
            </div>
          </div>
        </div>

        <div className="ml-auto flex h-full shrink-0 self-stretch">
          <div
            className={`${MAP_CONTAINER_CLASS} ${configured ? "w-max" : ""}`}
            style={
              configured ? undefined : { width: mapWidthForLanes(4) }
            }
          >
            <span className="w-full shrink-0 text-center text-xs font-medium text-zinc-500">
              map
            </span>
            {configured && assignments ? (
              <div className="flex min-h-0 flex-1 flex-col justify-center">
                <div className="flex w-max flex-col gap-1">
                  {showRx && (
                    <div className="flex gap-1">
                      {Array.from({ length: laneCount }, (_, laneIndex) => (
                        <PortLaneDisplay
                          key={`rx-${laneIndex}`}
                          portId={port.id}
                          moduleType="rx"
                          laneIndex={laneIndex}
                          label={getPortLaneLabel(
                            blocks,
                            assignments.rx[laneIndex] ?? null,
                            "rx",
                          )}
                          assignment={assignments.rx[laneIndex] ?? null}
                          colorIndex={port.colorIndex}
                          activeLink={activeLink}
                          onLinkHover={onLinkHover}
                          onLinkSelect={onLinkSelect}
                        />
                      ))}
                    </div>
                  )}
                  {showTx && (
                    <div className="flex gap-1">
                      {Array.from({ length: laneCount }, (_, laneIndex) => (
                        <PortLaneDisplay
                          key={`tx-${laneIndex}`}
                          portId={port.id}
                          moduleType="tx"
                          laneIndex={laneIndex}
                          label={getPortLaneLabel(
                            blocks,
                            assignments.tx[laneIndex] ?? null,
                            "tx",
                          )}
                          assignment={assignments.tx[laneIndex] ?? null}
                          colorIndex={port.colorIndex}
                          activeLink={activeLink}
                          onLinkHover={onLinkHover}
                          onLinkSelect={onLinkSelect}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
