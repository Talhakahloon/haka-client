import React, { useEffect, useRef, useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  Folder,
  CheckSquare,
  X,
  Layers,
  Settings,
  Moon,
  Sun,
  Plus,
  RotateCcw,
  Sparkles,
  Command
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CommandPalette() {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, theme, toggleTheme } = useUI();
  const {
    workspaces,
    projects,
    tasks,
    setActiveWorkspaceId,
    setActiveProjectId,
    resetToDemoData
  } = useWorkspace();

  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsCommandPaletteOpen]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  // Filter items
  const q = query.toLowerCase().trim();

  const filteredWorkspaces = workspaces.filter(w => w.name.toLowerCase().includes(q));
  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(q));
  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.tags?.some(tag => tag.toLowerCase().includes(q)));

  const systemActions = [
    {
      id: 'action-theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      icon: theme === 'dark' ? Sun : Moon,
      action: () => toggleTheme()
    },
    {
      id: 'action-settings',
      title: 'Open Settings & Permissions',
      icon: Settings,
      action: () => {
        navigate('/settings');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'action-reset',
      title: 'Reset to Clean Demo Data',
      icon: RotateCcw,
      action: () => {
        resetToDemoData();
        setIsCommandPaletteOpen(false);
      }
    }
  ].filter(a => a.title.toLowerCase().includes(q));

  // Flattened array for keyboard navigation
  const allResults = [
    ...systemActions.map(a => ({ type: 'action', data: a })),
    ...filteredWorkspaces.map(w => ({ type: 'workspace', data: w })),
    ...filteredProjects.map(p => ({ type: 'project', data: p })),
    ...filteredTasks.map(t => ({ type: 'task', data: t }))
  ];

  const handleKeyDownList = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, allResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allResults.length) % Math.max(1, allResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = allResults[selectedIndex];
      if (selected) {
        handleSelectItem(selected);
      }
    }
  };

  const handleSelectItem = (item) => {
    if (item.type === 'action') {
      item.data.action();
    } else if (item.type === 'workspace') {
      setActiveWorkspaceId(item.data.id);
      navigate('/dashboard');
      setIsCommandPaletteOpen(false);
    } else if (item.type === 'project') {
      setActiveWorkspaceId(item.data.workspaceId);
      setActiveProjectId(item.data.id);
      navigate('/dashboard');
      setIsCommandPaletteOpen(false);
    } else if (item.type === 'task') {
      setActiveProjectId(item.data.projectId);
      navigate('/dashboard');
      setIsCommandPaletteOpen(false);
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      onClick={() => setIsCommandPaletteOpen(false)}
      className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xs flex items-start justify-center pt-[12vh] p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card w-full max-w-xl rounded-2xl shadow-2xl border border-border/80 overflow-hidden flex flex-col max-h-[75vh] text-card-foreground animate-in fade-in zoom-in-95 duration-100"
      >
        {/* Header Search Input */}
        <div className="flex items-center px-4 border-b bg-muted/20">
          <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent h-14 outline-hidden placeholder:text-muted-foreground text-sm font-medium"
            placeholder="Search workspaces, projects, tasks, or actions... (↑↓ to navigate)"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownList}
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {allResults.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              <Command className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-semibold">No results found for "{query}"</p>
              <p className="text-[11px] mt-1">Try searching for sprint, bug, theme, or settings</p>
            </div>
          ) : (
            <>
              {/* System Actions */}
              {systemActions.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-1">
                    Commands & Actions
                  </p>
                  <div className="space-y-0.5">
                    {systemActions.map((a, idx) => {
                      const itemIdx = idx;
                      const isHighlighted = selectedIndex === itemIdx;
                      const IconComp = a.icon;
                      return (
                        <div
                          key={a.id}
                          onClick={() => handleSelectItem({ type: 'action', data: a })}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                            isHighlighted ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          <IconComp size={15} className="shrink-0" />
                          <span className="truncate">{a.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Projects */}
              {filteredProjects.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-1">
                    Projects ({filteredProjects.length})
                  </p>
                  <div className="space-y-0.5">
                    {filteredProjects.map((p, idx) => {
                      const itemIdx = systemActions.length + filteredWorkspaces.length + idx;
                      const isHighlighted = selectedIndex === itemIdx;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectItem({ type: 'project', data: p })}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                            isHighlighted ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Folder size={14} className="shrink-0 opacity-80" />
                            <span className="font-semibold truncate">{p.name}</span>
                          </div>
                          <span className="text-[10px] opacity-75 shrink-0 ml-2">Jump to Project</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {filteredTasks.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-1">
                    Tasks ({filteredTasks.length})
                  </p>
                  <div className="space-y-0.5">
                    {filteredTasks.map((t, idx) => {
                      const itemIdx = systemActions.length + filteredWorkspaces.length + filteredProjects.length + idx;
                      const isHighlighted = selectedIndex === itemIdx;
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleSelectItem({ type: 'task', data: t })}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                            isHighlighted ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <CheckSquare size={14} className="shrink-0 opacity-80" />
                            <span className="truncate font-medium">{t.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground">
                              {t.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 border-t bg-muted/20 text-[11px] text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-muted px-1.5 py-0.5 rounded border text-[10px]">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono bg-muted px-1.5 py-0.5 rounded border text-[10px]">↵</kbd> Select</span>
            <span><kbd className="font-mono bg-muted px-1.5 py-0.5 rounded border text-[10px]">esc</kbd> Close</span>
          </div>
          <span className="hidden sm:inline">Workspace OS</span>
        </div>
      </div>
    </div>
  );
}
