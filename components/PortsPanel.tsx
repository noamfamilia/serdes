"use client";

import { useState, type ChangeEvent } from "react";
import { getPortColorClasses } from "@/components/port-colors";
import { PORT_SPEEDS, type Port, type PortSpeed } from "@/types/port-config";

type PortsPanelProps = {
  ports: Port[];
  onSelectPort: (id: string) => void;
  onAddPort: (speed: PortSpeed) => void;
};

export function PortsPanel({
  ports,
  onSelectPort,
  onAddPort,
}: PortsPanelProps) {
  const [selectValue, setSelectValue] = useState("");

  function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const speed = event.target.value as PortSpeed;
    if (!PORT_SPEEDS.includes(speed)) return;

    onAddPort(speed);
    setSelectValue("");
  }

  return (
    <div className="flex w-[180px] shrink-0 flex-col rounded-2xl border border-zinc-200 bg-white p-3 shadow-md">
      <h2 className="shrink-0 py-0.5 text-center text-sm font-semibold text-zinc-800">
        Ports
      </h2>

      <div className="mt-2 flex flex-col gap-2">
        {ports.map((port, index) => (
          <button
            key={port.id}
            type="button"
            onClick={() => onSelectPort(port.id)}
            className={`flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border text-xs font-medium shadow-sm transition-shadow hover:shadow-md ${getPortColorClasses(index)}`}
          >
            {port.speed}
          </button>
        ))}

        <select
          value={selectValue}
          onChange={handleSelectChange}
          className="w-full shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-2 text-xs font-medium text-zinc-700 outline-none transition-colors hover:border-zinc-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
          aria-label="Add port"
        >
          <option value="" disabled>
            Add port
          </option>
          {PORT_SPEEDS.map((speed) => (
            <option key={speed} value={speed}>
              {speed}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
