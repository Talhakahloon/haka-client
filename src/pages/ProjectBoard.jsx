import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import KanbanBoard from '../components/KanbanBoard';
import TaskModal from '../components/TaskModal';
import ListView from '../components/ListView';
import CalendarView from '../components/CalendarView';
import BulkActionBar from '../components/BulkActionBar';
import {
  Kanban,
  List,
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  X,
  Sparkles,
  SlidersHorizontal,
  FolderKanban
} from 'lucide-react';

export default function ProjectBoard() {
  const {
    activeProject,
    projectTasks,
    addTask,
    setProjectViewPreference,
    undo,
    redo
  } = useWorkspace();

  const { currentUser, users } = useAuth();
  const isViewer = currentUser?.role === 'Viewer';

  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreatingNewTask, setIsCreatingNewTask] = useState(false);
  const [createdTaskPreset, setCreatedTaskPreset] = useState({});

  // View mode with per-project persistence
  const [view, setView] = useState(activeProject?.viewPreference || 'kanban');

  useEffect(() => {
    if (activeProject?.viewPreference) {
      setView(activeProject.viewPreference);
    }
  }, [activeProject?.id]);

  const handleSwitchView = (newView) => {
    setView(newView);
    if (activeProject) {
      setProjectViewPreference(activeProject.id, newView);
    }
  };

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPreset, setFilterPreset] = useState('all'); // all | my_tasks | high_urgent | completed | due_soon
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterAssignee, setFilterAssignee] = useState('ALL');
  const [filterTag, setFilterTag] = useState('ALL');

  // Bulk selection
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);

  // Keyboard shortcuts (N for new task, 1/2/3 for views, Ctrl+Z/Y for undo/redo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (!isViewer) {
          setCreatedTaskPreset({});
          setIsCreatingNewTask(true);
        }
      } else if (e.key === '1') {
        handleSwitchView('kanban');
      } else if (e.key === '2') {
        handleSwitchView('list');
      } else if (e.key === '3') {
        handleSwitchView('calendar');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, isViewer, activeProject]);

  // Unique tags in this project
  const availableTags = useMemo(() => {
    const tags = new Set();
    projectTasks.forEach(t => t.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [projectTasks]);

  // Filtered tasks computation
  const filteredTasks = useMemo(() => {
    return projectTasks.filter(task => {
      // 1. Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        const matchesTag = task.tags?.some(t => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesTag) return false;
      }

      // 2. Saved Presets
      if (filterPreset === 'my_tasks') {
        if (!task.assignees?.includes(currentUser?.id)) return false;
      } else if (filterPreset === 'high_urgent') {
        if (task.priority !== 'Urgent' && task.priority !== 'High') return false;
      } else if (filterPreset === 'completed') {
        if (task.status !== 'DONE') return false;
      } else if (filterPreset === 'due_soon') {
        if (!task.dueDate) return false;
        const diffDays = (new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      }

      // 3. Dropdown Filters
      if (filterPriority !== 'ALL' && task.priority !== filterPriority) return false;
      if (filterStatus !== 'ALL' && task.status !== filterStatus) return false;
      if (filterAssignee !== 'ALL' && !task.assignees?.includes(filterAssignee)) return false;
      if (filterTag !== 'ALL' && !task.tags?.includes(filterTag)) return false;

      return true;
    });
  }, [
    projectTasks,
    searchQuery,
    filterPreset,
    filterPriority,
    filterStatus,
    filterAssignee,
    filterTag,
    currentUser
  ]);

  const hasActiveFilters = searchQuery !== '' || filterPreset !== 'all' || filterPriority !== 'ALL' || filterStatus !== 'ALL' || filterAssignee !== 'ALL' || filterTag !== 'ALL';

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterPreset('all');
    setFilterPriority('ALL');
    setFilterStatus('ALL');
    setFilterAssignee('ALL');
    setFilterTag('ALL');
  };

  // Selection handlers
  const handleToggleSelect = useCallback((taskId) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map(t => t.id));
    }
  }, [selectedTaskIds.length, filteredTasks]);

  const handleOpenCreateOnDate = (dateStr) => {
    setCreatedTaskPreset({ dueDate: dateStr });
    setIsCreatingNewTask(true);
  };

  if (!activeProject) {
    return (
      <div className="flex-1 flex items-center justify-center h-full p-8 text-center">
        <div className="max-w-md p-8 rounded-3xl bg-card border border-border/80 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <FolderKanban size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">No Project Selected</h2>
          <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
            Select an existing project from the left sidebar, or create a brand new one with preloaded sprint templates.
          </p>
        </div>
      </div>
    );
  }

  const columns = activeProject.columns || ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

  return (
    <div className="flex flex-col h-full bg-background p-4 sm:p-6 overflow-hidden">
      {/* Top Section: Project Title & View Switcher */}
      <header className="shrink-0 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {activeProject.name}
            </h1>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-2xs">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
          {activeProject.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {activeProject.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* View Mode Toggle Buttons */}
          <div className="flex bg-muted/60 dark:bg-muted/30 p-1 rounded-xl border border-border/60 shadow-2xs">
            <button
              onClick={() => handleSwitchView('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                view === 'kanban'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Kanban Board (Press 1)"
            >
              <Kanban size={14} />
              <span>Board</span>
            </button>
            <button
              onClick={() => handleSwitchView('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                view === 'list'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="List Table (Press 2)"
            >
              <List size={14} />
              <span>List</span>
            </button>
            <button
              onClick={() => handleSwitchView('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                view === 'calendar'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Calendar View (Press 3)"
            >
              <CalendarIcon size={14} />
              <span>Calendar</span>
            </button>
          </div>

          {/* New Task Button */}
          {!isViewer && (
            <button
              onClick={() => {
                setCreatedTaskPreset({});
                setIsCreatingNewTask(true);
              }}
              className="px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-sm hover:shadow-md flex items-center gap-1.5 transition-all active:scale-95"
              title="New Task (Press N)"
            >
              <Plus size={15} />
              <span>New Task</span>
            </button>
          )}
        </div>
      </header>

      {/* Filter & Search Bar */}
      <div className="shrink-0 mb-4 space-y-2.5">
        {/* Row 1: Search & Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[190px] sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, #tag..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-input bg-card placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 shadow-2xs font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter: Priority */}
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-input bg-card font-semibold shadow-2xs hover:border-primary/50 transition-colors"
          >
            <option value="ALL">Priority: All</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Filter: Status */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-input bg-card font-semibold shadow-2xs hover:border-primary/50 transition-colors"
          >
            <option value="ALL">Status: All</option>
            {columns.map(c => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>

          {/* Filter: Assignee */}
          <select
            value={filterAssignee}
            onChange={e => setFilterAssignee(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-input bg-card font-semibold shadow-2xs hover:border-primary/50 transition-colors"
          >
            <option value="ALL">Assignee: All</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {/* Filter: Tag */}
          {availableTags.length > 0 && (
            <select
              value={filterTag}
              onChange={e => setFilterTag(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-input bg-card font-semibold shadow-2xs hover:border-primary/50 transition-colors"
            >
              <option value="ALL">Tag: All</option>
              {availableTags.map(t => (
                <option key={t} value={t}>#{t}</option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs px-2.5 py-1.5 rounded-xl text-destructive hover:bg-destructive/10 font-bold flex items-center gap-1 transition-colors"
            >
              <X size={13} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Row 2: Saved Filter Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground text-[11px] font-bold mr-1 flex items-center gap-1">
            <Filter size={12} />
            <span>Presets:</span>
          </span>

          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'my_tasks', label: 'Assigned to Me' },
            { id: 'high_urgent', label: 'Urgent & High' },
            { id: 'due_soon', label: 'Due in 7 Days' },
            { id: 'completed', label: 'Completed' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setFilterPreset(p.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                filterPreset === p.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-hidden min-h-0">
        {view === 'kanban' && (
          <KanbanBoard
            tasks={filteredTasks}
            onTaskClick={setSelectedTask}
            selectedTaskIds={selectedTaskIds}
            onToggleSelect={handleToggleSelect}
          />
        )}
        {view === 'list' && (
          <ListView
            tasks={filteredTasks}
            onTaskClick={setSelectedTask}
            selectedTaskIds={selectedTaskIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
          />
        )}
        {view === 'calendar' && (
          <CalendarView
            tasks={filteredTasks}
            onTaskClick={setSelectedTask}
            onQuickCreateOnDate={handleOpenCreateOnDate}
          />
        )}
      </div>

      {/* Floating Sticky Bulk Actions Bar */}
      <BulkActionBar
        selectedTaskIds={selectedTaskIds}
        onClearSelection={() => setSelectedTaskIds([])}
      />

      {/* Task Modal (Edit or View) */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* New Task Creation Modal */}
      {isCreatingNewTask && (
        <TaskModal
          task={{
            id: `new-${Date.now()}`,
            projectId: activeProject.id,
            title: '',
            description: '',
            status: columns[0] || 'TODO',
            priority: 'Medium',
            assignees: currentUser ? [currentUser.id] : ['usr-1'],
            dueDate: createdTaskPreset.dueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
            tags: [],
            subtasks: [],
            attachments: [],
            comments: []
          }}
          onClose={() => setIsCreatingNewTask(false)}
        />
      )}
    </div>
  );
}
