import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import TaskCard from './TaskCard';
import { Plus, Edit2, Trash2, Check, X, Sparkles } from 'lucide-react';

const COLUMN_COLORS = {
  TODO: 'bg-slate-400',
  BACKLOG: 'bg-zinc-400',
  PLANNING: 'bg-sky-400',
  REPORTED: 'bg-rose-400',
  IN_PROGRESS: 'bg-amber-500',
  TRIAGED: 'bg-amber-500',
  IN_FIX: 'bg-amber-500',
  REVIEW: 'bg-indigo-500',
  STAGING: 'bg-indigo-500',
  DONE: 'bg-emerald-500',
  LAUNCHED: 'bg-emerald-500',
  VERIFIED: 'bg-emerald-500'
};

export default function KanbanBoard({ tasks, onTaskClick, selectedTaskIds, onToggleSelect }) {
  const { updateTask, addTask, activeProject, addColumn, renameColumn, deleteColumn } = useWorkspace();
  const { currentUser } = useAuth();
  const isViewer = currentUser?.role === 'Viewer';

  const [quickAddColumn, setQuickAddColumn] = useState(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  const [editingCol, setEditingCol] = useState(null);
  const [newColTitle, setNewColTitle] = useState('');
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [createdColName, setCreatedColName] = useState('');

  const columns = activeProject?.columns || ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

  const handleDragEnd = (result) => {
    if (isViewer) return;
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    updateTask(draggableId, { status: destination.droppableId });
  };

  const handleQuickAdd = (status) => {
    if (isViewer || !quickAddTitle.trim()) return;
    addTask({
      title: quickAddTitle.trim(),
      status,
      priority: 'Medium'
    });
    setQuickAddTitle('');
    setQuickAddColumn(null);
  };

  const handleStartRename = (col) => {
    setEditingCol(col);
    setNewColTitle(col);
  };

  const handleSaveRename = (oldCol) => {
    if (newColTitle.trim()) {
      renameColumn(activeProject.id, oldCol, newColTitle.trim());
    }
    setEditingCol(null);
  };

  const handleCreateColumn = (e) => {
    e.preventDefault();
    if (createdColName.trim()) {
      addColumn(activeProject.id, createdColName.trim());
      setCreatedColName('');
      setIsAddingCol(false);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-4 pb-4 overflow-x-auto select-none items-start">
        {columns.map(status => {
          const columnTasks = tasks.filter(t => t.status === status);
          const dotColor = COLUMN_COLORS[status] || 'bg-primary';

          return (
            <div
              key={status}
              className="w-80 shrink-0 bg-muted/40 dark:bg-muted/20 backdrop-blur-xs border border-border/70 rounded-2xl p-3.5 flex flex-col max-h-full shadow-2xs group/col transition-all"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                {editingCol === status ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="text"
                      value={newColTitle}
                      onChange={e => setNewColTitle(e.target.value)}
                      autoFocus
                      className="text-xs font-bold px-2.5 py-1 rounded-lg border border-primary bg-background w-full focus:outline-hidden"
                    />
                    <button onClick={() => handleSaveRename(status)} className="text-emerald-500 hover:text-emerald-600 p-1">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingCol(null)} className="text-muted-foreground hover:text-foreground p-1">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor} shadow-xs`} />
                    <h3 className="font-extrabold text-xs tracking-wider text-foreground uppercase truncate">
                      {status.replace('_', ' ')}
                    </h3>
                    <span className="bg-background/80 dark:bg-muted/60 border border-border/60 px-2 py-0.5 rounded-full text-[10px] font-bold text-muted-foreground shadow-2xs">
                      {columnTasks.length}
                    </span>
                  </div>
                )}

                {/* Column actions */}
                {!isViewer && editingCol !== status && (
                  <div className="flex items-center gap-1 opacity-0 group-hover/col:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setQuickAddColumn(status);
                        setQuickAddTitle('');
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                      title="Quick add task"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => handleStartRename(status)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                      title="Rename column"
                    >
                      <Edit2 size={12} />
                    </button>
                    {columns.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete column "${status}"? Tasks will be moved to another column.`)) {
                            deleteColumn(activeProject.id, status);
                          }
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive rounded-md hover:bg-muted transition-colors"
                        title="Delete column"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Add Inline Input */}
              {quickAddColumn === status && !isViewer && (
                <div className="mb-3 p-2.5 bg-card rounded-xl border border-primary/50 shadow-sm animate-in fade-in duration-100">
                  <input
                    type="text"
                    value={quickAddTitle}
                    onChange={e => setQuickAddTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleQuickAdd(status);
                      if (e.key === 'Escape') setQuickAddColumn(null);
                    }}
                    placeholder="Task title... (press Enter to create)"
                    autoFocus
                    className="w-full text-xs px-2.5 py-1.5 bg-background rounded-lg border border-input outline-hidden mb-2 font-medium"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setQuickAddColumn(null)}
                      className="px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleQuickAdd(status)}
                      className="px-3 py-1 text-[11px] font-bold bg-primary text-primary-foreground rounded-lg shadow-xs hover:bg-primary/90"
                    >
                      Add Task
                    </button>
                  </div>
                </div>
              )}

              {/* Droppable Area */}
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto min-h-[140px] space-y-2.5 pr-0.5 rounded-xl transition-all duration-200 ${
                      snapshot.isDraggingOver ? 'bg-primary/5 ring-2 ring-primary/30' : ''
                    }`}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={isViewer}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.9 : 1
                            }}
                          >
                            <TaskCard
                              task={task}
                              onClick={() => onTaskClick(task)}
                              isSelected={selectedTaskIds?.includes(task.id)}
                              onToggleSelect={onToggleSelect}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-xl text-muted-foreground text-xs gap-1 opacity-70">
                        <span>No tasks</span>
                        <span className="text-[10px] opacity-60">Drag tasks here</span>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}

        {/* Add Column Button / Form */}
        {!isViewer && (
          <div className="w-72 shrink-0">
            {isAddingCol ? (
              <form onSubmit={handleCreateColumn} className="bg-card p-3 rounded-2xl border border-primary/50 shadow-md">
                <input
                  type="text"
                  value={createdColName}
                  onChange={e => setCreatedColName(e.target.value)}
                  placeholder="NEW COLUMN NAME..."
                  autoFocus
                  className="w-full text-xs px-3 py-2 rounded-xl border border-input bg-background mb-2.5 uppercase font-bold"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingCol(false)}
                    className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-bold bg-primary text-primary-foreground rounded-lg shadow-xs"
                  >
                    Create Column
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingCol(true)}
                className="w-full py-4 border-2 border-dashed border-border/80 hover:border-primary/60 hover:bg-card/40 rounded-2xl text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-all shadow-2xs hover:shadow-xs group"
              >
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Plus size={12} />
                </div>
                <span>Add Column</span>
              </button>
            )}
          </div>
        )}
      </div>
    </DragDropContext>
  );
}
