import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/client";
import { useDashboardWorkspace } from "./DashboardLayout";

const ranges = ["week", "month", "quarter", "year"];

export default function AnalyticsTab() {
  const { showToast } = useDashboardWorkspace();
  const [range, setRange] = useState("month");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const loadAnalytics = useCallback(async (selectedRange) => {
    try {
      setLoading(true);
      const { data } = await api.get("/analytics", { params: { range: selectedRange } });
      setAnalytics(data.data);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAnalytics(range);
  }, [loadAnalytics, range]);

  const metrics = analytics?.metrics || {};
  const statusDonut = useMemo(() => analytics?.charts?.statusDonut || [], [analytics]);
  const tasksByCategory = useMemo(() => analytics?.charts?.tasksByCategory || [], [analytics]);
  const projectCompletion = analytics?.charts?.projectCompletion || [];
  const insights = analytics?.insights || {};
  const totalStatus = useMemo(() => statusDonut.reduce((sum, item) => sum + (item.value || 0), 0), [statusDonut]);
  const totalCategory = useMemo(() => tasksByCategory.reduce((sum, item) => sum + (item.value || 0), 0), [tasksByCategory]);

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Analytics & Productivity</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">Auto-generated performance insights from your tasks and projects.</p>
          </div>
          <select className="form-select w-40" value={range} onChange={(e) => setRange(e.target.value)}>
            {ranges.map((item) => (
              <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>
            ))}
          </select>
        </div>
      </section>

      {loading ? (
        <section className="card p-6 text-[var(--text-muted)]">Loading analytics...</section>
      ) : (
        <>
          <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Completed" value={metrics.completed || 0} />
            <MetricCard label="Created (Range)" value={metrics.createdInRange || 0} />
            <MetricCard label="Overdue" value={metrics.overdue || 0} />
            <MetricCard label="Completion %" value={`${metrics.completionRate || 0}%`} />
            <MetricCard label="Avg Completion Time" value={`${metrics.averageCompletionHours || 0}h`} />
            <MetricCard label="Tasks / Day" value={metrics.tasksPerDay || 0} />
            <MetricCard label="Tasks / Week" value={metrics.tasksPerWeek || 0} />
            <MetricCard label="Total Tasks" value={metrics.total || 0} />
          </section>

          <section className="grid lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Task Completion Mix</h3>
              <div className="mt-4 space-y-3">
                {statusDonut.map((item) => {
                  const width = totalStatus > 0 ? Math.round(((item.value || 0) / totalStatus) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm text-[var(--text-primary)]">
                        <span>{item.label}</span>
                        <span>{item.value || 0}</span>
                      </div>
                      <div className="mt-1 h-2 rounded bg-[var(--surface-subtle)] border border-[var(--line-soft)] overflow-hidden">
                        <div className="h-full bg-[var(--brand-primary)]" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card p-5">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Project Progress</h3>
              <div className="mt-3 space-y-3">
                {projectCompletion.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No project data yet.</p>
                ) : (
                  projectCompletion.map((project) => (
                    <div key={project.id}>
                      <div className="flex items-center justify-between text-sm text-[var(--text-primary)]">
                        <span>{project.title}</span>
                        <span>{project.progress || 0}%</span>
                      </div>
                      <div className="mt-1 h-2 rounded bg-[var(--surface-subtle)] border border-[var(--line-soft)] overflow-hidden">
                        <div className="h-full bg-[var(--brand-secondary)]" style={{ width: `${project.progress || 0}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="card p-6">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Category Distribution</h3>
            <div className="mt-4 space-y-3">
              {tasksByCategory.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No category data yet.</p>
              ) : (
                tasksByCategory.map((item) => {
                  const width = totalCategory > 0 ? Math.round(((item.value || 0) / totalCategory) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm text-[var(--text-primary)]">
                        <span>{item.label}</span>
                        <span>{item.value || 0}</span>
                      </div>
                      <div className="mt-1 h-2 rounded bg-[var(--surface-subtle)] border border-[var(--line-soft)] overflow-hidden">
                        <div className="h-full bg-[var(--brand-accent)]" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="card p-6">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Performance Insights</h3>
            <div className="grid md:grid-cols-3 gap-3 mt-3 text-sm">
              <InsightCard title="Most Productive Day" value={insights.mostProductiveDay || "N/A"} />
              <InsightCard title="Top Category" value={insights.topCategory || "N/A"} />
              <InsightCard title="Most Delayed Category" value={insights.mostDelayedCategory || "N/A"} />
            </div>
            <div className="mt-3 text-sm">
              <InsightCard title="Suggestion" value={insights.highCompletionStreakSuggestion || "Keep your daily workflow focused."} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="text-xl font-semibold text-[var(--text-primary)] mt-1">{value}</p>
    </div>
  );
}

function InsightCard({ title, value }) {
  return (
    <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] p-4">
      <p className="text-xs text-[var(--text-muted)]">{title}</p>
      <p className="font-medium text-[var(--text-primary)] mt-1">{value}</p>
    </div>
  );
}
