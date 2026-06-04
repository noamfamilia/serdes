type IoBlockProps = {
  label: string;
};

const blockClassName =
  "flex w-40 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 shadow-sm";

function IoBlock({ label }: IoBlockProps) {
  return <div className={`h-11 ${blockClassName}`}>{label}</div>;
}

type ClockChannelBlockProps = {
  direction: "left" | "right";
};

function ClockChannelBlock({ direction }: ClockChannelBlockProps) {
  const label = direction === "left" ? "from/to left" : "from/to right";

  return (
    <div
      className={`h-20 flex-col py-4 leading-snug ${blockClassName}`}
      aria-label={`Clock channel, ${label}`}
    >
      <span>Clock channel</span>
      <span>{label}</span>
    </div>
  );
}

type ClockingDialogProps = {
  quadLabel: string;
  open: boolean;
  onClose: () => void;
};

export function ClockingDialog({
  quadLabel,
  open,
  onClose,
}: ClockingDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="clocking-dialog-title"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2
            id="clocking-dialog-title"
            className="text-base font-semibold text-zinc-900"
          >
            Clocking — {quadLabel}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
            aria-label="Close clocking configuration"
          >
            ×
          </button>
        </div>

        <div className="flex items-center gap-3">
          <ClockChannelBlock direction="left" />

          <div className="flex flex-col gap-2">
            <IoBlock label="I/O #1" />
            <IoBlock label="I/O #2" />
            <IoBlock label="PLLA" />
            <IoBlock label="PLLB" />
          </div>

          <ClockChannelBlock direction="right" />
        </div>
      </div>
    </div>
  );
}
