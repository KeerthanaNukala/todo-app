"use client";

import { useEffect, useMemo, useState } from "react";

const taskTabs = [
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "active", label: "Active" },
  { id: "missed", label: "Missed" },
  { id: "completed", label: "Completed" },
  { id: "deleted", label: "Deleted" },
];

const bottomTabs = [
  { id: "tasks", label: "Tasks" },
  { id: "stats", label: "Stats" },
  { id: "profile", label: "Profile" },
];

export default function Home() {
  const [username, setUsername] = useState("");
  const [loginName, setLoginName] = useState("");
  const [screen, setScreen] = useState("stats");
  const [taskTab, setTaskTab] = useState("today");
  const [task, setTask] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [taskType, setTaskType] = useState("personal");
  const [priority, setPriority] = useState("medium");
  const [tasks, setTasks] = useState([]);
  const [dateTime, setDateTime] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("todo-username");
    const savedTasks = localStorage.getItem("todo-tasks");

    if (savedName) setUsername(savedName);

    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch {
        setTasks([]);
      }
    }

    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem("todo-tasks", JSON.stringify(tasks));
    }
  }, [tasks, hasLoaded]);

  useEffect(() => {
    setDateTime(new Date());
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const now = dateTime || new Date();

  const isSameDay = (dateA, dateB) =>
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate();

  const getLocalDateTimeValue = (date) => {
    const localDate = new Date(date);
    localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
    return localDate.toISOString().slice(0, 16);
  };

  const getDefaultEndDate = (start) => {
    const endDate = new Date(start);
    endDate.setHours(endDate.getHours() + 24);
    return getLocalDateTimeValue(endDate);
  };

  const formatDateTime = (value) =>
    new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getDuration = (start, end) => {
    const minutes = Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours && remainingMinutes) return `${hours}h ${remainingMinutes}m`;
    if (hours) return `${hours}h`;
    return `${remainingMinutes}m`;
  };

  const resetForm = () => {
    setTask("");
    setScheduledStart("");
    setScheduledEnd("");
    setTaskType("personal");
    setPriority("medium");
    setEditingTaskId(null);
  };

  const openAddTask = () => {
    resetForm();
    setScreen("tasks");
    setTaskTab("today");
    setShowAddTask(true);
  };

  const handleLogin = () => {
    const trimmed = loginName.trim();
    if (!trimmed) return;

    setUsername(trimmed);
    localStorage.setItem("todo-username", trimmed);
  };

  const handleLogout = () => {
    localStorage.removeItem("todo-username");
    setUsername("");
    setLoginName("");
    setScreen("stats");
    setShowAddTask(false);
    resetForm();
  };

  const handleAddTask = () => {
    const trimmed = task.trim();
    if (!trimmed || !scheduledStart) return;

    const finalEndDate = scheduledEnd || getDefaultEndDate(scheduledStart);

    if (new Date(finalEndDate) <= new Date(scheduledStart)) {
      alert("End date and time should be after scheduled date and time.");
      return;
    }

    if (editingTaskId) {
      setTasks((current) =>
        current.map((item) =>
          item.id === editingTaskId
            ? {
                ...item,
                label: trimmed,
                scheduledStart,
                scheduledEnd: finalEndDate,
                taskType,
                priority,
              }
            : item
        )
      );
    } else {
      setTasks((current) => [
        ...current,
        {
          id: Date.now().toString(),
          label: trimmed,
          scheduledStart,
          scheduledEnd: finalEndDate,
          taskType,
          priority,
          status: "active",
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    resetForm();
    setShowAddTask(false);
    setScreen("tasks");
    setTaskTab("today");
  };

  const handleEditTask = (todo) => {
    setTask(todo.label);
    setScheduledStart(todo.scheduledStart);
    setScheduledEnd(todo.scheduledEnd);
    setTaskType(todo.taskType);
    setPriority(todo.priority);
    setEditingTaskId(todo.id);
    setScreen("tasks");
    setShowAddTask(true);
  };

  const updateTaskStatus = (id, status, extraData = {}) => {
    setTasks((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status, ...extraData } : item
      )
    );
  };

  const handleCompleteTask = (id) => {
    updateTaskStatus(id, "completed", {
      completedAt: new Date().toISOString(),
    });
  };

  const handleDeleteTask = (id) => {
    updateTaskStatus(id, "deleted", {
      deletedAt: new Date().toISOString(),
    });
  };

  const handleRestoreTask = (id) => {
    updateTaskStatus(id, "active", {
      deletedAt: undefined,
      completedAt: undefined,
    });
  };

  const visibleTasks = useMemo(() => {
    return tasks.filter((item) => {
      const startDate = new Date(item.scheduledStart);
      const endDate = new Date(item.scheduledEnd);
      const isMissed = item.status === "active" && endDate < now;

      if (taskTab === "missed") return isMissed;
      if (taskTab === "today") {
        return item.status === "active" && !isMissed && isSameDay(startDate, now);
      }
      if (taskTab === "upcoming") {
        return item.status === "active" && !isMissed && startDate > now && !isSameDay(startDate, now);
      }
      if (taskTab === "active") return item.status === "active" && !isMissed;

      return item.status === taskTab;
    });
  }, [tasks, taskTab, dateTime]);

  const todayTasks = tasks.filter((item) =>
    isSameDay(new Date(item.scheduledStart), now)
  );

  const todayCompleted = todayTasks.filter((item) => item.status === "completed").length;
  const todayPercent = todayTasks.length
    ? Math.round((todayCompleted / todayTasks.length) * 100)
    : 0;

  const missedCount = tasks.filter(
    (item) => item.status === "active" && new Date(item.scheduledEnd) < now
  ).length;

  const weekPerformance = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(now);
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - 6 + index);

      const dayTasks = tasks.filter((item) =>
        isSameDay(new Date(item.scheduledStart), day)
      );

      const completed = dayTasks.filter((item) => item.status === "completed").length;
      const percent = dayTasks.length ? Math.round((completed / dayTasks.length) * 100) : 0;

      return {
        label: day.toLocaleDateString([], { weekday: "short" }),
        total: dayTasks.length,
        completed,
        percent,
      };
    });
  }, [tasks, dateTime]);

  const priorityStyles = {
    high: "bg-red-500/15 text-red-300",
    medium: "bg-yellow-500/15 text-yellow-300",
    low: "bg-emerald-500/15 text-emerald-300",
  };

  if (!username) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08111f] px-4 py-8 text-white sm:px-6">
        <div className="w-full max-w-md rounded-[2rem] border border-blue-400/20 bg-[#101a2e] p-6 shadow-2xl sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-400 sm:text-sm">
            Todo Dashboard
          </p>

          <h1 className="mt-5 text-3xl font-black text-blue-400 sm:text-4xl">
            What should we call you?
          </h1>

          <input
            type="text"
            value={loginName}
            onChange={(event) => setLoginName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleLogin();
            }}
            placeholder="Enter your name"
            className="mt-8 w-full rounded-2xl border border-blue-400/20 bg-[#07101f] px-4 py-4 text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
          />

          <button
            type="button"
            onClick={handleLogin}
            disabled={!loginName.trim()}
            className="mt-4 w-full rounded-2xl bg-blue-500 px-5 py-4 font-black text-white transition hover:bg-blue-400 disabled:bg-slate-700 disabled:text-slate-400"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08111f] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#091326] md:max-w-3xl lg:max-w-6xl">
        <header className="border-b border-blue-400/10 px-4 pb-5 pt-6 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-3xl font-black uppercase tracking-tight text-blue-400 sm:text-4xl lg:text-5xl">
                Hello,
              </p>
              <h1 className="mt-1 break-words text-2xl font-black text-white sm:text-3xl lg:text-4xl">
                {username}
              </h1>
            </div>

            <button
              type="button"
              onClick={openAddTask}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500 text-3xl font-light leading-none text-white shadow-xl transition hover:bg-blue-400 sm:h-14 sm:w-14 sm:text-4xl"
              aria-label="Add task"
            >
              +
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-28 pt-5 sm:px-6 lg:px-8">
          {showAddTask && (
            <section className="mb-6 rounded-[1.75rem] border border-blue-400/15 bg-[#111c31] p-4 sm:p-5 lg:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black">
                  {editingTaskId ? "Edit Task" : "Create Task"}
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowAddTask(false);
                  }}
                  className="rounded-full bg-[#091326] px-4 py-2 text-sm font-bold text-slate-300"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <input
                  type="text"
                  value={task}
                  onChange={(event) => setTask(event.target.value)}
                  placeholder="Task name"
                  className="rounded-2xl border border-blue-400/15 bg-[#091326] px-4 py-4 text-white outline-none placeholder:text-slate-500 focus:border-blue-400 lg:col-span-2"
                />

                <input
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(event) => setScheduledStart(event.target.value)}
                  className="rounded-2xl border border-blue-400/15 bg-[#091326] px-4 py-4 text-white outline-none focus:border-blue-400 [color-scheme:dark]"
                />

                <input
                  type="datetime-local"
                  value={scheduledEnd}
                  onChange={(event) => setScheduledEnd(event.target.value)}
                  className="rounded-2xl border border-blue-400/15 bg-[#091326] px-4 py-4 text-white outline-none focus:border-blue-400 [color-scheme:dark]"
                />

                <select
                  value={taskType}
                  onChange={(event) => setTaskType(event.target.value)}
                  className="rounded-2xl border border-blue-400/15 bg-[#091326] px-4 py-4 text-white outline-none [color-scheme:dark]"
                >
                  <option value="personal">Personal</option>
                  <option value="home">Home</option>
                  <option value="office">Office</option>
                </select>

                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="rounded-2xl border border-blue-400/15 bg-[#091326] px-4 py-4 text-white outline-none [color-scheme:dark]"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <button
                  type="button"
                  disabled={!task.trim() || !scheduledStart}
                  onClick={handleAddTask}
                  className="rounded-2xl bg-blue-500 px-5 py-4 font-black text-white disabled:bg-slate-700 disabled:text-slate-400 lg:col-span-2"
                >
                  {editingTaskId ? "Save Task" : "Add Task"}
                </button>
              </div>
            </section>
          )}

          {screen === "stats" && (
            <>
              <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[1.75rem] border border-blue-400/15 bg-[#111c31] p-5 sm:p-6">
                  <h2 className="text-xl font-black text-slate-200">
                    Today's Task Completion
                  </h2>

                  <div className="mt-8 flex justify-center">
                    <div
                      className="relative flex h-44 w-44 items-center justify-center rounded-full sm:h-52 sm:w-52"
                      style={{
                        background: `conic-gradient(#3b82f6 ${todayPercent}%, #1d2940 ${todayPercent}% 100%)`,
                      }}
                    >
                      <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[#111c31] sm:h-36 sm:w-36">
                        <p className="text-3xl font-black sm:text-4xl">
                          {todayCompleted}/{todayTasks.length}
                        </p>
                        <p className="text-xs font-black uppercase text-slate-400 sm:text-sm">
                          Tasks
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-base font-bold text-slate-300 sm:text-lg">
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 rounded-full bg-blue-500" />
                      Completed
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 rounded-full bg-[#1d2940]" />
                      Remaining
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-blue-400/15 bg-[#111c31] p-5 sm:p-6">
                  <h2 className="text-xl font-black text-slate-200">
                    Weekly Performance
                  </h2>

                  <div className="mt-8 flex h-56 items-end gap-2 sm:h-64 sm:gap-4">
                    {weekPerformance.map((day) => (
                      <div key={day.label} className="flex h-full flex-1 flex-col justify-end">
                        <div className="flex h-40 items-end sm:h-48">
                          <div
                            className="w-full rounded-t-3xl bg-gradient-to-t from-blue-700 to-blue-400 transition-all"
                            style={{
                              height: day.percent > 0 ? `${Math.max(day.percent, 14)}%` : "8%",
                              opacity: day.percent > 0 ? 1 : 0.35,
                            }}
                          />
                        </div>

                        <p className="mt-4 text-center text-xs font-black text-slate-400 sm:text-sm">
                          {day.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-[1.5rem] bg-[#111c31] p-5">
                  <p className="text-sm font-bold text-slate-400">Total</p>
                  <p className="mt-2 text-3xl font-black">{tasks.length}</p>
                </div>

                <div className="rounded-[1.5rem] bg-[#111c31] p-5">
                  <p className="text-sm font-bold text-slate-400">Today</p>
                  <p className="mt-2 text-3xl font-black">{todayTasks.length}</p>
                </div>

                <div className="rounded-[1.5rem] bg-[#111c31] p-5">
                  <p className="text-sm font-bold text-slate-400">Completed</p>
                  <p className="mt-2 text-3xl font-black">{todayCompleted}</p>
                </div>

                <div className="rounded-[1.5rem] bg-[#111c31] p-5">
                  <p className="text-sm font-bold text-slate-400">Missed</p>
                  <p className="mt-2 text-3xl font-black">{missedCount}</p>
                </div>
              </section>
            </>
          )}

          {screen === "tasks" && (
            <section>
              <div className="mb-5 flex gap-2 overflow-x-auto pb-2 lg:flex-wrap lg:overflow-visible">
                {taskTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTaskTab(tab.id)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-black ${
                      taskTab === tab.id
                        ? "bg-blue-500 text-white"
                        : "bg-[#111c31] text-slate-400"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {visibleTasks.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-blue-400/20 bg-[#111c31] px-5 py-16 text-center text-slate-400">
                  No tasks
                </div>
              ) : (
                <ul className="grid gap-4 lg:grid-cols-2">
                  {visibleTasks.map((todo) => {
                    const isMissed =
                      todo.status === "active" && new Date(todo.scheduledEnd) < now;

                    return (
                      <li
                        key={todo.id}
                        className="relative rounded-[1.5rem] border border-blue-400/10 bg-[#111c31] p-5 pr-14"
                      >
                        <button
                          type="button"
                          title="Edit task"
                          onClick={() => handleEditTask(todo)}
                          className="absolute right-4 top-4 rounded-full bg-[#091326] px-3 py-2 text-blue-400"
                        >
                          &#9998;
                        </button>

                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={todo.status === "completed"}
                            disabled={todo.status === "deleted"}
                            onChange={() =>
                              todo.status === "completed"
                                ? handleRestoreTask(todo.id)
                                : handleCompleteTask(todo.id)
                            }
                            className="mt-1 h-5 w-5 accent-blue-500"
                          />

                          <div>
                            <p
                              className={`break-words text-lg font-black ${
                                todo.status === "completed"
                                  ? "text-slate-500 line-through"
                                  : "text-white"
                              }`}
                            >
                              {todo.label}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                              <span className="rounded-full bg-[#091326] px-3 py-1 text-slate-300">
                                {todo.taskType}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 ${
                                  priorityStyles[todo.priority]
                                }`}
                              >
                                {todo.priority}
                              </span>

                              {isMissed && (
                                <span className="rounded-full bg-red-500/15 px-3 py-1 text-red-300">
                                  Missed
                                </span>
                              )}

                              <span className="rounded-full bg-[#091326] px-3 py-1 text-slate-300">
                                {formatDateTime(todo.scheduledStart)}
                              </span>

                              <span className="rounded-full bg-[#091326] px-3 py-1 text-slate-300">
                                {getDuration(todo.scheduledStart, todo.scheduledEnd)}
                              </span>
                            </div>

                            <div className="mt-4">
                              {todo.status === "deleted" ? (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreTask(todo.id)}
                                  className="rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-black text-emerald-300"
                                >
                                  Restore
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(todo.id)}
                                  className="rounded-full bg-[#091326] px-4 py-2 text-sm font-black text-slate-300"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {screen === "profile" && (
            <div className="mx-auto max-w-xl rounded-[1.75rem] bg-[#111c31] p-6">
              <p className="text-sm font-bold text-slate-400">Profile</p>
              <h2 className="mt-2 break-words text-3xl font-black">{username}</h2>

              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("todo-username");
                  setUsername("");
                  setLoginName("");
                }}
                className="mt-6 w-full rounded-2xl bg-blue-500 px-5 py-3 font-black text-white"
              >
                Change Name
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 w-full rounded-2xl bg-red-500/15 px-5 py-3 font-black text-red-300"
              >
                Logout
              </button>
            </div>
          )}
        </main>

        <nav className="fixed bottom-0 left-1/2 z-10 grid h-24 w-full max-w-md -translate-x-1/2 grid-cols-3 rounded-t-[2rem] border border-blue-400/15 bg-[#111c31] px-5 pb-4 pt-3 md:max-w-3xl lg:max-w-6xl">
          {bottomTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setScreen(item.id);
                setShowAddTask(false);
              }}
              className={`rounded-2xl text-sm font-black ${
                screen === item.id ? "bg-blue-500 text-white" : "text-slate-400"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}