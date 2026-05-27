import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiCheckSquare,
  FiClock,
  FiFolder,
  FiTrendingDown,
  FiTrendingUp,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Doughnut, Line, Bar } from "react-chartjs-2";
import api from "../../api/client";
import { useDashboardWorkspace } from "./DashboardLayout";

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsTab() {
  const { showToast, dashboardData } = useDashboardWorkspace();
  const [range, setRange] = useState("month"); // today, week, month, year, custom
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [loading, setLoading] = useState(true);

  // Raw fetched datasets
  const [allTasks, setAllTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [backendAnalytics, setBackendAnalytics] = useState(null);

  // Monitor dark mode state for live chart redrawing
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("theme-dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("theme-dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Compute theme colors dynamically
  const colors = useMemo(() => {
    return {
      primary: isDarkMode ? "#22D3EE" : "#0E7490",       // Cyan
      secondary: isDarkMode ? "#818CF8" : "#4F46E5",     // Indigo
      accent: isDarkMode ? "#C084FC" : "#F97316",        // Orange (Light) / Purple (Dark)
      success: "#16A34A",
      warning: "#F59E0B",
      danger: "#DC2626",
      textPrimary: isDarkMode ? "#F8FAFC" : "#0F172A",
      textMuted: isDarkMode ? "#CBD5E1" : "#64748B",
      border: isDarkMode ? "#475569" : "#D1D5DB",
      surface: isDarkMode ? "#1E293B" : "#ffffff",
      surfaceSubtle: isDarkMode ? "#334155" : "#F8FAFC",
    };
  }, [isDarkMode]);

  // Fetch all tasks using automatic pagination loop
  const fetchAllTasks = async () => {
    const firstRes = await api.get("/tasks", { params: { limit: 100 } });
    const firstData = firstRes.data.data || [];
    const meta = firstRes.data.meta || {};

    if (meta.totalPages && meta.totalPages > 1) {
      const promises = [];
      for (let p = 2; p <= meta.totalPages; p++) {
        promises.push(api.get("/tasks", { params: { limit: 100, page: p } }));
      }
      const results = await Promise.all(promises);
      const restData = results.flatMap((r) => r.data.data || []);
      return [...firstData, ...restData];
    }
    return firstData;
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Backend api queries can run in parallel
      const rangeParam = ["week", "month", "year"].includes(range) ? range : "month";
      const [analyticsRes, projectsRes, tasksList] = await Promise.all([
        api.get("/analytics", { params: { range: rangeParam } }).catch(() => null),
        api.get("/projects").catch(() => ({ data: { data: [] } })),
        fetchAllTasks().catch(() => []),
      ]);

      if (analyticsRes) {
        setBackendAnalytics(analyticsRes.data.data);
      }
      setProjects(projectsRes.data.data || []);
      setAllTasks(tasksList);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to load productivity metrics");
    } finally {
      setLoading(false);
    }
  }, [range, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 1. DATE BOUNDARIES FOR CURRENT FILTER PERIOD
  const filterBoundaries = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (range === "today") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (range === "week") {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (range === "month") {
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
    } else if (range === "year") {
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
    } else if (range === "custom") {
      if (customStart) {
        start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
      } else {
        start = new Date(0);
      }
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      } else {
        end = new Date();
      }
    }

    return { start, end };
  }, [range, customStart, customEnd]);

  // 2. DYNAMICALLY FILTER TASKS FOR ACTIVE PERIOD
  const filteredTasks = useMemo(() => {
    const { start, end } = filterBoundaries;
    return allTasks.filter((task) => {
      const createdDate = new Date(task.createdAt);
      const updatedDate = new Date(task.updatedAt);
      return (
        (createdDate >= start && createdDate <= end) ||
        (updatedDate >= start && updatedDate <= end)
      );
    });
  }, [allTasks, filterBoundaries]);

  // 3. DYNAMICALLY FILTER TASKS FOR PREVIOUS COMPARED PERIOD
  const previousPeriodTasks = useMemo(() => {
    const { start: currentStart, end: currentEnd } = filterBoundaries;
    const durationMs = currentEnd - currentStart;

    const prevEnd = new Date(currentStart.getTime() - 1);
    const prevStart = new Date(currentStart.getTime() - durationMs);

    return allTasks.filter((task) => {
      const createdDate = new Date(task.createdAt);
      const updatedDate = new Date(task.updatedAt);
      return (
        (createdDate >= prevStart && createdDate <= prevEnd) ||
        (updatedDate >= prevStart && updatedDate <= prevEnd)
      );
    });
  }, [allTasks, filterBoundaries]);

  // 4. STATISTICAL CALCULATIONS FOR OVERVIEW & TRENDS
  const stats = useMemo(() => {
    const computeStatsForSet = (tasksList) => {
      const total = tasksList.length;
      const completed = tasksList.filter((t) => t.status === "completed").length;
      const pending = total - completed;
      const overdue = tasksList.filter(
        (t) => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < new Date()
      ).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Completion Duration calculation
      const completedWithTimes = tasksList.filter(
        (t) => t.status === "completed" && t.createdAt && t.updatedAt
      );
      const avgDurationHours = completedWithTimes.length
        ? completedWithTimes.reduce(
            (sum, t) => sum + (new Date(t.updatedAt) - new Date(t.createdAt)),
            0
          ) / (1000 * 60 * 60 * completedWithTimes.length)
        : 0;

      return { total, completed, pending, overdue, rate, avgDurationHours };
    };

    const current = computeStatsForSet(filteredTasks);
    const prev = computeStatsForSet(previousPeriodTasks);

    return {
      current,
      trends: {
        rateDiff: current.rate - prev.rate,
        overdueDiff: current.overdue - prev.overdue,
        completedDiff: current.completed - prev.completed,
      },
    };
  }, [filteredTasks, previousPeriodTasks]);

  // 5. STREAK GAME ENGINE
  const currentStreak = useMemo(() => {
    const completedTimes = allTasks
      .filter((t) => t.status === "completed" && t.updatedAt)
      .map((t) => {
        const d = new Date(t.updatedAt);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      });

    if (completedTimes.length === 0) return 0;

    // Unique sorted descending timestamps
    const uniqueCompletions = Array.from(new Set(completedTimes)).sort((a, b) => b - a);

    const today = new Date();
    const todayTimestamp = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const yesterdayTimestamp = todayTimestamp - 24 * 60 * 60 * 1000;

    // Must have completed a task either today or yesterday to maintain active streak
    if (uniqueCompletions[0] !== todayTimestamp && uniqueCompletions[0] !== yesterdayTimestamp) {
      return 0;
    }

    let streak = 1;
    for (let i = 0; i < uniqueCompletions.length - 1; i++) {
      const diff = uniqueCompletions[i] - uniqueCompletions[i + 1];
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (diff === oneDayMs) {
        streak++;
      } else if (diff > oneDayMs) {
        break;
      }
    }
    return streak;
  }, [allTasks]);

  // 6. BUSIEST/FASTEST PRODUCTIVITY DAYS
  const busiestDays = useMemo(() => {
    const createdCounts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    const completedCounts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

    filteredTasks.forEach((t) => {
      const creationDay = new Date(t.createdAt).toLocaleDateString("en-US", { weekday: "short" });
      createdCounts[creationDay] = (createdCounts[creationDay] || 0) + 1;

      if (t.status === "completed" && t.updatedAt) {
        const completionDay = new Date(t.updatedAt).toLocaleDateString("en-US", { weekday: "short" });
        completedCounts[completionDay] = (completedCounts[completionDay] || 0) + 1;
      }
    });

    const busiest = Object.entries(createdCounts).sort((a, b) => b[1] - a[1])[0];
    const fastest = Object.entries(completedCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      busiest: busiest && busiest[1] > 0 ? busiest[0] : "N/A",
      fastest: fastest && fastest[1] > 0 ? fastest[0] : "N/A",
    };
  }, [filteredTasks]);

  // 7. TASK STATUS AND PRIORITY COUNTS
  const statusCounts = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;
    const now = new Date();

    filteredTasks.forEach((t) => {
      if (t.status === "completed") {
        completed++;
      } else {
        if (t.dueDate && new Date(t.dueDate) < now) {
          overdue++;
        } else if (t.status === "in_progress") {
          inProgress++;
        } else {
          pending++;
        }
      }
    });

    return { pending, inProgress, completed, overdue };
  }, [filteredTasks]);

  const priorityCounts = useMemo(() => {
    let low = 0;
    let medium = 0;
    let high = 0;

    filteredTasks.forEach((t) => {
      if (t.priority === "low") low++;
      else if (t.priority === "high") high++;
      else medium++;
    });

    return { low, medium, high };
  }, [filteredTasks]);

  // 8. CATEGORY ANALYSIS
  const categoryAnalysis = useMemo(() => {
    const map = {};
    filteredTasks.forEach((t) => {
      const cat = t.category || "Personal";
      if (!map[cat]) {
        map[cat] = { total: 0, completed: 0 };
      }
      map[cat].total++;
      if (t.status === "completed") {
        map[cat].completed++;
      }
    });

    const categories = Object.entries(map).map(([name, stat]) => ({
      name,
      total: stat.total,
      completed: stat.completed,
      rate: Math.round((stat.completed / stat.total) * 100) || 0,
    })).sort((a, b) => b.total - a.total);

    const topCategory = categories[0]?.name || "N/A";

    return { list: categories, topCategory };
  }, [filteredTasks]);

  // 9. COLLABORATION INTEGRATIONS
  const collaboration = useMemo(() => {
    const currentUserId = dashboardData?.user?.id;
    if (!currentUserId) return { assigned: 0, completed: 0, pending: 0, list: [] };

    const myTasks = allTasks.filter((t) => t.assignedTo && String(t.assignedTo) === String(currentUserId));
    const assigned = myTasks.length;
    const completed = myTasks.filter((t) => t.status === "completed").length;
    const pending = assigned - completed;

    // Timeline of recent assignment events
    const list = allTasks
      .filter((t) => t.assignedTo && t.assignedAt)
      .sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt))
      .slice(0, 5)
      .map((t) => ({
        id: t._id,
        title: t.title,
        date: new Date(t.assignedAt).toLocaleDateString(),
        message: String(t.assignedTo) === String(currentUserId) ? "Assigned to you" : "Assigned to collaborator",
      }));

    return { assigned, completed, pending, list };
  }, [allTasks, dashboardData]);

  // 10. PROJECT STATISTICS
  const projectStats = useMemo(() => {
    if (!projects.length) {
      return { list: [], activeCount: 0, mostActive: "N/A", highestWorkload: "N/A" };
    }

    const list = projects.map((p) => {
      const projectTasks = allTasks.filter((t) => String(t.projectId) === String(p._id));
      const total = projectTasks.length;
      const completed = projectTasks.filter((t) => t.status === "completed").length;
      const pending = total - completed;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: p._id,
        title: p.title,
        color: p.color || "#0E7490",
        total,
        completed,
        pending,
        progress,
        status: p.status,
      };
    });

    const activeCount = list.filter((p) => p.status === "active").length;
    const sortedByTotal = [...list].sort((a, b) => b.total - a.total);
    const mostActive = sortedByTotal[0]?.total > 0 ? sortedByTotal[0] : null;

    const sortedByPending = [...list].sort((a, b) => b.pending - a.pending);
    const highestWorkload = sortedByPending[0]?.pending > 0 ? sortedByPending[0] : null;

    return {
      list,
      activeCount,
      mostActive: mostActive ? mostActive.title : "N/A",
      highestWorkload: highestWorkload ? highestWorkload.title : "N/A",
    };
  }, [projects, allTasks]);

  // 11. UPCOMING DEADLINES & PRESSURE FORECASTS
  const deadlines = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const endOfThisWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    const pending = allTasks.filter((t) => t.status !== "completed" && t.dueDate);

    const todayCount = pending.filter((t) => {
      const d = new Date(t.dueDate);
      return d >= startOfToday && d <= endOfToday;
    }).length;

    const weekCount = pending.filter((t) => {
      const d = new Date(t.dueDate);
      return d >= startOfToday && d <= endOfThisWeek;
    }).length;

    const overdueCount = pending.filter((t) => new Date(t.dueDate) < now).length;

    const upcomingList = [...pending]
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5)
      .map((t) => {
        const project = projects.find((p) => String(p._id) === String(t.projectId));
        return {
          id: t._id,
          title: t.title,
          dueDate: new Date(t.dueDate).toLocaleDateString(),
          priority: t.priority,
          projectTitle: project ? project.title : null,
          projectColor: project ? project.color : null,
        };
      });

    return { todayCount, weekCount, overdueCount, list: upcomingList };
  }, [allTasks, projects]);

  // 12. MONTHLY PERFORMANCE COMPARISONS
  const monthlyComparison = useMemo(() => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const completedThis = allTasks.filter((t) => {
      if (t.status !== "completed" || !t.updatedAt) return false;
      const d = new Date(t.updatedAt);
      return d >= startOfThisMonth && d <= now;
    }).length;

    const completedLast = allTasks.filter((t) => {
      if (t.status !== "completed" || !t.updatedAt) return false;
      const d = new Date(t.updatedAt);
      return d >= startOfLastMonth && d <= endOfLastMonth;
    }).length;

    const diff = completedThis - completedLast;
    const pctChange = completedLast > 0 ? Math.round((diff / completedLast) * 100) : 0;

    return { thisMonth: completedThis, lastMonth: completedLast, diff, pctChange };
  }, [allTasks]);

  // 13. WEEKLY TREND DATA POINT LOADER
  const weeklyTrend = useMemo(() => {
    const labels = [];
    const values = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      labels.push(d.toLocaleDateString("en-US", { weekday: "short" }));

      const compOnDay = allTasks.filter((t) => {
        if (t.status !== "completed" || !t.updatedAt) return false;
        return new Date(t.updatedAt).toDateString() === d.toDateString();
      }).length;

      values.push(compOnDay);
    }

    return { labels, values };
  }, [allTasks]);

  // 14. HEURISTIC SMART INSIGHT GENERATOR
  const smartInsights = useMemo(() => {
    const list = [];
    const { current, trends } = stats;

    if (busiestDays.fastest !== "N/A") {
      list.push(`You finish the most tasks on ${busiestDays.fastest}s. Consider scheduling critical focus blocks then.`);
    }

    const highPending = filteredTasks.filter((t) => t.status !== "completed" && t.priority === "high").length;
    if (highPending > 2) {
      list.push(`Heads up: You have ${highPending} pending high-priority tasks. Addressing these will ease workflow bottlenecks.`);
    }

    if (current.rate >= 75) {
      list.push("Your task completion rate is high! You have excellent completion momentum.");
    } else if (current.rate > 0 && current.rate < 40) {
      list.push("Workload pressure is building up. Try focusing on single, high-impact tasks first.");
    }

    if (deadlines.todayCount > 0) {
      list.push(`Urgent: You have ${deadlines.todayCount} task${deadlines.todayCount > 1 ? "s" : ""} due today.`);
    }

    if (currentStreak >= 3) {
      list.push(`Excellent streak! You've completed tasks ${currentStreak} days in a row. Keep the spark alive! 🔥`);
    }

    if (trends.rateDiff > 5) {
      list.push(`Your completion rate increased by ${trends.rateDiff}% compared to last period. Great job!`);
    }

    if (!list.length) {
      list.push("Complete tasks and structure projects to view personalized workflow observations here.");
      list.push("Regular updates will unlock advanced streak trackers and trend comparisons.");
    }

    return list;
  }, [filteredTasks, stats, busiestDays, deadlines, currentStreak]);

  // 15. CHART DATA DEFINITIONS
  const doughnutData = useMemo(() => {
    const { pending, inProgress, completed, overdue } = statusCounts;
    return {
      labels: ["Completed", "In Progress", "Pending", "Overdue"],
      datasets: [
        {
          data: [completed, inProgress, pending, overdue],
          backgroundColor: [
            colors.success,
            colors.secondary,
            colors.primary,
            colors.danger,
          ],
          borderColor: colors.surface,
          borderWidth: 2,
        },
      ],
    };
  }, [statusCounts, colors]);

  const priorityData = useMemo(() => {
    const { low, medium, high } = priorityCounts;
    return {
      labels: ["Low Priority", "Medium Priority", "High Priority"],
      datasets: [
        {
          data: [low, medium, high],
          backgroundColor: [
            colors.primary + "CC",
            colors.secondary + "CC",
            colors.accent + "CC",
          ],
          borderColor: [
            colors.primary,
            colors.secondary,
            colors.accent,
          ],
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [priorityCounts, colors]);

  const trendData = useMemo(() => {
    return {
      labels: weeklyTrend.labels,
      datasets: [
        {
          label: "Completed Tasks",
          data: weeklyTrend.values,
          borderColor: colors.primary,
          backgroundColor: colors.primary + "1A",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: colors.primary,
          pointBorderColor: colors.surface,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [weeklyTrend, colors]);

  // Helper formatting for durations
  const formatDuration = (hours) => {
    if (!hours || isNaN(hours)) return "0h";
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Header & Filters Section */}
      <section className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Productivity Intelligence</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Analyze your performance, track collaboration streaks, and plan deadlines.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {["today", "week", "month", "year", "custom"].map((item) => (
              <button
                key={item}
                onClick={() => setRange(item)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors border ${
                  range === item
                    ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]"
                    : "bg-[var(--surface)] text-[var(--text-primary)] border-[var(--line-soft)] hover:bg-[var(--surface-subtle)]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Picker Drawer */}
        <AnimatePresence>
          {range === "custom" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-[var(--line-soft)] overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input text-xs"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input text-xs"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {loading ? (
        <div className="card p-8 flex items-center justify-center text-[var(--text-muted)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)] mr-3"></div>
          Calculating metrics and compiling insights...
        </div>
      ) : (
        <>
          {/* 1. PRODUCTIVITY OVERVIEW SECTION */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Total Tasks"
              value={stats.current.total}
              icon={<FiCheckSquare />}
              description="Created or updated"
            />
            <MetricCard
              label="Completed Tasks"
              value={stats.current.completed}
              icon={<FiCheckCircle />}
              trend={stats.trends.completedDiff}
              trendSuffix=" completed"
              description="Tasks completed in period"
            />
            <MetricCard
              label="Pending Tasks"
              value={stats.current.pending}
              icon={<FiClock />}
              description="Tasks remaining to do"
            />
            <MetricCard
              label="Overdue Tasks"
              value={stats.current.overdue}
              icon={<FiAlertCircle />}
              trend={stats.trends.overdueDiff}
              trendInverse
              trendSuffix=" overdue"
              description="Missed deadlines"
            />
            <MetricCard
              label="Completion Rate"
              value={`${stats.current.rate}%`}
              icon={<FiActivity />}
              trend={stats.trends.rateDiff}
              trendSuffix="%"
              description="Success percentage"
            />
            <MetricCard
              label="Active Projects"
              value={projectStats.activeCount}
              icon={<FiFolder />}
              description="Working collaborative boards"
            />
            <MetricCard
              label="Current Streak"
              value={`${currentStreak} Days`}
              icon={<FiZap className="text-amber-500 fill-amber-500/20" />}
              description="Active daily completions"
            />
            <MetricCard
              label="Avg Completion Time"
              value={formatDuration(stats.current.avgDurationHours)}
              icon={<FiClock />}
              description="Work cycle duration"
            />
          </section>

          {/* 2. TASK INSIGHTS SECTION */}
          <section className="grid lg:grid-cols-2 gap-6">
            <div className="card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <FiActivity className="text-[var(--brand-primary)]" /> Status Distribution
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Volume split across completion status levels.
                </p>
              </div>
              <div className="h-64 mt-4 relative">
                {filteredTasks.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--text-muted)]">
                    No task metrics for this range.
                  </div>
                ) : (
                  <Doughnut
                    data={doughnutData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "right",
                          labels: {
                            color: colors.textPrimary,
                            boxWidth: 12,
                            font: { family: "Inter, sans-serif", size: 11 },
                          },
                        },
                        tooltip: {
                          backgroundColor: colors.surface,
                          titleColor: colors.textPrimary,
                          bodyColor: colors.textPrimary,
                          borderColor: colors.border,
                          borderWidth: 1,
                        },
                      },
                      cutout: "68%",
                    }}
                  />
                )}
              </div>
            </div>

            <div className="card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <FiAlertCircle className="text-[var(--brand-accent)]" /> Priority Distribution
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Active priority levels in selected timeframes.
                </p>
              </div>
              <div className="h-64 mt-4 relative">
                {filteredTasks.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--text-muted)]">
                    No priority metrics for this range.
                  </div>
                ) : (
                  <Bar
                    data={priorityData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: "y",
                      scales: {
                        x: {
                          grid: { color: colors.border + "30" },
                          ticks: { color: colors.textMuted, stepSize: 1 },
                        },
                        y: {
                          grid: { display: false },
                          ticks: { color: colors.textPrimary, font: { family: "Inter, sans-serif" } },
                        },
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: colors.surface,
                          titleColor: colors.textPrimary,
                          bodyColor: colors.textPrimary,
                          borderColor: colors.border,
                          borderWidth: 1,
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>
          </section>

          {/* TASK CATEGORY ANALYSIS */}
          <section className="card p-6">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Category Completion Metrics</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Completions and distribution across different task categories.
            </p>
            <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAnalysis.list.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] col-span-3">No categories logged yet.</p>
              ) : (
                categoryAnalysis.list.map((cat) => (
                  <div
                    key={cat.name}
                    className="p-4 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-subtle)] flex flex-col justify-between hover-lift"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{cat.name}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {cat.completed}/{cat.total} Completed
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-[var(--line-soft)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--brand-primary)] rounded-full transition-all duration-500"
                          style={{ width: `${cat.rate}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[var(--text-primary)]">{cat.rate}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 3. DEADLINE & TIME ANALYTICS SECTION */}
          <section className="grid lg:grid-cols-2 gap-6">
            <div className="card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <FiCalendar className="text-[var(--brand-primary)]" /> Upcoming Deadlines
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Active pending tasks scheduled to finish soon.
                </p>
                <div className="mt-4 space-y-2">
                  {deadlines.list.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">No pending deadlines.</p>
                  ) : (
                    deadlines.list.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] flex items-center justify-between gap-3 hover-lift"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {task.title}
                          </p>
                          {task.projectTitle && (
                            <span
                              className="inline-flex items-center gap-1.5 text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full border"
                              style={{
                                color: task.projectColor,
                                borderColor: task.projectColor + "40",
                                backgroundColor: task.projectColor + "10",
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: task.projectColor }}
                              />
                              {task.projectTitle}
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs text-[var(--text-muted)]">{task.dueDate}</span>
                          <p className={`text-[10px] font-bold uppercase mt-1 ${
                            task.priority === "high" ? "text-[var(--brand-accent)]" : "text-[var(--text-muted)]"
                          }`}>
                            {task.priority}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <FiClock className="text-[var(--brand-secondary)]" /> Workload Pressure Indices
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Scheduler parameters and workload volume.
                </p>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="p-4 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-subtle)] text-center">
                    <p className="text-xs text-[var(--text-muted)] font-medium">Due Today</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)] mt-2">
                      {deadlines.todayCount}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-subtle)] text-center">
                    <p className="text-xs text-[var(--text-muted)] font-medium">Due This Week</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)] mt-2">
                      {deadlines.weekCount}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-subtle)] text-center">
                    <p className="text-xs text-[var(--text-muted)] font-medium">Overdue List</p>
                    <p className="text-2xl font-bold text-[var(--brand-accent)] mt-2">
                      {deadlines.overdueCount}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)]">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      Busiest Creation Day
                    </p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
                      <FiAward className="text-[var(--brand-primary)]" /> {busiestDays.busiest}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)]">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      Fastest Completion Day
                    </p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
                      <FiZap className="text-amber-500" /> {busiestDays.fastest}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. PROJECT ANALYTICS SECTION */}
          <section className="card p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <FiFolder className="text-[var(--brand-primary)]" /> Active Project Analytics
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Individual completion logs and tasks count per project.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-muted)]">
                <div>
                  Most Active: <span className="text-[var(--text-primary)] font-semibold">{projectStats.mostActive}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--line-soft)]" />
                <div>
                  Highest Workload: <span className="text-[var(--brand-accent)] font-semibold">{projectStats.highestWorkload}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectStats.list.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] col-span-3">No project data yet.</p>
              ) : (
                projectStats.list.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-4 rounded-xl border border-[var(--line-soft)] bg-[var(--surface)] flex flex-col justify-between hover-lift relative overflow-hidden"
                  >
                    {/* Visual Project Theme Border Accent */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: proj.color }}
                    />
                    <div className="flex items-start justify-between mt-1">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">
                          {proj.title}
                        </h4>
                        <span className="text-[10px] text-[var(--text-muted)] font-medium">
                          {proj.completed}/{proj.total} Tasks Completed
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-[var(--text-primary)]">
                        {proj.progress}%
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="h-1.5 rounded-full bg-[var(--line-soft)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${proj.progress}%`,
                            backgroundColor: proj.color,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-[10px] text-[var(--text-muted)]">
                      <span>Status: <span className="font-semibold text-[var(--text-primary)]">{proj.status}</span></span>
                      <span>Pending: <span className="font-semibold text-[var(--brand-accent)]">{proj.pending}</span></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 5. COLLABORATION INSIGHTS SECTION */}
          <section className="grid lg:grid-cols-3 gap-6">
            <div className="card p-6 lg:col-span-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <FiUsers className="text-[var(--brand-primary)]" /> Assigned Workload
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Team assignments assigned to you.
                </p>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Assigned Tasks</span>
                    <span className="font-semibold text-[var(--text-primary)]">{collaboration.assigned}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Completed Tasks</span>
                    <span className="font-semibold text-[var(--color-success-primary)]">{collaboration.completed}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Pending Tasks</span>
                    <span className="font-semibold text-[var(--brand-accent)]">{collaboration.pending}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <FiActivity className="text-[var(--brand-secondary)]" /> Team Task Timeline
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Recent activities and collaborative assignments.
                </p>
                <div className="mt-4 space-y-3">
                  {collaboration.list.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">No active logs in range.</p>
                  ) : (
                    collaboration.list.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between gap-4 p-2.5 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] text-xs hover-lift"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FiUsers className="text-[var(--brand-secondary)] shrink-0" />
                          <p className="text-[var(--text-primary)] font-medium truncate">
                            {log.title}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[var(--brand-primary)] font-semibold">{log.message}</span>
                          <span className="text-[var(--text-muted)] ml-2">{log.date}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 6. PERFORMANCE TRENDS & PRODUCTIVITY STREAK */}
          <section className="grid lg:grid-cols-3 gap-6">
            <div className="card p-6 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <FiActivity className="text-[var(--brand-primary)]" /> Weekly Productivity Trend
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Tasks completed day-by-day over the past week.
                </p>
              </div>
              <div className="h-56 mt-4 relative">
                <Line
                  data={trendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: { color: colors.textMuted, font: { family: "Inter, sans-serif" } },
                      },
                      y: {
                        grid: { color: colors.border + "20" },
                        ticks: { color: colors.textMuted, stepSize: 1 },
                      },
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: colors.surface,
                        titleColor: colors.textPrimary,
                        bodyColor: colors.textPrimary,
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="card p-6 lg:col-span-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <FiAward className="text-amber-500" /> Monthly Comparison
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Tasks completed in active vs. previous month.
                </p>
                <div className="mt-4 space-y-4">
                  <div className="p-4 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-subtle)] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase">This Month</p>
                      <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                        {monthlyComparison.thisMonth}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase">Last Month</p>
                      <p className="text-lg font-semibold text-[var(--text-muted)] mt-1">
                        {monthlyComparison.lastMonth}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {monthlyComparison.diff > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-success-primary)] bg-[var(--color-success-bg)] px-2 py-1 rounded-lg">
                        <FiTrendingUp /> +{monthlyComparison.pctChange}%
                      </span>
                    ) : monthlyComparison.diff < 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-lg">
                        <FiTrendingDown /> {monthlyComparison.pctChange}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)] bg-[var(--surface-subtle)] px-2 py-1 rounded-lg">
                        No Change
                      </span>
                    )}
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {monthlyComparison.diff > 0
                        ? `${monthlyComparison.diff} more tasks completed`
                        : `${Math.abs(monthlyComparison.diff)} fewer tasks completed`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 7. PRODUCTIVITY INSIGHTS PANEL ("SMART INSIGHTS") */}
          <section className="card p-6">
            <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <FiZap className="text-amber-500" /> Productivity Observations
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Data-backed productivity observations based on your task habits.
            </p>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {smartInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] flex items-start gap-2.5 hover-lift"
                >
                  <span className="text-base shrink-0 mt-0.5">💡</span>
                  <p className="font-medium leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// 16. PREMIUM ANIMATED METRIC CARD COMPONENT
function MetricCard({ label, value, icon, trend, trendSuffix = "", trendInverse = false, description }) {
  const isTrendPositive = trend > 0;
  const isTrendNegative = trend < 0;

  // Determine indicator colors depending on positive/negative or inverted logic (e.g. overdue tasks decreasing is positive)
  const isGoodTrend = (isTrendPositive && !trendInverse) || (isTrendNegative && trendInverse);
  const isBadTrend = (isTrendPositive && trendInverse) || (isTrendNegative && !trendInverse);

  return (
    <div className="card p-5 flex flex-col justify-between hover-lift">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">
          {label}
        </p>
        <span className="text-base text-[var(--brand-primary)] shrink-0">
          {icon}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-2xl font-bold text-[var(--text-primary)] leading-none">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 120 }}
            key={value}
            className="inline-block"
          >
            {value}
          </motion.span>
        </p>

        {trend !== undefined && trend !== 0 && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                isGoodTrend
                  ? "bg-[var(--color-success-bg)] text-[var(--color-success-primary)]"
                  : isBadTrend
                  ? "bg-red-100 text-red-600"
                  : "bg-[var(--surface-subtle)] text-[var(--text-muted)]"
              }`}
            >
              {isGoodTrend ? <FiTrendingUp /> : <FiTrendingDown />}
              {trend > 0 ? `+${trend}` : trend}
              {trendSuffix}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">vs last period</span>
          </div>
        )}
      </div>

      {description && (
        <p className="text-[10px] text-[var(--text-muted)] mt-2 border-t border-[var(--line-soft)] pt-2">
          {description}
        </p>
      )}
    </div>
  );
}
