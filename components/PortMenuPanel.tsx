"use client";

export type PortMenuItem = "layout" | "menu1" | "menu2" | "menu3" | "delete";

type PortMenuPanelProps = {
  activeItem: PortMenuItem | null;
  onSelectItem: (item: PortMenuItem) => void;
};

const MENU_ITEMS: { id: PortMenuItem; label: string }[] = [
  { id: "layout", label: "layout" },
  { id: "menu1", label: "menu1" },
  { id: "menu2", label: "menu2" },
  { id: "menu3", label: "menu3" },
  { id: "delete", label: "delete" },
];

export function PortMenuPanel({
  activeItem,
  onSelectItem,
}: PortMenuPanelProps) {
  return (
    <nav
      className="flex w-fit shrink-0 flex-col divide-y divide-zinc-200 border border-zinc-200 bg-white"
      aria-label="Port menu"
    >
      {MENU_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelectItem(item.id)}
          className={`flex h-8 shrink-0 cursor-pointer items-center px-3 text-left text-xs font-medium transition-colors ${
            activeItem === item.id
              ? "bg-zinc-200 text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800"
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
