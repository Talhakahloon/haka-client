import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';

export default function ListView({ tasks, onTaskClick, selectedTaskIds, onToggleSelect, onSelectAll }) {
  const { users, currentUser } = useAuth();
  const { updateTask, activeProject } = useWorkspace();
  const isViewer = currentUser?.role === 'Viewer';

  const [sortField, setSortField] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc'); // asc | desc
  const [groupBy, setGroupBy] = useState('status'); // none | status | priority | assignee

  const columns = activeProject?.columns || ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedTasks = useMemo(() => {
    const list = [...tasks];
    list.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'priority') {
        const pOrder = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
        valA = pOrder[a.priority] || 0;
        valB = pOrder[b.priority] || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [tasks, sortField, sortOrder]);

  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return [{ groupName: 'All Tasks', items: sortedTasks }];
    }

    if (groupBy === 'status') {
      return columns.map(col => ({
        groupName: col.replace('_', ' '),
        items: sortedTasks.filter(t => t.status === col)
      }));
    }

    if (groupBy === 'priority') {
      return ['Urgent', 'High', 'Medium', 'Low'].map(p => ({
        groupName: `${p} Priority`,
        items: sortedTasks.filter(t => t.priority === p)
      }));
    }

    if (groupBy === 'assignee') {
      const groups = users.map(u => ({
        groupName: u.name,
        items: sortedTasks.filter(t => t.assignees?.includes(u.id))
      }));
      const unassigned = sortedTasks.filter(t => !t.assignees || t.assignees.length === 0);
      if (unassigned.length > 0) {
        groups.push({ groupName: 'Unassigned', items: unassigned });
      }
      return groups;
    }

    return [{ groupName: 'All Tasks', items: sortedTasks }];
  }, [sortedTasks, groupBy, columns, users]);

  const allSelected = tasks.length > 0 && selectedTaskIds.length === tasks.length;

  return (
    <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden h-full flex flex-col">
      {/* Top toolbar */}
      <div className="px-4 sm:px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2 bg-muted/20 text-xs">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-muted-foreground" />
          <span className="font-bold text-muted-foreground">Group By:</span>
          <select
            value={groupBy}
            onChange={e => setGroupBy(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-input bg-background font-semibold"
          >
            <option value="none">No Grouping</option>
            <option value="status">Status</option>
            <option value="priority">Priority</option>
            <option value="assignee">Assignee</option>
          </select>
        </div>

        <span className="text-muted-foreground text-[11px] font-medium">
          Showing {tasks.length} tasks
        </span>
      </div>

      {/* Table view with horizontal scroll on mobile */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full min-w-[620px] text-xs text-left">
          <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 border-b select-none sticky top-0 z-10 backdrop-blur-xs">
            <tr>
              <th className="w-10 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="w-3.5 h-3.5 rounded border-input text-primary focus:ring-primary cursor-pointer"
                  title="Select all"
                />
              </th>
              <th
                onClick={() => handleSort('title')}
                className="px-4 py-3 font-bold cursor-pointer hover:text-foreground"
              >
                <div className="flex items-center gap-1.5">
                  <span>Task Name</span>
                  {sortField === 'title' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} className="opacity-40" />}
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="px-4 py-3 font-bold cursor-pointer hover:text-foreground"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {sortField === 'status' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} className="opacity-40" />}
                </div>
              </th>
              <th
                onClick={() => handleSort('priority')}
                className="px-4 py-3 font-bold cursor-pointer hover:text-foreground"
              >
                <div className="flex items-center gap-1.5">
                  <span>Priority</span>
                  {sortField === 'priority' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} className="opacity-40" />}
                </div>
              </th>
              <th className="px-4 py-3 font-bold">Checklist</th>
              <th className="px-4 py-3 font-bold">Assignees</th>
              <th
                onClick={() => handleSort('dueDate')}
                className="px-4 py-3 font-bold cursor-pointer hover:text-foreground"
              >
                <div className="flex items-center gap-1.5">
                  <span>Due Date</span>
                  {sortField === 'dueDate' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} className="opacity-40" />}
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {groupedTasks.map(group => (
              <React.Fragment key={group.groupName}>
                {groupBy !== 'none' && (
                  <tr className="bg-muted/15 font-bold text-muted-foreground text-[11px]">
                    <td colSpan={7} className="px-4 py-2 border-y border-border/40">
                      <div className="flex items-center gap-2">
                        <span>{group.groupName}</span>
                        <span className="text-[10px] font-medium bg-muted px-2 py-0.2 rounded-full">
                          {group.items.length}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}

                {group.items.map(task => {
                  const isSelected = selectedTaskIds?.includes(task.id);
                  const assignees = task.assignees?.map(id => users.find(u => u.id === id)).filter(Boolean) || [];
                  const subCount = task.subtasks?.length || 0;
                  const completedSubCount = task.subtasks?.filter(s => s.completed).length || 0;

                  return (
                    <tr
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={`hover:bg-muted/40 cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/5 font-medium' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect?.(task.id)}
                          className="w-3.5 h-3.5 rounded border-input text-primary focus:ring-primary cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{task.title}</span>
                          {task.tags?.map(t => (
                            <span key={t} className="text-[9px] font-medium bg-muted/70 text-muted-foreground px-1.5 py-0.5 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={task.status}
                          disabled={isViewer}
                          onChange={(e) => updateTask(task.id, { status: e.target.value })}
                          className="text-xs px-2 py-1 rounded-md border border-input bg-background font-semibold hover:border-primary disabled:opacity-80"
                        >
                          {columns.map(col => (
                            <option key={col} value={col}>{col.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={task.priority}
                          disabled={isViewer}
                          onChange={(e) => updateTask(task.id, { priority: e.target.value })}
                          className="text-xs px-2 py-1 rounded-md border border-input bg-background font-semibold hover:border-primary disabled:opacity-80"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {subCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                            <CheckSquare size={12} className={completedSubCount === subCount ? "text-emerald-500" : ""} />
                            {completedSubCount}/{subCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {assignees.map(u => (
                            <img
                              key={u.id}
                              src={u.avatar}
                              title={u.name}
                              alt={u.name}
                              className="w-5 h-5 rounded-full object-cover border border-card"
                            />
                          ))}
                          {assignees.length === 0 && (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        {task.dueDate || '—'}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            {tasks.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground text-xs">
                  No tasks found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
