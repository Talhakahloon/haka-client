import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckSquare, Paperclip, MessageSquare, Calendar, Clock, AlertCircle } from 'lucide-react';

export default function TaskCard({ task, onClick, isSelected, onToggleSelect }) {
  const { users } = useAuth();

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'Urgent':
        return {
          badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
          dot: 'bg-red-500'
        };
      case 'High':
        return {
          badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500'
        };
      case 'Medium':
        return {
          badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
          dot: 'bg-indigo-500'
        };
      default:
        return {
          badge: 'bg-muted/70 text-muted-foreground border-border/80',
          dot: 'bg-slate-400'
        };
    }
  };

  const priorityCfg = getPriorityConfig(task.priority);
  const assignees = task.assignees?.map(id => users.find(u => u.id === id)).filter(Boolean) || [];

  const subtasksCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div
      onClick={onClick}
      className={`group relative bg-card/90 dark:bg-card/75 backdrop-blur-xs p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md'
          : 'border-border/70 hover:border-primary/50'
      }`}
    >
      {/* Top row: Checkbox for bulk actions & Priority badge */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(isSelected)}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect?.(task.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer transition-opacity opacity-30 group-hover:opacity-100 checked:opacity-100"
            title="Select task"
          />
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityCfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
            <span>{task.priority || 'Medium'}</span>
          </span>
        </div>

        {task.dueDate && (
          <div className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
            isOverdue ? 'text-destructive font-bold' : 'text-muted-foreground'
          }`}>
            <Calendar size={12} className={isOverdue ? "text-destructive" : "opacity-70"} />
            <span>{task.dueDate}</span>
          </div>
        )}
      </div>

      {/* Task Title */}
      <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2 mb-1 group-hover:text-primary transition-colors">
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map(tag => (
            <span
              key={tag}
              className="text-[10px] font-medium bg-muted/70 text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-md border border-border/50 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom row: Subtasks count, Attachments, Comments, Assignees */}
      <div className="flex items-center justify-between pt-2.5 border-t border-border/50 mt-1">
        <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
          {subtasksCount > 0 && (
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium text-[10px] ${
                completedSubtasks === subtasksCount
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20'
                  : 'bg-muted/60 text-muted-foreground'
              }`}
              title="Subtasks completion"
            >
              <CheckSquare size={11} />
              <span>{completedSubtasks}/{subtasksCount}</span>
            </div>
          )}

          {task.attachments?.length > 0 && (
            <div className="flex items-center gap-1 hover:text-foreground transition-colors" title="Attachments">
              <Paperclip size={12} className="opacity-70" />
              <span>{task.attachments.length}</span>
            </div>
          )}

          {task.comments?.length > 0 && (
            <div className="flex items-center gap-1 hover:text-foreground transition-colors" title="Comments">
              <MessageSquare size={12} className="opacity-70" />
              <span>{task.comments.length}</span>
            </div>
          )}
        </div>

        {/* Assignees avatars */}
        <div className="flex -space-x-2 overflow-hidden shrink-0">
          {assignees.map(user => (
            <img
              key={user.id}
              src={user.avatar}
              title={`${user.name} (${user.role})`}
              alt={user.name}
              className="w-6 h-6 rounded-full object-cover border-2 border-card ring-1 ring-border/50 shrink-0 transition-transform group-hover:translate-x-0.5"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
