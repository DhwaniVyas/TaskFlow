import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/client";
import { useDashboardWorkspace } from "./DashboardLayout";

const initialProject = {
  title: "",
  description: "",
  category: "General",
  color: "#0E7490",
  status: "active",
  startDate: "",
  targetDate: "",
};

export default function ProjectsTab() {
  const { showToast } = useDashboardWorkspace();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialProject);
  const [openProject, setOpenProject] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/projects");
      setProjects(data.data || []);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(initialProject);
    setShowModal(true);
  };

  const openEdit = (project) => {
    setEditing(project);
    setForm({
      title: project.title || "",
      description: project.description || "",
      category: project.category || "General",
      color: project.color || "#0E7490",
      status: project.status || "active",
      startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : "",
      targetDate: project.targetDate ? new Date(project.targetDate).toISOString().slice(0, 10) : "",
    });
    setShowModal(true);
  };

  const saveProject = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/projects/${editing._id}`, form);
        showToast("Project updated");
      } else {
        await api.post("/projects", form);
        showToast("Project created");
      }
      setShowModal(false);
      await fetchProjects();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save project");
    }
  };

  const archiveProject = async (id) => {
    try {
      await api.patch(`/projects/${id}/archive`);
      showToast("Project archived");
      await fetchProjects();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to archive");
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await api.delete(`/projects/${id}`);
      showToast("Project deleted");
      await fetchProjects();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to delete");
    }
  };

  const statusCounts = useMemo(() => {
    const map = { active: 0, planning: 0, completed: 0, archived: 0 };
    for (const p of projects) map[p.status] = (map[p.status] || 0) + 1;
    return map;
  }, [projects]);

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#082F38]">Projects</h2>
            <p className="text-sm text-[#5B9EA8] mt-1">Organize tasks by project with progress tracking.</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>Create Project</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-[#F8FCFD] border border-[#E2F4F6] text-sm">Active: <b>{statusCounts.active}</b></div>
          <div className="p-3 rounded-lg bg-[#F8FCFD] border border-[#E2F4F6] text-sm">Planning: <b>{statusCounts.planning}</b></div>
          <div className="p-3 rounded-lg bg-[#F8FCFD] border border-[#E2F4F6] text-sm">Completed: <b>{statusCounts.completed}</b></div>
          <div className="p-3 rounded-lg bg-[#F8FCFD] border border-[#E2F4F6] text-sm">Archived: <b>{statusCounts.archived}</b></div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="card p-6 text-[#5B9EA8]">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="card p-6 text-[#5B9EA8]">No projects yet. Create your first project.</div>
        ) : (
          projects.map((project) => (
            <div key={project._id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-[#082F38]">{project.title}</h3>
                <span className="text-[10px] px-2 py-1 rounded uppercase" style={{ background: `${project.color}22`, color: project.color }}>
                  {project.category}
                </span>
              </div>
              <p className="text-sm text-[#5B9EA8] mt-1">{project.description || "No description"}</p>
              <div className="mt-3 text-xs text-[#5B9EA8]">Members: {(project.members || []).length} | Tasks: {(project.tasks || []).length}</div>
              <div className="mt-2 text-xs text-[#5B9EA8]">Deadline: {project.targetDate ? new Date(project.targetDate).toLocaleDateString() : "N/A"}</div>
              <div className="mt-3">
                <div className="h-2 rounded bg-[#E2F4F6] overflow-hidden"><div className="h-full" style={{ width: `${project.progress || 0}%`, background: project.color }} /></div>
                <p className="text-xs text-[#5B9EA8] mt-1">Progress: {project.progress || 0}%</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn btn-secondary !text-xs" onClick={async () => {
                  const { data } = await api.get(`/projects/${project._id}`);
                  setOpenProject(data.data);
                }}>Open</button>
                <button className="btn btn-secondary !text-xs" onClick={() => openEdit(project)}>Edit</button>
                <button className="btn btn-secondary !text-xs" onClick={() => archiveProject(project._id)}>Archive</button>
                <button className="btn btn-accent !text-xs" onClick={() => deleteProject(project._id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl w-full max-w-xl p-6">
            <h3 className="text-lg font-semibold text-[#082F38] mb-4">{editing ? "Edit Project" : "Create Project"}</h3>
            <form onSubmit={saveProject} className="space-y-3">
              <input className="form-input w-full" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
              <textarea className="form-textarea w-full" rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              <div className="grid md:grid-cols-3 gap-3">
                <input className="form-input" placeholder="Category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
                <input type="color" className="form-input h-[42px]" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} />
                <select className="form-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="planning">Planning</option><option value="active">Active</option><option value="completed">Completed</option>
                </select>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <input type="date" className="form-input" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
                <input type="date" className="form-input" value={form.targetDate} onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openProject && (
        <div className="card p-6">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-semibold text-[#082F38]">{openProject.project.title}</h3>
            <button className="btn btn-secondary !text-xs" onClick={() => setOpenProject(null)}>Close</button>
          </div>
          <p className="text-sm text-[#5B9EA8] mt-1">{openProject.project.description || "No description"}</p>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <h4 className="font-semibold text-[#082F38]">Project Tasks</h4>
              <div className="space-y-2 mt-2">
                {(openProject.tasks || []).length === 0 ? (
                  <p className="text-sm text-[#5B9EA8]">No tasks linked yet.</p>
                ) : (
                  openProject.tasks.map((task) => (
                    <div key={task._id} className="border border-[#E2F4F6] rounded p-2 text-sm">
                      <p className="font-medium text-[#082F38]">{task.title}</p>
                      <p className="text-xs text-[#5B9EA8]">{task.status.replace("_", " ")} | {task.priority}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-[#082F38]">Members</h4>
              <div className="space-y-2 mt-2">
                {(openProject.project.members || []).map((m, idx) => (
                  <div key={`${m.user?._id || idx}-${idx}`} className="border border-[#E2F4F6] rounded p-2 text-sm">
                    <p className="font-medium text-[#082F38]">{m.user?.fullName || "Member"}</p>
                    <p className="text-xs text-[#5B9EA8]">{m.user?.email || "N/A"} | {m.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
