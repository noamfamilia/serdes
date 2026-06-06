export function EditorSkeleton() {
  return (
    <div className="flex h-full min-h-screen flex-col bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-900">
          FPGA High-Speed Serial Interface
        </h1>
      </header>
      <main className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <div className="flex h-[400px] shrink-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-md">
          <div className="shrink-0 border-b border-zinc-200 bg-zinc-100 py-2.5 text-center text-sm font-semibold text-zinc-800">
            Ports
          </div>
          <div className="flex min-h-0 flex-1 bg-zinc-100">
            <div className="flex shrink-0 flex-col bg-zinc-100 pb-3 pl-3 pr-0 pt-3">
              <div className="h-9 w-[6.5rem] rounded-l-lg rounded-r-none bg-white" />
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-zinc-100">
            <div className="flex shrink-0 items-end gap-1 bg-zinc-100 px-3 pt-2.5">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className={`h-9 w-24 rounded-t-lg rounded-b-none ${
                    i === 0 ? "bg-white" : "mb-0.5 bg-zinc-300"
                  }`}
                />
              ))}
            </div>
            <div className="flex-1 bg-white p-4">
              <div className="h-24 rounded-xl border border-zinc-200 bg-zinc-50" />
            </div>
          </div>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-md">
          <div className="shrink-0 border-b border-zinc-200 py-2.5 text-center text-sm font-semibold text-zinc-800">
            Layout
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <div className="flex w-max items-stretch gap-4 p-1">
              <div className="w-[220px] shrink-0 rounded-2xl border border-zinc-200 bg-white p-3 shadow-md">
                <div className="mb-2 h-7" />
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
