import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { PROJECT_TEMPLATES } from '../data/mockData';
import { X, Trash2, Check, LayoutTemplate, Sparkles } from 'lucide-react';

const COLORS = [
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
  { id: 'blue', label: 'Blue', bg: 'bg-blue-500' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
  { id: 'pink', label: 'Pink', bg: 'bg-pink-500' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-500' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500' }
];

export default function ProjectModal({ isOpen, onClose, initialData = null }) {
  const { addProject, updateProject, deleteProject, activeWorkspace } = useWorkspace();
  const { users, currentUser } = useAuth();

  const isEditing = Boolean(initialData);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('indigo');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setColor(initialData.color || 'indigo');
      setMembers(initialData.members || []);
      setSelectedTemplateId('');
    } else {
      setName('');
      setDescription('');
      setColor('indigo');
      setMembers(currentUser ? [currentUser.id] : []);
      setSelectedTemplateId('');
    }
  }, [initialData, isOpen, currentUser]);

  if (!isOpen) return null;

  const handleTemplateSelect = (tmplId) => {
    setSelectedTemplateId(tmplId);
    if (!tmplId) return;
    const tmpl = PROJECT_TEMPLATES.find(t => t.id === tmplId);
    if (tmpl) {
      setName(tmpl.name);
      setDescription(tmpl.description);
      setColor(tmpl.color);
    }
  };

  const toggleMember = (userId) => {
    setMembers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing) {
      updateProject(initialData.id, {
        name: name.trim(),
        description: description.trim(),
        color,
        members
      });
    } else {
      addProject({
        workspaceId: activeWorkspace?.id,
        name: name.trim(),
        description: description.trim(),
        color,
        templateId: selectedTemplateId || undefined,
        members
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete project "${initialData.name}"? All tasks inside will be permanently deleted.`)) {
      deleteProject(initialData.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden text-card-foreground animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">
              {isEditing ? 'Project Settings' : 'Create New Project'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Templates selection (only when creating new project) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Start with a Template (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PROJECT_TEMPLATES.map(tmpl => (
                  <button
                    type="button"
                    key={tmpl.id}
                    onClick={() => handleTemplateSelect(tmpl.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      selectedTemplateId === tmpl.id
                        ? 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-1'
                        : 'border-border/60 hover:bg-muted/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold truncate">{tmpl.name}</span>
                        {selectedTemplateId === tmpl.id && <Sparkles size={12} className="text-primary" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{tmpl.description}</p>
                    </div>
                    <span className="text-[10px] text-primary mt-2 font-medium">
                      {tmpl.columns.length} columns • {tmpl.defaultTasks.length} tasks
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Core Platform 2.0, Mobile App MVP"
              required
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of the project goals..."
              rows={2}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Color Tag
            </label>
            <div className="flex items-center gap-3">
              {COLORS.map(c => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center transition-transform ${
                    color === c.id ? 'ring-3 ring-primary ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  title={c.label}
                >
                  {color === c.id && <Check size={14} className="text-white drop-shadow-xs" />}
                </button>
              ))}
            </div>
          </div>

          {/* Project Members */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Assigned Project Members
            </label>
            <div className="flex flex-wrap gap-2">
              {users.map(u => {
                const isSelected = members.includes(u.id);
                return (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => toggleMember(u.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    <img src={u.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                    <span>{u.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t flex items-center justify-between">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Trash2 size={14} />
                Delete Project
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm transition-colors"
              >
                {isEditing ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
