import React from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, X } from 'lucide-react';

export default function BulkActionBar({ selectedTaskIds, onClearSelection }) {
  const { bulkUpdateStatus, bulkUpdatePriority, bulkDelete, activeProject } = useWorkspace();
  const { currentUser } = useAuth();
  const isViewer = currentUser?.role === 'Viewer';

  if (!selectedTaskIds || selectedTaskIds.length === 0) return null;

  const columns = activeProject?.columns || ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

  const handleStatusChange = (e) => {
    if (isViewer || !e.target.value) return;
    bulkUpdateStatus(selectedTaskIds, e.target.value);
    e.target.value = "";
  };

  const handlePriorityChange = (e) => {
    if (isViewer || !e.target.value) return;
    bulkUpdatePriority(selectedTaskIds, e.target.value);
    e.target.value = "";
  };

  const handleDelete = () => {
    if (isViewer) return;
    if (confirm(`Are you sure you want to delete ${selectedTaskIds.length} selected tasks?`)) {
      bulkDelete(selectedTaskIds);
      onClearSelection();
    }
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-1.5rem)] sm:w-auto max-w-lg bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-2.5 sm:px-5 sm:py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4 text-card-foreground animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center gap-2 sm:border-r sm:pr-4">
        <div className="w-5 h-5 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
          {selectedTaskIds.length}
        </div>
        <span className="text-xs font-bold whitespace-nowrap">Selected</span>
      </div>

      {!isViewer ? (
        <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-end sm:justify-start">
          {/* Change Status */}
          <select
            onChange={handleStatusChange}
            defaultValue=""
            className="text-[11px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-xl border border-input bg-background font-semibold hover:border-primary transition-colors cursor-pointer"
          >
            <option value="" disabled>Status...</option>
            {columns.map(col => (
              <option key={col} value={col}>{col.replace('_', ' ')}</option>
            ))}
          </select>

          {/* Change Priority */}
          <select
            onChange={handlePriorityChange}
            defaultValue=""
            className="text-[11px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-xl border border-input bg-background font-semibold hover:border-primary transition-colors cursor-pointer"
          >
            <option value="" disabled>Priority...</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl flex items-center gap-1 transition-colors shrink-0"
          >
            <Trash2 size={13} />
            <span className="hidden xs:inline">Delete</span>
          </button>
        </div>
      ) : (
        <span className="text-[11px] text-muted-foreground italic">Read-only mode</span>
      )}

      {/* Deselect */}
      <button
        onClick={onClearSelection}
        className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors shrink-0"
        title="Deselect all"
      >
        <X size={15} />
      </button>
    </div>
  );
}
