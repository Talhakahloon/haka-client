import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import {
  X,
  Trash2,
  Save,
  ShieldAlert,
  Copy,
  Plus,
  CheckSquare,
  Paperclip,
  MessageSquare,
  History,
  ArrowUpRight,
  Download,
  Calendar,
  Tag,
  AtSign,
  Send,
  AlertCircle
} from 'lucide-react';

export default function TaskModal({ task, onClose }) {
  const {
    updateTask,
    deleteTask,
    duplicateTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    convertSubtaskToTask,
    addAttachment,
    deleteAttachment,
    addComment,
    activeProject
  } = useWorkspace();

  const { currentUser, users } = useAuth();
  const isViewer = currentUser?.role === 'Viewer';

  const [activeTab, setActiveTab] = useState('details'); // details, subtasks, attachments, activity
  const [formData, setFormData] = useState({ ...task });
  const [newTagInput, setNewTagInput] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [commentText, setCommentText] = useState('');
  const [showMentionPopup, setShowMentionPopup] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setFormData({ ...task });
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleAssignee = (userId) => {
    if (isViewer) return;
    const current = formData.assignees || [];
    const updated = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId];
    setFormData(prev => ({ ...prev, assignees: updated }));
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (isViewer || !newTagInput.trim()) return;
    const tag = newTagInput.trim().toLowerCase().replace('#', '');
    if (!formData.tags?.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }));
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    if (isViewer) return;
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(t => t !== tagToRemove)
    }));
  };

  const handleSave = () => {
    if (isViewer) return;
    updateTask(task.id, formData);
    onClose();
  };

  const handleDelete = () => {
    if (isViewer) return;
    if (confirm("Are you sure you want to delete this task? This action can be undone via the undo toast.")) {
      deleteTask(task.id);
      onClose();
    }
  };

  const handleDuplicate = () => {
    duplicateTask(task.id);
    onClose();
  };

  // Subtasks
  const handleCreateSubtask = (e) => {
    e.preventDefault();
    if (isViewer || !newSubtaskTitle.trim()) return;
    addSubtask(task.id, newSubtaskTitle.trim());
    setFormData(prev => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), { id: `sub-${Date.now()}`, title: newSubtaskTitle.trim(), completed: false }]
    }));
    setNewSubtaskTitle('');
  };

  const handleToggleSub = (subId) => {
    if (isViewer) return;
    toggleSubtask(task.id, subId);
    setFormData(prev => ({
      ...prev,
      subtasks: (prev.subtasks || []).map(s => s.id === subId ? { ...s, completed: !s.completed } : s)
    }));
  };

  const handleDeleteSub = (subId) => {
    if (isViewer) return;
    deleteSubtask(task.id, subId);
    setFormData(prev => ({
      ...prev,
      subtasks: (prev.subtasks || []).filter(s => s.id !== subId)
    }));
  };

  const handleConvertSubtask = (subId) => {
    if (isViewer) return;
    convertSubtaskToTask(task.id, subId);
    setFormData(prev => ({
      ...prev,
      subtasks: (prev.subtasks || []).filter(s => s.id !== subId)
    }));
  };

  // Attachments
  const handleFileUpload = async (e) => {
    if (isViewer) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // If existing task, try server upload
    if (task.id && !task.id.startsWith('new-')) {
      try {
        const res = await api.uploadAttachment(task.id, file);
        if (res.success && res.attachment) {
          addAttachment(task.id, res.attachment);
          setFormData(prev => ({
            ...prev,
            attachments: [...(prev.attachments || []), res.attachment]
          }));
          e.target.value = '';
          return;
        }
      } catch (err) {
        console.warn('[Upload] Server upload failed, falling back to local:', err.message);
      }
    }

    // Local / fallback base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const fileObj = {
        id: `att-${Date.now()}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type,
        dataUrl: event.target.result,
        createdAt: new Date().toISOString().split('T')[0]
      };
      addAttachment(task.id, fileObj);
      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), fileObj]
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteAttachment = (attId) => {
    if (isViewer) return;
    deleteAttachment(task.id, attId);
    setFormData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter(a => a.id !== attId)
    }));
  };

  // Comments
  const handleCommentChange = (e) => {
    const text = e.target.value;
    setCommentText(text);
    if (text.endsWith('@')) {
      setShowMentionPopup(true);
    } else if (!text.includes('@')) {
      setShowMentionPopup(false);
    }
  };

  const insertMention = (userName) => {
    setCommentText(prev => prev.replace(/@\w*$/, `@${userName} `));
    setShowMentionPopup(false);
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(task.id, commentText.trim());
    setFormData(prev => ({
      ...prev,
      comments: [
        ...(prev.comments || []),
        {
          id: `comm-${Date.now()}`,
          userId: currentUser?.id || 'usr-1',
          text: commentText.trim(),
          createdAt: new Date().toISOString()
        }
      ]
    }));
    setCommentText('');
    setShowMentionPopup(false);
  };

  const subtasksList = formData.subtasks || [];
  const completedSubs = subtasksList.filter(s => s.completed).length;
  const progressPercent = subtasksList.length > 0 ? Math.round((completedSubs / subtasksList.length) * 100) : 0;

  const columns = activeProject?.columns || ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl border border-border/80 flex flex-col max-h-[94vh] sm:max-h-[92vh] overflow-hidden text-card-foreground animate-in fade-in zoom-in-95 duration-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 px-4 sm:px-6 border-b bg-muted/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono truncate mr-2">
            <span className="uppercase font-bold text-foreground truncate">{activeProject?.name || 'Project'}</span>
            <span>/</span>
            <span className="truncate">{formData.id}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isViewer && (
              <>
                <button
                  onClick={handleDuplicate}
                  className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  title="Duplicate Task"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 sm:p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                  title="Delete Task"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors ml-1"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* RBAC Warning Banner for Viewers */}
        {isViewer && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-6 py-2.5 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0" />
            <span>
              <strong>Viewer Mode:</strong> Read-only access enabled.
            </span>
          </div>
        )}

        {/* Responsive Horizontal Scrollable Tabs */}
        <div className="flex border-b px-4 sm:px-6 bg-muted/10 gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto no-scrollbar whitespace-nowrap shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2.5 sm:py-3 border-b-2 transition-colors shrink-0 ${
              activeTab === 'details'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('subtasks')}
            className={`py-2.5 sm:py-3 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'subtasks'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckSquare size={13} />
            <span>Checklist ({subtasksList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`py-2.5 sm:py-3 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'attachments'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Paperclip size={13} />
            <span>Files ({formData.attachments?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-2.5 sm:py-3 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'activity'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <History size={13} />
            <span>Comments & Activity ({formData.comments?.length || 0})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {/* Left 2 Cols: Title & Description & Tags */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    disabled={isViewer}
                    placeholder="Task summary..."
                    className="w-full text-lg sm:text-xl font-bold bg-transparent border-b border-border/80 pb-1 outline-hidden focus:border-primary disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Description & Specifications
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={isViewer}
                    rows={5}
                    placeholder="Provide acceptance criteria, context, or links..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-primary disabled:opacity-60 shadow-xs leading-relaxed"
                  />
                </div>

                {/* Tags manager */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Tags & Labels
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {formData.tags?.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-muted text-foreground border border-border/50"
                      >
                        #{tag}
                        {!isViewer && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-muted-foreground hover:text-destructive ml-0.5"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>

                  {!isViewer && (
                    <form onSubmit={handleAddTag} className="flex gap-2 max-w-xs">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={e => setNewTagInput(e.target.value)}
                        placeholder="Add tag and press Enter"
                        className="px-2.5 py-1 text-xs rounded-lg border border-input bg-background flex-1"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 text-xs bg-muted hover:bg-muted/80 rounded-lg font-bold"
                      >
                        Add
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Right Col: Metadata */}
              <div className="space-y-3.5 bg-muted/15 p-3.5 sm:p-4 rounded-xl border border-border/60 self-start w-full">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Status / Column
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={isViewer}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background font-semibold"
                  >
                    {columns.map(col => (
                      <option key={col} value={col}>
                        {col.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    disabled={isViewer}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background font-semibold"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate || ''}
                    onChange={handleChange}
                    disabled={isViewer}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background"
                  />
                </div>

                {/* Assignees */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Assignees
                  </label>
                  <div className="space-y-1">
                    {users.map(u => {
                      const isAssigned = formData.assignees?.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => handleToggleAssignee(u.id)}
                          className={`flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            isAssigned
                              ? 'bg-primary/10 border-primary font-medium'
                              : 'hover:bg-muted/50 border-transparent'
                          } ${isViewer ? 'cursor-not-allowed opacity-75' : ''}`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <img src={u.avatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                            <span className="truncate">{u.name}</span>
                          </div>
                          {isAssigned && <CheckSquare size={13} className="text-primary shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBTASKS */}
          {activeTab === 'subtasks' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-muted-foreground">Checklist Completion</span>
                  <span>{progressPercent}% ({completedSubs}/{subtasksList.length})</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {subtasksList.map(sub => (
                  <div
                    key={sub.id}
                    className="group flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border/60 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => handleToggleSub(sub.id)}
                        disabled={isViewer}
                        className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer shrink-0"
                      />
                      <span className={`text-xs flex-1 truncate ${sub.completed ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}>
                        {sub.title}
                      </span>
                    </div>

                    {!isViewer && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleConvertSubtask(sub.id)}
                          className="px-2 py-1 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-md flex items-center gap-1 transition-colors"
                          title="Convert to full task"
                        >
                          <ArrowUpRight size={12} />
                          <span className="hidden sm:inline">To Task</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSub(sub.id)}
                          className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {subtasksList.length === 0 && (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    No subtasks yet. Add actionable steps below.
                  </p>
                )}
              </div>

              {!isViewer && (
                <form onSubmit={handleCreateSubtask} className="flex gap-2 pt-2 border-t">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    placeholder="New checklist item..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-input bg-background"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl flex items-center gap-1 transition-colors shrink-0"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: ATTACHMENTS */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              {!isViewer && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border/80 rounded-2xl p-6 sm:p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all group"
                >
                  <Paperclip className="w-7 h-7 mx-auto text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
                  <p className="text-xs font-bold text-foreground">Click or drag files here</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Images, PDFs, documents stored on server & offline</p>
                  <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
                </div>
              )}

              <div className="space-y-2">
                {(formData.attachments || []).map(att => (
                  <div key={att.id} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
                    <div className="flex items-center gap-3 truncate min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Paperclip size={15} />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">{att.name}</p>
                        <p className="text-[10px] text-muted-foreground">{att.size} • {att.createdAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {(att.url || att.dataUrl) && (
                        <a href={att.url || att.dataUrl} download={att.name} target="_blank" rel="noopener noreferrer" className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted" title="Download or View">
                          <Download size={14} />
                        </a>
                      )}
                      {!isViewer && (
                        <button type="button" onClick={() => handleDeleteAttachment(att.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {(!formData.attachments || formData.attachments.length === 0) && (
                  <p className="text-xs text-muted-foreground py-6 text-center">No attachments yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ACTIVITY & COMMENTS */}
          {activeTab === 'activity' && (
            <div className="space-y-5">
              <div className="relative">
                <form onSubmit={handlePostComment} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={commentText}
                      onChange={handleCommentChange}
                      placeholder="Comment... (Type @ to mention)"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-primary shadow-xs pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMentionPopup(prev => !prev)}
                      className="absolute right-2.5 top-2 text-muted-foreground hover:text-primary"
                    >
                      <AtSign size={14} />
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <Send size={13} />
                    <span className="hidden xs:inline">Send</span>
                  </button>
                </form>

                {showMentionPopup && (
                  <div className="absolute left-0 top-12 z-30 w-52 bg-card border rounded-xl shadow-xl p-1 text-card-foreground">
                    <p className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase">Mention Teammate</p>
                    {users.map(u => (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => insertMention(u.name)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg hover:bg-muted text-left"
                      >
                        <img src={u.avatar} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                        <span className="font-semibold truncate">{u.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                {(formData.comments || []).map(c => {
                  const author = users.find(u => u.id === c.userId);
                  return (
                    <div key={c.id} className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/40">
                      <img src={author?.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-foreground">{author?.name || 'User'}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <History size={13} />
                  <span>Audit History Timeline</span>
                </h5>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {(formData.activityLog || []).map(act => {
                    const actor = users.find(u => u.id === act.userId);
                    return (
                      <div key={act.id} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                        <span className="font-bold text-foreground">{actor?.name || 'User'}</span>
                        <span className="truncate">{act.action}</span>
                        <span className="text-[10px] opacity-75 ml-auto shrink-0">
                          {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 px-4 sm:px-6 border-t flex justify-end gap-2 bg-muted/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            {isViewer ? 'Close' : 'Cancel'}
          </button>
          {!isViewer && (
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Save size={14} />
              <span>Save Changes</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
