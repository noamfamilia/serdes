"use client";

export type PortMenuItem = "basic" | "menu1" | "menu2" | "menu3";

type PortMenuPanelProps = {
  activeItem: PortMenuItem | null;
  onSelectItem: (item: PortMenuItem) => void;
};

const TAB_ITEMS: { id: PortMenuItem; label: string }[] = [
  { id: "basic", label: "Basic" },
  { id: "menu1", label: "Menu 1" },
  { id: "menu2", label: "Menu 2" },
  { id: "menu3", label: "Menu 3" },
];

export function PortMenuPanel({
  activeItem,
  onSelectItem,
}: PortMenuPanelProps) {
  return (
    <nav
      className="flex shrink-0 items-end gap-1 bg-zinc-100 px-3 pt-2.5"
      aria-label="Port menu"
    >
      {TAB_ITEMS.map((item) => {
        const isActive = activeItem === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectItem(item.id)}
            className={`relative shrink-0 cursor-pointer rounded-t-lg rounded-b-none px-6 text-xs font-medium transition-colors ${
              isActive
                ? "z-10 -mb-px bg-white py-2.5 text-zinc-900"
                : "mb-0.5 bg-zinc-300 py-2 text-zinc-800 hover:bg-zinc-400 hover:text-zinc-900"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
