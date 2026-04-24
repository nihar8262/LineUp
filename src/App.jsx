import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import {
  FiAlertCircle,
  FiBookmark,
  FiCalendar,
  FiChevronDown,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiList,
  FiRepeat,
  FiTag,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { HiOutlineFire } from "react-icons/hi2";
import { v4 as uuidv4 } from "uuid";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "recurring", label: "Recurring" },
  { id: "completed", label: "Completed" },
];

const SIDEBAR_ITEMS = [
  { id: "all", label: "All Tasks", icon: FiList },
  { id: "today", label: "Today", icon: FiClock },
  { id: "recurring", label: "Recurring", icon: FiRepeat },
  { id: "completed", label: "Completed", icon: FiCheckCircle },
];

const PRIORITY_OPTIONS = [
  { id: "high", label: "High", tone: "high" },
  { id: "medium", label: "Medium", tone: "medium" },
  { id: "low", label: "Low", tone: "low" },
];

const TODO_TYPE_OPTIONS = [
  { id: "standard", label: "Standard task" },
  { id: "daily", label: "Daily recurring" },
];

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateKeyForTimeZone(date, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getTodayInIST() {
  return getDateKeyForTimeZone(new Date(), "Asia/Kolkata");
}

function shiftDateKey(dateKey, days) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day + days));
  return utcDate.toISOString().slice(0, 10);
}

function normalizeCompletionHistory(history, completedOnDate) {
  const rawHistory = Array.isArray(history) ? history : [];
  const nextHistory = [...rawHistory];

  if (typeof completedOnDate === "string" && !nextHistory.includes(completedOnDate)) {
    nextHistory.push(completedOnDate);
  }

  return [...new Set(nextHistory.filter(Boolean))].sort();
}

function getCurrentStreak(history, todayInIST = getTodayInIST()) {
  const completionSet = new Set(history);

  if (completionSet.size === 0) {
    return 0;
  }

  // Find the most recent completion date
  const sortedHistory = [...completionSet].sort().reverse();
  const mostRecent = sortedHistory[0];

  // If most recent is today, streak starts from today
  // If most recent is yesterday, streak starts from yesterday
  // If most recent is older than yesterday, streak is broken (0)
  const yesterday = shiftDateKey(todayInIST, -1);

  if (mostRecent !== todayInIST && mostRecent !== yesterday) {
    return 0;
  }

  // Count consecutive days backwards from the most recent completion
  let streak = 0;
  let cursor = mostRecent;

  while (completionSet.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  return streak;
}

function getLongestStreak(history) {
  if (history.length === 0) {
    return 0;
  }

  let longest = 1;
  let current = 1;

  for (let index = 1; index < history.length; index += 1) {
    if (history[index] === shiftDateKey(history[index - 1], 1)) {
      current += 1;
      longest = Math.max(longest, current);
      continue;
    }

    current = 1;
  }

  return longest;
}

function getRecurringStreakMeta(item, todayInIST = getTodayInIST()) {
  const history = Array.isArray(item.completionHistory) ? item.completionHistory : [];
  const currentStreak = getCurrentStreak(history, todayInIST);
  const longestStreak = getLongestStreak(history);
  const completedToday = history.includes(todayInIST);

  return {
    completedToday,
    currentStreak,
    longestStreak,
    progress: currentStreak > 0 ? Math.min(100, (currentStreak / 7) * 100) : 0,
    label:
      currentStreak === 1 ? "1 day streak" : `${currentStreak} day streak`,
    hint: completedToday
      ? "Locked in for today. Keep the chain alive tomorrow."
      : "Complete this today to light the streak.",
  };
}

function formatDisplayDate(deadline) {
  if (!deadline) {
    return "No date";
  }

  return new Date(`${deadline}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function inferPriority(deadline) {
  if (!deadline) {
    return "low";
  }

  const today = formatDateKey(new Date());
  const diffInDays = Math.ceil(
    (new Date(`${deadline}T00:00:00`) - new Date(`${today}T00:00:00`)) /
      (1000 * 60 * 60 * 24),
  );

  if (diffInDays <= 1) {
    return "high";
  }

  if (diffInDays <= 3) {
    return "medium";
  }

  return "low";
}

function normalizeTodo(item) {
  const type = item.type === "daily" ? "daily" : "standard";
  const todayInIST = getTodayInIST();
  const completionHistory = normalizeCompletionHistory(
    item.completionHistory,
    item.completedOnDate,
  );
  const completedOnDate = completionHistory.includes(todayInIST)
    ? todayInIST
    : null;
  const isCompleted =
    type === "daily" ? Boolean(completedOnDate) : Boolean(item.isCompleted);

  return {
    ...item,
    type,
    priority: item.priority || inferPriority(item.deadline),
    isPinned: Boolean(item.isPinned),
    isCompleted,
    completedOnDate: isCompleted ? completedOnDate : null,
    completionHistory: type === "daily" ? completionHistory : [],
    tags: Array.isArray(item.tags) ? item.tags.filter(Boolean) : [],
  };
}

function getPriority(priority, isCompleted) {
  if (isCompleted) {
    return { label: "Completed", tone: "done" };
  }

  if (priority === "high") {
    return { label: "High Priority", tone: "high" };
  }

  if (priority === "medium") {
    return { label: "Medium Priority", tone: "medium" };
  }

  return { label: "Low Priority", tone: "low" };
}

function getDueMeta(deadline, isCompleted) {
  if (!deadline) {
    return { label: "No date", tone: "muted" };
  }

  if (isCompleted) {
    return { label: formatDisplayDate(deadline), tone: "muted" };
  }

  const today = formatDateKey(new Date());
  const diffInDays = Math.ceil(
    (new Date(`${deadline}T00:00:00`) - new Date(`${today}T00:00:00`)) /
      (1000 * 60 * 60 * 24),
  );

  if (diffInDays < 0) {
    return { label: "Overdue", tone: "high" };
  }

  if (diffInDays === 0) {
    return { label: "Today", tone: "medium" };
  }

  if (diffInDays === 1) {
    return { label: "Tomorrow", tone: "low" };
  }

  if (diffInDays <= 7) {
    return { label: "This Week", tone: "muted" };
  }

  return { label: formatDisplayDate(deadline), tone: "muted" };
}

function getTaskTypeMeta(item) {
  if (item.type === "daily") {
    return { label: "Daily recurring", tone: "daily" };
  }

  return null;
}

function App() {
  const [todo, setTodo] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("medium");
  const [todoType, setTodoType] = useState("standard");
  const [tagsInput, setTagsInput] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [todos, setTodos] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [theme, setTheme] = useState("dark");
  const [editingId, setEditingId] = useState(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobileComposerOpen, setIsMobileComposerOpen] = useState(false);
  const titleInputRef = useRef(null);

  useEffect(() => {
    const storedTodos = localStorage.getItem("todos");
    if (storedTodos) {
      setTodos(JSON.parse(storedTodos).map(normalizeTodo));
    }

    const storedTheme = localStorage.getItem("lineup-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    const syncDailyTodos = () => {
      setTodos((currentTodos) => {
        const nextTodos = currentTodos.map(normalizeTodo);
        const hasChanges = nextTodos.some((item, index) => {
          const currentItem = currentTodos[index];

          return (
            currentItem?.isCompleted !== item.isCompleted ||
            currentItem?.completedOnDate !== item.completedOnDate ||
            currentItem?.type !== item.type
          );
        });

        return hasChanges ? nextTodos : currentTodos;
      });
    };

    syncDailyTodos();

    const intervalId = window.setInterval(syncDailyTodos, 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (todos.length > 0) {
      localStorage.setItem("todos", JSON.stringify(todos));
      return;
    }

    localStorage.removeItem("todos");
  }, [todos]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("lineup-theme", theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");

    const updateViewport = (event) => {
      setIsMobileViewport(event.matches);
    };

    setIsMobileViewport(mediaQuery.matches);
    mediaQuery.addEventListener("change", updateViewport);

    return () => {
      mediaQuery.removeEventListener("change", updateViewport);
    };
  }, []);

  useEffect(() => {
    const shouldLockScroll =
      pendingDeleteId !== null || (isMobileViewport && isMobileComposerOpen);

    if (!shouldLockScroll) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileComposerOpen, isMobileViewport, pendingDeleteId]);

  useEffect(() => {
    if (!isMobileViewport) {
      setIsMobileComposerOpen(false);
    }
  }, [isMobileViewport]);

  useEffect(() => {
    if (isMobileComposerOpen) {
      titleInputRef.current?.focus();
    }
  }, [isMobileComposerOpen]);

  const filteredTodos = useMemo(() => {
    const today = formatDateKey(new Date());

    return todos.filter((item) => {
      if (activeFilter === "all") {
        return !item.isCompleted;
      }

      if (activeFilter === "completed") {
        return item.isCompleted;
      }

      if (activeFilter === "recurring") {
        return item.type === "daily";
      }

      if (activeFilter === "today") {
        return (
          !item.isCompleted &&
          (item.type === "daily" || item.deadline === today)
        );
      }

      if (activeFilter === "upcoming") {
        return (
          item.type !== "daily" &&
          !item.isCompleted && Boolean(item.deadline) && item.deadline > today
        );
      }

      return true;
    });
  }, [activeFilter, todos]);

  const sortedTodos = useMemo(() => {
    return [...filteredTodos].sort((left, right) => {
      if (left.isPinned !== right.isPinned) {
        return right.isPinned - left.isPinned;
      }

      if (left.isCompleted !== right.isCompleted) {
        return left.isCompleted - right.isCompleted;
      }

      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    });
  }, [filteredTodos]);

  const pinnedTodos = useMemo(
    () => sortedTodos.filter((item) => item.isPinned && !item.isCompleted),
    [sortedTodos],
  );

  const regularTodos = useMemo(
    () => sortedTodos.filter((item) => item.isCompleted || !item.isPinned),
    [sortedTodos],
  );

  const stats = useMemo(() => {
    const today = formatDateKey(new Date());

    return {
      all: todos.length,
      today: todos.filter(
        (item) =>
          !item.isCompleted && (item.type === "daily" || item.deadline === today),
      ).length,
      recurring: todos.filter((item) => item.type === "daily").length,
      completed: todos.filter((item) => item.isCompleted).length,
      pinned: todos.filter((item) => item.isPinned && !item.isCompleted).length,
    };
  }, [todos]);

  const recurringSummary = useMemo(() => {
    const recurringTodos = todos.filter((item) => item.type === "daily");
    const streakMetas = recurringTodos.map((item) => getRecurringStreakMeta(item));
    const completedToday = streakMetas.filter((item) => item.completedToday).length;
    const currentBest = streakMetas.reduce(
      (best, item) => Math.max(best, item.currentStreak),
      0,
    );
    const longestEver = streakMetas.reduce(
      (best, item) => Math.max(best, item.longestStreak),
      0,
    );

    return {
      total: recurringTodos.length,
      completedToday,
      completionRate:
        recurringTodos.length > 0 ? (completedToday / recurringTodos.length) * 100 : 0,
      currentBest,
      longestEver,
    };
  }, [todos]);

  const insight = useMemo(() => {
    const overdueCount = todos.filter(
      (item) =>
        !item.isCompleted &&
        item.deadline &&
        getDueMeta(item.deadline, false).label === "Overdue",
    ).length;

    if (overdueCount > 0) {
      return `${overdueCount} overdue task${overdueCount === 1 ? " needs" : "s need"} attention first.`;
    }

    if (stats.today > 0) {
      return `You have ${stats.today} task${stats.today === 1 ? "" : "s"} due today.`;
    }

    if (stats.pinned > 0) {
      return `${stats.pinned} pinned task${stats.pinned === 1 ? " is" : "s are"} keeping your focus anchored.`;
    }

    return "Your board is clear. Capture the next meaningful task while momentum is fresh.";
  }, [stats.pinned, stats.today, todos]);

  const resetForm = () => {
    setTodo("");
    setDescription("");
    setDeadline("");
    setPriority("medium");
    setTodoType("standard");
    setTagsInput("");
    setIsPinned(false);
    setFormErrors({});
    setEditingId(null);
  };

  const openComposer = () => {
    if (isMobileViewport) {
      setIsMobileComposerOpen(true);
      return;
    }

    titleInputRef.current?.focus();
  };

  const closeMobileComposer = () => {
    setIsMobileComposerOpen(false);
  };

  const dismissComposer = () => {
    resetForm();

    if (isMobileViewport) {
      closeMobileComposer();
    }
  };

  const handleCheckbox = (id) => {
    setTodos((currentTodos) =>
      currentTodos.map((item) =>
        item.id === id
          ? item.type === "daily"
            ? (() => {
                const todayInIST = getTodayInIST();
                const history = normalizeCompletionHistory(
                  item.completionHistory,
                  item.completedOnDate,
                );
                const nextIsCompleted = !item.isCompleted;
                const nextHistory = nextIsCompleted
                  ? [...new Set([...history, todayInIST])].sort()
                  : history.filter((dateKey) => dateKey !== todayInIST);

                return {
                  ...item,
                  isCompleted: nextIsCompleted,
                  completedOnDate: nextIsCompleted ? todayInIST : null,
                  completionHistory: nextHistory,
                };
              })()
            : {
                ...item,
                isCompleted: !item.isCompleted,
              }
          : item,
      ),
    );
  };

  const handleEdit = (id) => {
    const task = todos.find((item) => item.id === id);

    if (!task) {
      return;
    }

    setTodo(task.todo);
    setDescription(task.description || "");
    setDeadline(task.deadline || "");
    setPriority(task.priority || "medium");
    setTodoType(task.type || "standard");
    setTagsInput((task.tags || []).join(", "));
    setIsPinned(Boolean(task.isPinned));
    setEditingId(id);

    if (isMobileViewport) {
      setIsMobileComposerOpen(true);
      return;
    }

    titleInputRef.current?.focus();
  };

  const pendingDeleteTask =
    pendingDeleteId !== null
      ? todos.find((item) => item.id === pendingDeleteId) || null
      : null;

  const requestDelete = (id) => {
    setPendingDeleteId(id);
  };

  const closeDeleteModal = () => {
    setPendingDeleteId(null);
  };

  const handleDelete = () => {
    if (!pendingDeleteId) {
      return;
    }

    const id = pendingDeleteId;

    setTodos((currentTodos) => currentTodos.filter((item) => item.id !== id));
    setPendingDeleteId(null);

    if (editingId === id) {
      resetForm();

      if (isMobileViewport) {
        closeMobileComposer();
      }
    }
  };

  const handleSubmit = (event) => {
    event?.preventDefault();

    const title = todo.trim();
    const notes = description.trim();
    const parsedTags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 4);
    const nextErrors = {};

    if (!title) {
      nextErrors.todo = "Task name is required.";
    } else if (title.length < 3) {
      nextErrors.todo = "Task name must be at least 3 characters.";
    }

    if (!deadline) {
      nextErrors.deadline = "Date is required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});

    if (editingId) {
      setTodos((currentTodos) =>
        currentTodos.map((item) =>
          item.id === editingId
            ? (() => {
                const todayInIST = getTodayInIST();
                const existingHistory = normalizeCompletionHistory(
                  item.completionHistory,
                  item.completedOnDate,
                );
                const completionHistory =
                  todoType === "daily"
                    ? item.type === "daily"
                      ? existingHistory
                      : item.isCompleted
                        ? [todayInIST]
                        : []
                    : [];

                return {
                  ...item,
                  todo: title,
                  description: notes,
                  deadline,
                  priority,
                  type: todoType,
                  isPinned,
                  tags: parsedTags,
                  isCompleted:
                    todoType === "daily"
                      ? completionHistory.includes(todayInIST)
                      : item.isCompleted,
                  completedOnDate:
                    todoType === "daily" && completionHistory.includes(todayInIST)
                      ? todayInIST
                      : null,
                  completionHistory,
                };
              })()
            : item,
        ),
      );

      if (isMobileViewport) {
        closeMobileComposer();
      }

      resetForm();
      return;
    }

    setTodos((currentTodos) => [
      {
        id: uuidv4(),
        todo: title,
        description: notes,
        deadline,
        priority,
        type: todoType,
        isPinned,
        tags: parsedTags,
        isCompleted: false,
        completedOnDate: null,
        completionHistory: [],
        createdAt: new Date().toISOString(),
      },
      ...currentTodos,
    ]);

    if (isMobileViewport) {
      closeMobileComposer();
    }

    resetForm();
  };

  const handleThemeToggle = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  const handlePinToggle = (id) => {
    setTodos((currentTodos) =>
      currentTodos.map((item) =>
        item.id === id
          ? {
              ...item,
              isPinned: !item.isPinned,
            }
          : item,
      ),
    );
  };

  const renderTaskList = (items) =>
    items.map((item) => {
      const priorityMeta = getPriority(item.priority, item.isCompleted);
      const dueMeta =
        item.type === "daily"
          ? { label: "Resets daily at 12:00 AM IST", tone: "daily" }
          : getDueMeta(item.deadline, item.isCompleted);
      const taskTypeMeta = getTaskTypeMeta(item);
      const streakMeta =
        activeFilter === "recurring" && item.type === "daily"
          ? getRecurringStreakMeta(item)
          : null;

      return (
        <article
          key={item.id}
          className={`task-card group ${item.isCompleted ? "task-card-complete" : ""}`}
        >
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => handleCheckbox(item.id)}
              className={`checkbox-chip ${item.isCompleted ? "checkbox-chip-active" : ""}`}
              aria-label={
                item.isCompleted ? "Mark task incomplete" : "Mark task complete"
              }
            >
              <FiCheck className="text-sm" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.isPinned && (
                      <span className="metadata-pill metadata-pill-pin">
                        Pinned
                      </span>
                    )}
                    {taskTypeMeta && (
                      <span
                        className={`metadata-pill metadata-pill-${taskTypeMeta.tone}`}
                      >
                        <FiRepeat className="text-sm" />
                        {taskTypeMeta.label}
                      </span>
                    )}
                    <h4
                      className={`text-base font-semibold tracking-[-0.02em] text-[var(--text-primary)] sm:text-lg ${
                        item.isCompleted ? "line-through opacity-60" : ""
                      }`}
                    >
                      {item.todo}
                    </h4>
                  </div>
                  {item.description && (
                    <p
                      className={`mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] ${
                        item.isCompleted ? "opacity-50" : ""
                      }`}
                    >
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start opacity-100 transition-all duration-200 lg:translate-y-1 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handlePinToggle(item.id)}
                    className={`icon-button ${item.isPinned ? "icon-button-active" : ""}`}
                    aria-label={item.isPinned ? "Unpin task" : "Pin task"}
                  >
                    <FiBookmark />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(item.id)}
                    className="icon-button"
                    aria-label="Edit task"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    type="button"
                    onClick={() => requestDelete(item.id)}
                    className="icon-button"
                    aria-label="Delete task"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
                <span className={`metadata-pill metadata-pill-${dueMeta.tone}`}>
                  {dueMeta.label}
                </span>
                <span
                  className={`metadata-pill metadata-pill-${priorityMeta.tone}`}
                >
                  <span
                    className={`priority-dot priority-dot-${priorityMeta.tone}`}
                  />
                  {priorityMeta.label}
                </span>
                {item.tags?.map((tag) => (
                  <span
                    key={`${item.id}-${tag}`}
                    className="metadata-pill metadata-pill-tag"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {streakMeta && (
                <div className="streak-card mt-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`streak-flame ${streakMeta.completedToday ? "streak-flame-active" : ""}`}
                      >
                        <HiOutlineFire className="text-lg" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {streakMeta.label}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {streakMeta.hint}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Best {streakMeta.longestStreak}d
                    </p>
                  </div>
                  <div className="streak-track mt-3">
                    <div
                      className={`streak-fill ${streakMeta.completedToday ? "streak-fill-active" : ""}`}
                      style={{ width: `${Math.max(streakMeta.progress, 6)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>
      );
    });

  const composerContent = (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex items-start justify-between gap-4 sm:items-start">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Focused planning
          </p>
          <h2 className="display-face mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            {editingId ? "Refine your task" : "What needs to be done?"}
          </h2>
        </div>

        {isMobileViewport && (
          <button
            type="button"
            onClick={dismissComposer}
            className="icon-button h-10 w-10 shrink-0 rounded-2xl sm:hidden"
            aria-label="Close add task modal"
          >
            <FiX />
          </button>
        )}
      </div>

      <form className="grid gap-3 text-center sm:text-left" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-center sm:text-left">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Task Name <span className="text-rose-400">*</span>
          </span>
          <input
            ref={titleInputRef}
            value={todo}
            onChange={(event) => {
              setTodo(event.target.value);
              setFormErrors((currentErrors) => ({
                ...currentErrors,
                todo: "",
              }));
            }}
            type="text"
            placeholder="What needs to be done?"
            className={`soft-input text-center text-base sm:text-left sm:text-lg ${
              formErrors.todo ? "ring-2 ring-rose-400/70" : ""
            }`}
          />
          {formErrors.todo && (
            <span className="text-sm font-medium text-rose-400">
              {formErrors.todo}
            </span>
          )}
        </label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows="3"
          placeholder="Add description (optional)"
          className="soft-input min-h-28 resize-none text-center text-sm sm:text-left"
        />
        <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-stretch">
          <label className="soft-input flex min-w-0 items-center justify-center gap-3 text-center text-sm text-[var(--text-secondary)] sm:flex-1 sm:basis-44 sm:justify-start sm:text-left">
            <FiCalendar className="text-base text-[var(--accent)]" />
            <span className="shrink-0 font-medium">
              Date <span className="text-rose-400">*</span>
            </span>
            <input
              value={deadline}
              onChange={(event) => {
                setDeadline(event.target.value);
                setFormErrors((currentErrors) => ({
                  ...currentErrors,
                  deadline: "",
                }));
              }}
              type="date"
              style={{ colorScheme: theme }}
              className="date-input w-full bg-transparent text-center text-[var(--text-primary)] outline-none sm:text-left"
            />
          </label>
          {formErrors.deadline && (
            <p className="-mt-1 text-sm font-medium text-rose-400 sm:basis-full sm:text-left">
              {formErrors.deadline}
            </p>
          )}
          <label className="soft-input flex min-w-0 items-center justify-center gap-3 text-center text-sm text-[var(--text-secondary)] sm:flex-1 sm:basis-44 sm:justify-start sm:text-left">
            <FiAlertCircle className="text-base text-[var(--accent)]" />
            <div className="select-shell">
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="select-input w-full bg-transparent text-center text-[var(--text-primary)] outline-none sm:text-left"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label} priority
                  </option>
                ))}
              </select>
              <FiChevronDown className="select-chevron" />
            </div>
          </label>
          <label className="soft-input flex min-w-0 items-center justify-center gap-3 text-center text-sm text-[var(--text-secondary)] sm:flex-1 sm:basis-48 sm:justify-start sm:text-left">
            <FiRepeat className="text-base text-[var(--accent)]" />
            <div className="select-shell">
              <select
                value={todoType}
                onChange={(event) => setTodoType(event.target.value)}
                className="select-input w-full bg-transparent text-center text-[var(--text-primary)] outline-none sm:text-left"
              >
                {TODO_TYPE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FiChevronDown className="select-chevron" />
            </div>
          </label>
          <div
            className={`min-w-0 grid gap-3 sm:flex-1 ${
              editingId
                ? "grid-cols-1 sm:basis-72 sm:grid-cols-2 xl:grid-cols-3"
                : "grid-cols-1 sm:basis-60 sm:grid-cols-2"
            }`}
          >
            <div className="min-w-0 sm:text-left">
              <button
                type="button"
                onClick={() => setIsPinned((currentValue) => !currentValue)}
                className={`soft-button w-full min-w-0 ${isPinned ? "soft-button-active" : ""}`}
              >
                {isPinned ? "Pinned" : "Pin Task"}
              </button>
            </div>
            {editingId && (
              <div className="min-w-0 sm:text-left">
                <button
                  type="button"
                  onClick={dismissComposer}
                  className="soft-button w-full min-w-0"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="min-w-0 sm:text-left">
              <button
                type="submit"
                disabled={todo.trim().length < 3 || !deadline}
                className="accent-button w-full min-w-0"
              >
                {editingId ? "Update Task" : "Add Task"}
              </button>
            </div>
          </div>
        </div>
        <label className="soft-input flex items-center justify-center gap-3 text-center text-sm text-[var(--text-secondary)] sm:justify-start sm:text-left">
          <FiTag className="text-base text-[var(--accent)]" />
          <input
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            type="text"
            placeholder="Tags: Work, Study, Health"
            className="w-full bg-transparent text-center text-[var(--text-primary)] outline-none sm:text-left"
          />
        </label>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,92,255,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(124,92,255,0.08),_transparent_28%)]" />
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:96px_96px]" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-8 surface-panel flex h-[calc(100vh-4rem)] flex-col justify-between p-5">
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
                  <h1 className="display-face pb-3 mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                    LineUp
                  </h1>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
                  Workspace
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  A calm place to capture what matters and move through it with
                  less friction.
                </p>
              </div>

              <nav className="space-y-2">
                {SIDEBAR_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeFilter === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveFilter(item.id)}
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
              <p className="font-medium text-[var(--text-primary)]">
                Today at a glance
              </p>
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

        <main className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col gap-5">
          <Navbar
            theme={theme}
            onToggleTheme={handleThemeToggle}
            onQuickAdd={openComposer}
          />

          <section className="surface-panel mx-auto hidden w-full max-w-3xl p-4 sm:block sm:p-5 lg:mx-0 lg:max-w-none">
            {composerContent}
          </section>

          <section className="surface-panel mx-auto flex w-full max-w-3xl items-start gap-3 px-5 py-4 sm:px-5 sm:py-5 lg:mx-0 lg:max-w-none">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <FiAlertCircle className="text-lg" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Smart suggestion
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                {insight}
              </p>
            </div>
          </section>

          <section className="filter-strip mx-auto text-[12px] flex flex-wrap w-full max-w-3xl gap-3 px-1 pb-1 lg:hidden">
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`pill-tab ${isActive ? "pill-tab-active" : "pill-tab-idle"}`}
                >
                  {filter.label}
                </button>
              );
            })}
          </section>

          {activeFilter === "recurring" && (
            <section className="streak-panel surface-panel mx-auto w-full max-w-3xl px-5 py-4 sm:px-5 sm:py-5 lg:mx-0 lg:max-w-none">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    Recurring momentum
                  </p>
                  <h3 className="display-face mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                    Keep the chain warm, day after day.
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    Your recurring todos reset at midnight IST. Finish them today to
                    protect the streak and grow tomorrow from a clean slate.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[28rem]">
                  <div className="streak-stat">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Completed today
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                      {recurringSummary.completedToday}/{recurringSummary.total}
                    </p>
                  </div>
                  <div className="streak-stat">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Best current streak
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                      {recurringSummary.currentBest}d
                    </p>
                  </div>
                  <div className="streak-stat">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Best ever streak
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                      {recurringSummary.longestEver}d
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`streak-flame ${recurringSummary.completedToday > 0 ? "streak-flame-active" : ""}`}
                    >
                      <HiOutlineFire className="text-lg" />
                    </span>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Today&apos;s recurring streak bar
                    </p>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    {Math.round(recurringSummary.completionRate)}%
                  </p>
                </div>
                <div className="streak-track mt-3">
                  <div
                    className={`streak-fill ${recurringSummary.completedToday > 0 ? "streak-fill-active" : ""}`}
                    style={{
                      width: `${Math.max(recurringSummary.total > 0 ? recurringSummary.completionRate : 0, recurringSummary.completedToday > 0 ? 10 : 0)}%`,
                    }}
                  />
                </div>
              </div>
            </section>
          )}

          <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-1 pb-6 lg:mx-0 lg:max-w-none lg:px-0">
            <div className="flex items-center justify-between px-1 sm:px-0">
              <div>
                <h3 className="display-face text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                  {activeFilter === "all"
                    ? "All tasks"
                    : activeFilter === "today"
                      ? "Due today"
                      : activeFilter === "upcoming"
                        ? "Upcoming"
                        : activeFilter === "recurring"
                          ? "Recurring rituals"
                        : "Completed"}
                </h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {sortedTodos.length} task{sortedTodos.length === 1 ? "" : "s"}{" "}
                  in view
                </p>
              </div>
            </div>

            {sortedTodos.length === 0 ? (
              <div className="surface-panel flex flex-1 items-center justify-center p-8 text-center">
                <div className="max-w-sm">
                  <p className="display-face text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                    Nothing here yet.
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                    Add a task or switch filters to pick up where you left off.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {pinnedTodos.length > 0 && activeFilter !== "completed" && (
                  <div className="space-y-3">
                    <div>
                      <p className="display-face text-lg font-semibold text-[var(--text-primary)]">
                        Pinned tasks
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Keep your most important work anchored at the top.
                      </p>
                    </div>
                    {renderTaskList(pinnedTodos)}
                  </div>
                )}

                {regularTodos.length > 0 && (
                  <div className="space-y-3">
                    {pinnedTodos.length > 0 && activeFilter !== "completed" && (
                      <div>
                        <p className="display-face text-lg font-semibold text-[var(--text-primary)]">
                          Everything else
                        </p>
                      </div>
                    )}
                    {renderTaskList(regularTodos)}
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>

      {isMobileViewport && isMobileComposerOpen && (
        <div className="mobile-modal-shell sm:hidden">
          <button
            type="button"
            className="mobile-modal-backdrop"
            onClick={dismissComposer}
            aria-label="Close task modal"
          />
          <div className="mobile-modal-panel surface-panel">
            {composerContent}
          </div>
        </div>
      )}

      {pendingDeleteTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 border-0 bg-[rgba(3,5,10,0.62)] backdrop-blur-sm"
            onClick={closeDeleteModal}
            aria-label="Close delete confirmation"
          />
          <div className="surface-panel relative w-full max-w-md rounded-[28px] p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/12 text-rose-400">
                <FiTrash2 className="text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  Delete task
                </p>
                <h3 className="display-face mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                  Remove this task?
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text-primary)]">
                    {pendingDeleteTask.todo}
                  </span>{" "}
                  will be deleted permanently. This action can&apos;t be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="soft-button w-full"
              >
                Keep task
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="w-full rounded-2xl border-0 bg-rose-500 px-5 py-3.5 font-semibold text-white shadow-[0_16px_30px_rgba(244,63,94,0.24)] transition hover:bg-rose-600 active:scale-[0.98]"
              >
                Delete task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
