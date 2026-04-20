import { FiMoon, FiPlus, FiSun } from "react-icons/fi";

function Navbar({ theme, onToggleTheme, onQuickAdd }) {
    const isDark = theme === "dark";

    return (
        <header className="surface-panel sticky top-4 z-20 px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="display-face text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-3xl">
                        LineUp
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.24em] text-[var(--text-muted)] sm:text-sm sm:normal-case sm:tracking-normal">
                        Keep the day clear
                    </p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={onQuickAdd}
                        className="icon-button h-11 w-11 rounded-2xl bg-[var(--accent)] text-white shadow-[0_16px_30px_rgba(124,92,255,0.28)] hover:bg-[var(--accent-strong)]"
                        aria-label="Add task"
                    >
                        <FiPlus className="text-lg" />
                    </button>

                    <button
                        type="button"
                        onClick={onToggleTheme}
                        className="icon-button h-11 w-11 rounded-2xl"
                        aria-label="Toggle theme"
                    >
                        {isDark ? <FiSun className="text-lg" /> : <FiMoon className="text-lg" />}
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Navbar;