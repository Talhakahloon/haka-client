import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../services/api';
import {
  Moon,
  Sun,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Shield,
  Bell,
  Sliders,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function Settings() {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useUI();
  const {
    activeWorkspace,
    activeProject,
    workspaces,
    projects,
    tasks,
    deleteProject,
    deleteWorkspace,
    resetToDemoData
  } = useWorkspace();

  const { preferences, updatePreferences, addToast } = useNotification();

  const isPrivileged = currentUser?.role === 'Admin' || currentUser?.role === 'Owner';

  const handleExport = () => {
    const data = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      workspaces,
      projects,
      tasks
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workspace-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ title: 'Export Successful', description: 'Backup file saved to your device.' });
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed.workspaces) && Array.isArray(parsed.projects) && Array.isArray(parsed.tasks)) {
          // Sync with server if online
          try {
            await api.importData(parsed);
          } catch (serverErr) {
            console.warn('[Import] Server sync failed, saving locally:', serverErr.message);
          }
          localStorage.setItem('wm_workspaces', JSON.stringify(parsed.workspaces));
          localStorage.setItem('wm_projects', JSON.stringify(parsed.projects));
          localStorage.setItem('wm_tasks', JSON.stringify(parsed.tasks));
          addToast({ title: 'Import Successful', description: 'Refreshing workspace...' });
          setTimeout(() => window.location.reload(), 800);
        } else {
          throw new Error('Missing required schema arrays (workspaces, projects, tasks).');
        }
      } catch (err) {
        addToast({
          title: 'Import Failed',
          description: err.message || 'Invalid JSON file schema.',
          type: 'destructive'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDemo = () => {
    if (confirm("Reset all workspaces, projects, and tasks back to fresh demo data? Any unsaved changes will be replaced.")) {
      resetToDemoData();
    }
  };

  const handleDeleteActiveProject = () => {
    if (!activeProject) return;
    if (confirm(`Are you sure you want to delete project "${activeProject.name}"?`)) {
      deleteProject(activeProject.id);
    }
  };

  const handleDeleteActiveWorkspace = () => {
    if (!activeWorkspace) return;
    if (confirm(`Are you sure you want to delete workspace "${activeWorkspace.name}"? All projects and tasks inside will be deleted.`)) {
      deleteWorkspace(activeWorkspace.id);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-8 text-foreground">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage system preferences, notifications, data portability, and permissions.
        </p>
      </div>

      {/* 1. Appearance */}
      <section className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs">
        <h2 className="text-base font-bold mb-1 flex items-center gap-2">
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          <span>Appearance & Theme</span>
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Personalize the look and feel of your interface.
        </p>

        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
          <div>
            <p className="text-xs font-bold text-foreground">Interface Mode</p>
            <p className="text-[11px] text-muted-foreground">Currently using {theme === 'dark' ? 'Dark theme' : 'Light theme'}</p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-input bg-background hover:bg-muted transition-colors flex items-center gap-2 shadow-2xs"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            <span>Toggle to {theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </section>

      {/* 2. Account Profile */}
      <section className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs">
        <h2 className="text-base font-bold mb-1 flex items-center gap-2">
          <Shield size={18} />
          <span>Active User Profile</span>
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Your current simulated identity and RBAC authorization tier.
        </p>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 border border-border/40">
          <img
            src={currentUser?.avatar}
            alt=""
            className="w-14 h-14 rounded-full object-cover border-2 border-primary/40 shadow-xs"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{currentUser?.name}</h3>
            <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary text-primary-foreground shadow-2xs">
                {currentUser?.role}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {currentUser?.title || 'Team Member'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. In-App Notification Preferences */}
      <section className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs">
        <h2 className="text-base font-bold mb-1 flex items-center gap-2">
          <Bell size={18} />
          <span>Notification & Simulation Controls</span>
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Choose what triggers toasts and notification bell updates.
        </p>

        <div className="space-y-3">
          {[
            { key: 'mentions', label: 'Mentions & Comments', desc: 'Alert when a teammate mentions you with @name' },
            { key: 'assignments', label: 'Task Assignments', desc: 'Alert when you are assigned or removed from a task' },
            { key: 'dueDates', label: 'Due Date Warnings', desc: 'Alert when deadlines are approaching within 3 days' },
            { key: 'simulatedActivity', label: 'Live Teammate Simulation Ticker', desc: 'Simulate background team activities from Bilal & Ayesha every 60s' }
          ].map(pref => (
            <div
              key={pref.key}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40"
            >
              <div>
                <p className="text-xs font-bold text-foreground">{pref.label}</p>
                <p className="text-[11px] text-muted-foreground">{pref.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(preferences[pref.key])}
                onChange={e => updatePreferences({ [pref.key]: e.target.checked })}
                className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
              />
            </div>
          ))}
        </div>
      </section>

      {/* 4. Data Portability & Demo Reset */}
      <section className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs">
        <h2 className="text-base font-bold mb-1 flex items-center gap-2">
          <Download size={18} />
          <span>Offline Data & Portability</span>
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Export full JSON snapshots, import backups with schema validation, or reset to clean mock data.
        </p>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/20 border border-border/40">
            <div>
              <p className="text-xs font-bold text-foreground">Export Full Workspace (JSON)</p>
              <p className="text-[11px] text-muted-foreground">Download all workspaces, projects, columns, and task checklists.</p>
            </div>
            <button
              onClick={handleExport}
              className="px-3.5 py-1.5 text-xs font-bold border border-border rounded-xl bg-background hover:bg-muted flex items-center justify-center gap-1.5 shadow-2xs transition-colors shrink-0"
            >
              <Download size={14} />
              <span>Export JSON</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/20 border border-border/40">
            <div>
              <p className="text-xs font-bold text-foreground">Import Backup (JSON)</p>
              <p className="text-[11px] text-muted-foreground">Restore your workspaces and tasks from an exported JSON file.</p>
            </div>
            <label className="px-3.5 py-1.5 text-xs font-bold border border-border rounded-xl bg-background hover:bg-muted flex items-center justify-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer">
              <Upload size={14} />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20">
            <div>
              <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles size={14} />
                <span>Reset to Clean Demo Data</span>
              </p>
              <p className="text-[11px] text-muted-foreground">Restore all initial projects, sprint boards, and preloaded sample tasks.</p>
            </div>
            <button
              onClick={handleResetDemo}
              className="px-3.5 py-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <RotateCcw size={14} />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5. Danger Zone (RBAC Protected) */}
      <section className={`border rounded-2xl p-6 shadow-xs ${
        isPrivileged
          ? 'bg-destructive/5 border-destructive/30'
          : 'bg-muted/15 border-border/60'
      }`}>
        <h2 className="text-base font-bold mb-1 flex items-center gap-2 text-destructive">
          <Trash2 size={18} />
          <span>Danger Zone (Admin & Owner Only)</span>
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Irreversible deletion of projects or entire workspaces.
        </p>

        {isPrivileged ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-destructive/20 bg-background">
              <div>
                <p className="text-xs font-bold text-foreground">
                  Delete Active Project ({activeProject?.name || 'None'})
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Permanently delete this project and all its associated tasks.
                </p>
              </div>
              <button
                onClick={handleDeleteActiveProject}
                disabled={!activeProject}
                className="px-3.5 py-1.5 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0 disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>Delete Project</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-destructive/20 bg-background">
              <div>
                <p className="text-xs font-bold text-foreground">
                  Delete Active Workspace ({activeWorkspace?.name || 'None'})
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Deletes all contained projects, custom columns, and tasks.
                </p>
              </div>
              <button
                onClick={handleDeleteActiveWorkspace}
                disabled={workspaces.length <= 1}
                className="px-3.5 py-1.5 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0 disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>Delete Workspace</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
            <Shield size={18} className="shrink-0" />
            <div>
              <p className="font-bold">Access Denied</p>
              <p className="text-[11px] mt-0.5 opacity-90">
                You are currently logged in with the <strong>{currentUser?.role}</strong> role. You must be an <strong>Admin</strong> or <strong>Owner</strong> to delete projects or workspaces. Switch users from the top navigation bar to test admin permissions.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
