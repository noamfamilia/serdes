export function EditorSkeleton() {
  return (
    <div className="flex h-full min-h-screen flex-col bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-900">Interface</h1>
      </header>
      <main className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <div className="min-h-0 flex-1 overflow-x-auto">
          <div className="flex w-max items-stretch gap-4 p-1">
            <div className="w-[220px] shrink-0 rounded-2xl border border-zinc-200 bg-white p-3 shadow-md">
              <div className="mb-2 h-7" />
              <div className="mb-2 h-10 rounded-xl border border-zinc-200 bg-white" />
              <div className="mb-2 flex w-full gap-1">
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className="h-24 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white"
                  />
                ))}
              </div>
              <div className="mb-2 h-8 rounded-md border border-zinc-200 bg-white" />
              <div className="flex w-full gap-1">
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className="h-24 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white"
                  />
                ))}
              </div>
            </div>
            <div className="w-20 shrink-0 rounded-2xl border-2 border-dashed border-violet-200 bg-white" />
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <div className="w-[180px] rounded-2xl border border-zinc-200 bg-white p-3 shadow-md">
            <div className="h-7" />
            <div className="mt-2 h-10 rounded-lg bg-zinc-50" />
          </div>
        </div>
      </main>
    </div>
  );
}
