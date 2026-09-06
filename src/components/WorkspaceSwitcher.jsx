import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { ChevronDown, Plus, LayoutGrid, Settings2, Check } from 'lucide-react';
import WorkspaceModal from './WorkspaceModal';

export default function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, setActiveWorkspaceId } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWs, setEditingWs] = useState(null);

  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleOpenCreate = () => {
    setEditingWs(null);
    setIsModalOpen(true);
    setIsOpen(false);
  };

  const handleOpenEdit = (ws, e) => {
    e.stopPropagation();
    setEditingWs(ws);
    setIsModalOpen(true);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 h-14 border-b hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-xs font-bold text-xs">
            {activeWorkspace?.name?.slice(0, 2).toUpperCase() || 'WS'}
          </div>
          <div className="text-left truncate">
            <span className="font-bold text-sm block truncate text-foreground leading-tight">
              {activeWorkspace?.name || 'Select Workspace'}
            </span>
            <span className="text-[10px] text-muted-foreground block truncate">
              {activeWorkspace?.members?.length || 1} team members
            </span>
          </div>
        </div>
        <ChevronDown size={14} className={`text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 w-full bg-card border-b border-r shadow-2xl z-50 py-2 text-card-foreground animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 mb-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Workspaces</p>
          </div>

          <div className="max-h-60 overflow-y-auto px-1 space-y-0.5">
            {workspaces.map(ws => (
              <div
                key={ws.id}
                onClick={() => {
                  setActiveWorkspaceId(ws.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  activeWorkspace?.id === ws.id
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'hover:bg-muted/70 text-foreground'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">
                    {ws.name.slice(0, 1)}
                  </div>
                  <span className="truncate">{ws.name}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {activeWorkspace?.id === ws.id && <Check size={14} className="text-primary mr-1" />}
                  <button
                    onClick={(e) => handleOpenEdit(ws, e)}
                    className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                    title="Workspace Settings"
                  >
                    <Settings2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t mt-2 pt-1.5 px-2">
            <button
              onClick={handleOpenCreate}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Plus size={14} />
              <span>Create Workspace</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <WorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingWs}
      />
    </div>
  );
}
