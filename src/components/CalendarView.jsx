import React, { useState } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';

export default function CalendarView({ tasks, onTaskClick, onQuickCreateOnDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { currentUser } = useAuth();
  const isViewer = currentUser?.role === 'Viewer';

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-destructive/15 text-destructive border-destructive/30';
      case 'High':
        return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
      case 'Medium':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/80 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-border bg-background hover:bg-muted text-muted-foreground transition-colors ml-2"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
            className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
            className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b bg-muted/30 text-center">
        {weekDays.map(d => (
          <div key={d} className="px-2 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto divide-x divide-y divide-border/60">
        {days.map((d) => {
          const dateStr = format(d, 'yyyy-MM-dd');
          const dayTasks = tasks.filter(t => t.dueDate === dateStr);
          const isToday = isSameDay(d, new Date());
          const isCurrentMonth = isSameMonth(d, monthStart);

          return (
            <div
              key={d.toString()}
              className={`p-2 flex flex-col min-h-[105px] transition-colors group relative ${
                !isCurrentMonth ? 'bg-muted/10 opacity-50' : 'bg-card hover:bg-muted/15'
              }`}
            >
              {/* Day number & Quick add */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                    isToday
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-foreground'
                  }`}
                >
                  {format(d, 'd')}
                </span>

                {!isViewer && (
                  <button
                    onClick={() => onQuickCreateOnDate?.(dateStr)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-opacity"
                    title={`Create task due on ${dateStr}`}
                  >
                    <Plus size={13} />
                  </button>
                )}
              </div>

              {/* Tasks list */}
              <div className="flex-1 space-y-1 overflow-y-auto">
                {dayTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className={`text-[11px] truncate px-2 py-1 rounded-md border cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${getPriorityColor(task.priority)}`}
                    title={`${task.title} (${task.status})`}
                  >
                    <span className="font-semibold">{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
