import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CheckSquare,
  Settings,
  FolderKanban,
  Plus,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Zap,
  Rocket,
  Bug,
  Code,
  X
} from 'lucide-react';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import ProjectModal from './ProjectModal';
import { useWorkspace } from '../contexts/WorkspaceContext';

const ICON_MAP = {
  Code: Code,
  Zap: Zap,
  Rocket: Rocket,
  Bug: Bug,
  Sparkles: Sparkles,
  Layers: Layers
};

const COLOR_CLASSES = {
  indigo: 'bg-indigo-500',
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500'
};

export default function Sidebar({ onCloseMobile }) {
  const { workspaceProjects, activeProjectId, setActiveProjectId } = useWorkspace();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenEdit = (proj, e) => {
    e.stopPropagation();
    setEditingProject(proj);
    setIsProjectModalOpen(true);
  };

  const handleSelectProject = (id) => {
    setActiveProjectId(id);
    onCloseMobile?.();
  };

  return (
    <aside className="w-64 h-full border-r bg-card flex flex-col shrink-0 select-none shadow-xl md:shadow-none">
      {/* Top row with Workspace Switcher and Mobile Close button */}
      <div className="flex items-center justify-between border-b pr-2">
        <div className="flex-1 min-w-0">
          <WorkspaceSwitcher />
        </div>
        <button
          onClick={onCloseMobile}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors shrink-0"
          title="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-4">
          <NavLink
            to="/dashboard"
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <CheckSquare className="w-4 h-4 mr-2.5 shrink-0" />
            <span>Active Project Board</span>
          </NavLink>
        </div>

        {/* Projects Section */}
        <div className="mt-2 px-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Projects ({workspaceProjects.length})
            </h3>
            <button
              onClick={handleOpenCreate}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              title="Create Project"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-1">
            {workspaceProjects.map(project => {
              const IconComp = ICON_MAP[project.icon] || FolderKanban;
              const colorDot = COLOR_CLASSES[project.color] || 'bg-indigo-500';
              const isActive = activeProjectId === project.id;

              return (
                <div
                  key={project.id}
                  onClick={() => handleSelectProject(project.id)}
                  className={`group relative flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${colorDot}`} />
                    <IconComp className="w-4 h-4 shrink-0 opacity-80" />
                    <span className="truncate">{project.name}</span>
                  </div>

                  <button
                    onClick={(e) => handleOpenEdit(project, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-opacity shrink-0 ml-1"
                    title="Edit Project"
                  >
                    <SlidersHorizontal size={12} />
                  </button>
                </div>
              );
            })}

            {workspaceProjects.length === 0 && (
              <div className="p-4 text-center border border-dashed rounded-xl my-2">
                <p className="text-xs text-muted-foreground mb-2">No projects yet</p>
                <button
                  onClick={handleOpenCreate}
                  className="px-2.5 py-1 text-xs bg-primary text-primary-foreground rounded-md font-medium"
                >
                  + Add Project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="p-3 border-t bg-muted/10">
        <NavLink
          to="/settings"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`
          }
        >
          <Settings className="w-4 h-4 mr-2.5" />
          <span>App & Danger Settings</span>
        </NavLink>
      </div>

      {/* Project Create/Edit Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        initialData={editingProject}
      />
    </aside>
  );
}
