import React, { useEffect, useMemo, useState } from "react";

const initialProfileForm = {
  fullName: "",
  avatar: "",
  bio: "",
  timezone: "",
  themePreference: "light",
  phoneNumber: "",
  notificationPreferences: {
    project: true,
    task: true,
  },
  password: "",
};

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString();
}

export default function ProfileEditModal({ open, user, saving, onSave, onClose }) {
  const [form, setForm] = useState(initialProfileForm);

  useEffect(() => {
    if (!open || !user) return;
    setForm({
      fullName: user.fullName || "",
      avatar: user.avatar || "",
      bio: user.bio || "",
      timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      themePreference: user.themePreference || "light",
      phoneNumber: user.phoneNumber || "",
      notificationPreferences: {
        project: user.notificationPreferences?.project ?? true,
        task: user.notificationPreferences?.task ?? true,
      },
      password: "",
    });
  }, [open, user]);

  const isDirty = useMemo(() => {
    if (!user) return false;
    return (
      form.fullName !== (user.fullName || "") ||
      form.avatar !== (user.avatar || "") ||
      form.bio !== (user.bio || "") ||
      form.timezone !== (user.timezone || "") ||
      form.themePreference !== (user.themePreference || "light") ||
      form.phoneNumber !== (user.phoneNumber || "") ||
      JSON.stringify(form.notificationPreferences) !== JSON.stringify(user.notificationPreferences || initialProfileForm.notificationPreferences) ||
      form.password !== ""
    );
  }, [form, user]);

  if (!open) return null;

  const accountType = user?.provider === "google" ? "Google" : "Local";

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4">
      <div className="bg-[var(--surface)] rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto border border-[var(--line-soft)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Edit Profile</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className="space-y-4"
        >
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Email (Read Only)</label>
              <input className="form-input w-full !bg-[var(--surface-subtle)]" value={user?.email || ""} readOnly />
            </div>
            <div>
              <label className="form-label">Provider (Read Only)</label>
              <input className="form-input w-full !bg-[var(--surface-subtle)]" value={accountType} readOnly />
            </div>
            <div>
              <label className="form-label">Joined Date (Read Only)</label>
              <input className="form-input w-full !bg-[var(--surface-subtle)]" value={formatDate(user?.createdAt)} readOnly />
            </div>
            <div>
              <label className="form-label">Full Name</label>
              <input
                className="form-input w-full"
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="form-label">Phone Number (SMS Alerts)</label>
              <input
                className="form-input w-full"
                value={form.phoneNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="e.g. +1234567890 (optional)"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Profile Picture URL</label>
            <input
              className="form-input w-full"
              value={form.avatar}
              onChange={(e) => setForm((prev) => ({ ...prev, avatar: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="form-label">Bio</label>
            <textarea
              className="form-textarea w-full"
              rows={3}
              maxLength={300}
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="form-label">Timezone</label>
              <input
                className="form-input w-full"
                value={form.timezone}
                onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Theme Preference</label>
              <select
                className="form-select w-full"
                value={form.themePreference}
                onChange={(e) => setForm((prev) => ({ ...prev, themePreference: e.target.value }))}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="form-label">Password (Optional)</label>
              <input
                type="password"
                className="form-input w-full"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Leave blank to keep current"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Notifications</label>
            <div className="grid md:grid-cols-2 gap-3 mt-2">
              {[
                ["project", "Project Notifications"],
                ["task", "Task Notifications"],
              ].map(([key, label]) => (
                <label key={key} className="text-xs text-[var(--text-primary)] flex items-center gap-2 border border-[var(--line-soft)] bg-[var(--surface-subtle)] rounded px-3 py-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.notificationPreferences[key])}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        notificationPreferences: {
                          ...prev.notificationPreferences,
                          [key]: e.target.checked,
                        },
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>{isDirty ? "Unsaved changes" : "No pending changes"}</span>
            <span>Email, provider, and joined date are read-only</span>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                if (isDirty && !window.confirm("You have unsaved profile changes. Discard them?")) return;
                onClose();
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
