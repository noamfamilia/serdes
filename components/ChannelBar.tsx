type ChannelBarProps = {
  label?: string;
  onClick?: () => void;
};

export function ChannelBar({ label = "Clocking", onClick }: ChannelBarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-full cursor-pointer items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50"
    >
      {label}
    </button>
  );
}
