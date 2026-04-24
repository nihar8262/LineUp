function Sidebar({ activeFilter, items, stats, onSelectFilter }) {
  return (
    <aside className="hidden w-72 shrink-0 lg:block lg:self-start">
      <div className="surface-panel sticky top-8 flex h-[calc(100vh-4rem)] flex-col justify-between p-5">
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[var(--surface-raised)] p-1.5 shadow-[0_14px_28px_rgba(15,23,42,0.14)]">
                <img
                  src="/Lineup.png"
                  alt="LineUp logo"
                  className="h-full w-full rounded-xl object-contain"
                />
              </div>
              <h1 className="display-face mt-3 pb-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                LineUp
              </h1>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
              Workspace
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              A calm place to capture what matters and move through it with less
              friction.
            </p>
          </div>

          <nav className="space-y-2">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeFilter === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectFilter(item.id)}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all duration-200 active:scale-[0.98] ${
                    isActive
                      ? "bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-[0_14px_32px_rgba(124,92,255,0.18)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <span className="flex items-center gap-3 text-sm font-medium">
                    <Icon className="text-base" />
                    {item.label}
                  </span>
                  <span className="rounded-full bg-[var(--surface-raised)] px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)]">
                    {stats[item.id]}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="rounded-3xl bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-secondary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <p className="font-medium text-[var(--text-primary)]">Today at a glance</p>
          <p className="mt-2 leading-6">
            {stats.today} due today, {stats.completed} completed,{" "}
            {stats.all - stats.completed} still in motion.
          </p>
          <p className="mt-2 leading-6 text-[var(--text-muted)]">
            {stats.pinned} pinned for priority focus.
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
