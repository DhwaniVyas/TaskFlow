import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { useDashboardWorkspace } from "./DashboardLayout";

const initialInvite = { projectId: "", email: "", role: "member" };
const initialAssign = { taskId: "", assigneeId: "" };
const initialComment = { taskId: "", message: "" };

export default function TeamTab() {
  const { showToast } = useDashboardWorkspace();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [inviteForm, setInviteForm] = useState(initialInvite);
  const [assignForm, setAssignForm] = useState(initialAssign);
  const [commentForm, setCommentForm] = useState(initialComment);
  const [comments, setComments] = useState([]);

  const bootstrap = async () => {
    try {
      const [projectsRes, tasksRes, activityRes] = await Promise.all([
        api.get("/projects"),
        api.get("/tasks"),
        api.get("/team/activity"),
      ]);
      setProjects(projectsRes.data.data || []);
      setTasks(tasksRes.data.data || []);
      setActivity(activityRes.data.data || []);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to load team workspace");
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await api.post("/team/invite", inviteForm);
      showToast("Member invited");
      setInviteForm(initialInvite);
      await bootstrap();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to invite member");
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post("/team/assign", assignForm);
      showToast("Task assigned");
      setAssignForm(initialAssign);
      await bootstrap();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to assign task");
    }
  };

  const loadComments = async (taskId) => {
    if (!taskId) return setComments([]);
    try {
      const { data } = await api.get(`/team/comments/${taskId}`);
      setComments(data.data || []);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to fetch comments");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    try {
      await api.post("/team/comments", commentForm);
      showToast("Comment added");
      setCommentForm((prev) => ({ ...prev, message: "" }));
      await loadComments(commentForm.taskId);
      await bootstrap();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to add comment");
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="text-xl font-semibold text-[#082F38]">Team Workspace</h2>
        <p className="text-sm text-[#5B9EA8] mt-1">Invite members, assign tasks, and track collaboration activity.</p>
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <form onSubmit={handleInvite} className="card p-5 space-y-3">
          <h3 className="font-semibold text-[#082F38]">Invite Member</h3>
          <select className="form-select" value={inviteForm.projectId} onChange={(e) => setInviteForm((p) => ({ ...p, projectId: e.target.value }))} required>
            <option value="">Select Project</option>
            {projects.map((project) => <option key={project._id} value={project._id}>{project.title}</option>)}
          </select>
          <input className="form-input" type="email" placeholder="Member email" value={inviteForm.email} onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))} required />
          <select className="form-select" value={inviteForm.role} onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value }))}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
          <button className="btn btn-primary" type="submit">Send Invite</button>
        </form>

        <form onSubmit={handleAssign} className="card p-5 space-y-3">
          <h3 className="font-semibold text-[#082F38]">Assign Task</h3>
          <select className="form-select" value={assignForm.taskId} onChange={(e) => setAssignForm((p) => ({ ...p, taskId: e.target.value }))} required>
            <option value="">Select Task</option>
            {tasks.map((task) => <option key={task._id} value={task._id}>{task.title}</option>)}
          </select>
          <input className="form-input" placeholder="Assignee User ID" value={assignForm.assigneeId} onChange={(e) => setAssignForm((p) => ({ ...p, assigneeId: e.target.value }))} required />
          <p className="text-xs text-[#5B9EA8]">Use the invited member's user id from DB/user lookup.</p>
          <button className="btn btn-primary" type="submit">Assign</button>
        </form>

        <form onSubmit={handleComment} className="card p-5 space-y-3">
          <h3 className="font-semibold text-[#082F38]">Task Comments</h3>
          <select
            className="form-select"
            value={commentForm.taskId}
            onChange={(e) => {
              const nextTaskId = e.target.value;
              setCommentForm((p) => ({ ...p, taskId: nextTaskId }));
              loadComments(nextTaskId);
            }}
            required
          >
            <option value="">Select Task</option>
            {tasks.map((task) => <option key={task._id} value={task._id}>{task.title}</option>)}
          </select>
          <textarea className="form-textarea" rows={3} placeholder="Write comment..." value={commentForm.message} onChange={(e) => setCommentForm((p) => ({ ...p, message: e.target.value }))} required />
          <button className="btn btn-primary" type="submit">Add Comment</button>
        </form>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-[#082F38]">Recent Activity</h3>
          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
            {activity.length === 0 ? (
              <p className="text-sm text-[#5B9EA8]">No activity yet.</p>
            ) : (
              activity.map((log) => (
                <div key={log._id} className="border border-[#E2F4F6] rounded p-2 text-sm">
                  <p className="text-[#082F38]">{log.action}</p>
                  <p className="text-xs text-[#5B9EA8]">
                    {new Date(log.createdAt).toLocaleString()} by {log.actor?.fullName || "User"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-[#082F38]">Task Comment Thread</h3>
          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-sm text-[#5B9EA8]">Select a task to view comments.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="border border-[#E2F4F6] rounded p-2">
                  <p className="text-sm text-[#082F38]">{comment.message}</p>
                  <p className="text-xs text-[#5B9EA8] mt-1">
                    {comment.user?.fullName || "User"} • {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
