import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { X, Trash2, Check, Shield, UserPlus } from 'lucide-react';

const COLORS = [
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
  { id: 'blue', label: 'Blue', bg: 'bg-blue-500' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
  { id: 'pink', label: 'Pink', bg: 'bg-pink-500' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-500' }
];

export default function WorkspaceModal({ isOpen, onClose, initialData = null }) {
  const { addWorkspace, updateWorkspace, deleteWorkspace, workspaces } = useWorkspace();
  const { users, currentUser } = useAuth();

  const isEditing = Boolean(initialData);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('indigo');
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setColor(initialData.color || 'indigo');
      setMembers(initialData.members || []);
    } else {
      setName('');
      setDescription('');
      setColor('indigo');
      setMembers(currentUser ? [{ userId: currentUser.id, role: 'Owner' }] : []);
    }
  }, [initialData, isOpen, currentUser]);

  if (!isOpen) return null;

  const handleMemberRoleChange = (userId, newRole) => {
    setMembers(prev => prev.map(m => m.userId === userId ? { ...m, role: newRole } : m));
  };

  const handleAddMember = (userId) => {
    if (members.some(m => m.userId === userId)) return;
    setMembers(prev => [...prev, { userId, role: 'Member' }]);
  };

  const handleRemoveMember = (userId) => {
    if (members.length <= 1) return; // Keep at least one
    setMembers(prev => prev.filter(m => m.userId !== userId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing) {
      updateWorkspace(initialData.id, {
        name: name.trim(),
        description: description.trim(),
        color,
        members
      });
    } else {
      addWorkspace({
        name: name.trim(),
        description: description.trim(),
        color,
        icon: 'Layers',
        members
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete workspace "${initialData.name}"? All associated projects and tasks will be removed.`)) {
      deleteWorkspace(initialData.id);
      onClose();
    }
  };

  const availableUsersToAdd = users.filter(u => !members.some(m => m.userId === u.id));

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden text-card-foreground animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold">
            {isEditing ? 'Workspace Settings' : 'Create New Workspace'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Workspace Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Engineering & Product, Operations"
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
              placeholder="What is this workspace for?"
              rows={2}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Color Theme
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

          {/* Members & Roles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Members & RBAC Roles ({members.length})
              </label>
            </div>

            <div className="space-y-2 border rounded-xl p-3 bg-muted/20 max-h-48 overflow-y-auto">
              {members.map(m => {
                const user = users.find(u => u.id === m.userId);
                if (!user) return null;
                return (
                  <div key={m.userId} className="flex items-center justify-between gap-2 p-1.5 bg-card rounded-lg border border-border/40 shadow-xs">
                    <div className="flex items-center gap-2 truncate">
                      <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-semibold leading-tight truncate">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={m.role}
                        onChange={e => handleMemberRoleChange(m.userId, e.target.value)}
                        className="text-xs px-2 py-1 rounded border bg-background text-foreground"
                      >
                        <option value="Owner">Owner</option>
                        <option value="Admin">Admin</option>
                        <option value="Member">Member</option>
                        <option value="Viewer">Viewer</option>
                      </select>

                      {members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.userId)}
                          className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                          title="Remove member"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {availableUsersToAdd.length > 0 && (
                <div className="pt-2 border-t flex items-center gap-2">
                  <UserPlus size={14} className="text-muted-foreground shrink-0" />
                  <select
                    onChange={e => {
                      if (e.target.value) {
                        handleAddMember(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                    className="w-full text-xs px-2 py-1 rounded border bg-background text-muted-foreground"
                  >
                    <option value="" disabled>+ Invite another mock user...</option>
                    {availableUsersToAdd.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              )}
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
                Delete Workspace
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
                {isEditing ? 'Save Changes' : 'Create Workspace'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
