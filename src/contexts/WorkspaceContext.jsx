import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { INITIAL_DATA, PROJECT_TEMPLATES } from '../data/mockData';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const WorkspaceContext = createContext();

export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useLocalStorage('wm_workspaces', INITIAL_DATA.workspaces);
  const [projects, setProjects] = useLocalStorage('wm_projects', INITIAL_DATA.projects);
  const [tasks, setTasks] = useLocalStorage('wm_tasks', INITIAL_DATA.tasks);

  const [activeWorkspaceId, setActiveWorkspaceId] = useLocalStorage('wm_active_workspace', workspaces[0]?.id || null);
  const [activeProjectId, setActiveProjectId] = useLocalStorage('wm_active_project', projects[0]?.id || null);

  const { currentUser } = useAuth();
  const { addToast, addNotification, preferences } = useNotification();

  // Undo / Redo history stacks
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Network sync status
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync data from backend on mount
  const fetchBackendData = useCallback(async (quiet = true) => {
    setIsSyncing(true);
    try {
      const [wsRes, projRes, taskRes] = await Promise.all([
        api.getWorkspaces(),
        api.getProjects(),
        api.getTasks()
      ]);

      if (wsRes.success && Array.isArray(wsRes.workspaces) && wsRes.workspaces.length > 0) {
        setWorkspaces(wsRes.workspaces);
      }
      if (projRes.success && Array.isArray(projRes.projects) && projRes.projects.length > 0) {
        setProjects(projRes.projects);
      }
      if (taskRes.success && Array.isArray(taskRes.tasks)) {
        setTasks(taskRes.tasks);
      }
      setIsOnline(true);
      if (!quiet) {
        addToast({ title: "Sync Complete", description: "Successfully refreshed data from server.", type: "info" });
      }
    } catch (err) {
      console.warn('[Workspace] Server unreachable during sync, using local data:', err.message);
      if (!quiet) {
        addToast({ title: "Offline / Server Unreachable", description: "Using cached offline data.", type: "warning" });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [setWorkspaces, setProjects, setTasks, addToast]);

  useEffect(() => {
    fetchBackendData(true);
  }, [fetchBackendData]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetchBackendData(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast({ title: "Offline Mode", description: "Changes are saved locally and will sync when reconnected.", type: "warning" });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchBackendData, addToast]);

  // Derived Active Workspace & Project
  const activeWorkspace = useMemo(() => {
    return workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0] || null;
  }, [workspaces, activeWorkspaceId]);

  const workspaceProjects = useMemo(() => {
    if (!activeWorkspace) return [];
    return projects.filter(p => p.workspaceId === activeWorkspace.id);
  }, [projects, activeWorkspace]);

  const activeProject = useMemo(() => {
    const found = workspaceProjects.find(p => p.id === activeProjectId);
    return found || workspaceProjects[0] || null;
  }, [workspaceProjects, activeProjectId]);

  const projectTasks = useMemo(() => {
    if (!activeProject) return [];
    return tasks.filter(t => t.projectId === activeProject.id);
  }, [tasks, activeProject]);

  // Push snapshot to undo stack
  const pushUndoSnapshot = useCallback((description) => {
    setUndoStack(prev => [...prev.slice(-20), { tasks: JSON.parse(JSON.stringify(tasks)), description }]);
    setRedoStack([]);
  }, [tasks]);

  // Global Undo & Redo
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, { tasks: JSON.parse(JSON.stringify(tasks)), description: last.description }]);
    setUndoStack(prev => prev.slice(0, -1));
    setTasks(last.tasks);
    addToast({ title: "Undo Action", description: `Reverted: ${last.description}` });
  }, [undoStack, tasks, setTasks, addToast]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, { tasks: JSON.parse(JSON.stringify(tasks)), description: next.description }]);
    setRedoStack(prev => prev.slice(0, -1));
    setTasks(next.tasks);
    addToast({ title: "Redo Action", description: `Restored: ${next.description}` });
  }, [redoStack, tasks, setTasks, addToast]);

  // Workspace Operations
  const addWorkspace = useCallback(async (wsData) => {
    const tempWsId = `ws-${Date.now()}`;
    const newWs = {
      id: tempWsId,
      name: wsData.name || "Untitled Workspace",
      description: wsData.description || "",
      color: wsData.color || "indigo",
      icon: wsData.icon || "Layers",
      members: wsData.members || [
        { userId: currentUser?.id || "usr-1", role: "Owner" }
      ]
    };
    setWorkspaces(prev => [...prev, newWs]);
    setActiveWorkspaceId(newWs.id);

    const defaultProj = {
      id: `proj-${Date.now()}`,
      workspaceId: newWs.id,
      name: "General",
      description: "Welcome to your new workspace! This is your default project.",
      color: wsData.color || "indigo",
      icon: "Sparkles",
      columns: ["TODO", "IN_PROGRESS", "DONE"],
      members: [currentUser?.id || "usr-1"],
      viewPreference: "kanban"
    };
    setProjects(prev => [...prev, defaultProj]);
    setActiveProjectId(defaultProj.id);
    addToast({ title: "Workspace Created", description: newWs.name });

    // Sync with backend
    try {
      const res = await api.createWorkspace(newWs);
      if (res.success && res.workspace) {
        setWorkspaces(prev => prev.map(w => w.id === tempWsId ? res.workspace : w));
        if (res.defaultProject) {
          setProjects(prev => prev.map(p => p.id === defaultProj.id ? res.defaultProject : p));
        }
      }
    } catch (err) {
      console.warn('[Workspace] Server sync failed for addWorkspace:', err.message);
    }

    return newWs.id;
  }, [currentUser, setWorkspaces, setActiveWorkspaceId, setProjects, setActiveProjectId, addToast]);

  const updateWorkspace = useCallback(async (id, updates) => {
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    addToast({ title: "Workspace Updated" });

    try {
      await api.updateWorkspace(id, updates);
    } catch (err) {
      console.warn('[Workspace] Server sync failed for updateWorkspace:', err.message);
    }
  }, [setWorkspaces, addToast]);

  const deleteWorkspace = useCallback(async (id) => {
    if (workspaces.length <= 1) {
      addToast({ title: "Cannot Delete", description: "You must have at least one workspace.", type: "destructive" });
      return false;
    }
    setWorkspaces(prev => prev.filter(w => w.id !== id));
    setProjects(prev => prev.filter(p => p.workspaceId !== id));
    const projectIdsInWs = projects.filter(p => p.workspaceId === id).map(p => p.id);
    setTasks(prev => prev.filter(t => !projectIdsInWs.includes(t.projectId)));

    const nextWs = workspaces.find(w => w.id !== id);
    if (nextWs) {
      setActiveWorkspaceId(nextWs.id);
    }
    addToast({ title: "Workspace Deleted", type: "destructive" });

    try {
      await api.deleteWorkspace(id);
    } catch (err) {
      console.warn('[Workspace] Server sync failed for deleteWorkspace:', err.message);
    }
    return true;
  }, [workspaces, projects, setWorkspaces, setProjects, setTasks, setActiveWorkspaceId, addToast]);

  // Project Operations
  const addProject = useCallback(async (projData) => {
    const template = PROJECT_TEMPLATES.find(t => t.id === projData.templateId);
    const tempProjId = `proj-${Date.now()}`;
    const newProj = {
      id: tempProjId,
      workspaceId: projData.workspaceId || activeWorkspace?.id,
      name: projData.name || template?.name || "New Project",
      description: projData.description || template?.description || "",
      color: projData.color || template?.color || "indigo",
      icon: projData.icon || template?.icon || "Folder",
      columns: template?.columns || projData.columns || ["TODO", "IN_PROGRESS", "REVIEW", "DONE"],
      members: projData.members || (currentUser ? [currentUser.id] : ["usr-1"]),
      viewPreference: "kanban"
    };

    setProjects(prev => [...prev, newProj]);
    setActiveProjectId(tempProjId);

    // If template has default tasks, populate them locally
    if (template?.defaultTasks?.length > 0) {
      const templateTasks = template.defaultTasks.map((t, index) => ({
        id: `task-${Date.now()}-${index}`,
        projectId: tempProjId,
        title: t.title,
        description: t.description || '',
        status: t.status || "TODO",
        priority: t.priority || "Medium",
        assignees: [currentUser?.id || "usr-1"],
        dueDate: new Date(Date.now() + 86400000 * (index + 2)).toISOString().split("T")[0],
        tags: t.tags || ["template"],
        subtasks: t.subtasks || [],
        attachments: [],
        comments: [],
        activityLog: [
          { id: `act-${Date.now()}-${index}`, userId: currentUser?.id || "usr-1", action: "created task from template", timestamp: new Date().toISOString() }
        ]
      }));
      setTasks(prev => [...prev, ...templateTasks]);
    }

    addToast({ title: "Project Created", description: newProj.name });

    // Sync with backend
    try {
      const res = await api.createProject({
        ...newProj,
        templateId: projData.templateId,
        userId: currentUser?.id
      });
      if (res.success && res.project) {
        setProjects(prev => prev.map(p => p.id === tempProjId ? res.project : p));
        if (res.tasks && res.tasks.length > 0) {
          setTasks(prev => [
            ...prev.filter(t => t.projectId !== tempProjId),
            ...res.tasks
          ]);
        }
      }
    } catch (err) {
      console.warn('[Project] Server sync failed for addProject:', err.message);
    }

    return tempProjId;
  }, [activeWorkspace, currentUser, setProjects, setActiveProjectId, setTasks, addToast]);

  const updateProject = useCallback(async (id, updates) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    addToast({ title: "Project Updated" });

    try {
      await api.updateProject(id, updates);
    } catch (err) {
      console.warn('[Project] Server sync failed for updateProject:', err.message);
    }
  }, [setProjects, addToast]);

  const deleteProject = useCallback(async (id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
    const remaining = workspaceProjects.filter(p => p.id !== id);
    if (remaining.length > 0) {
      setActiveProjectId(remaining[0].id);
    }
    addToast({ title: "Project Deleted", type: "destructive" });

    try {
      await api.deleteProject(id);
    } catch (err) {
      console.warn('[Project] Server sync failed for deleteProject:', err.message);
    }
  }, [workspaceProjects, setProjects, setTasks, setActiveProjectId, addToast]);

  const setProjectViewPreference = useCallback(async (projectId, view) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, viewPreference: view } : p));
    try {
      await api.updateProject(projectId, { viewPreference: view });
    } catch (err) {
      // quiet
    }
  }, [setProjects]);

  // Column Operations
  const addColumn = useCallback(async (projectId, columnName) => {
    const trimmed = columnName.trim().toUpperCase();
    if (!trimmed) return;
    setProjects(prev => prev.map(p => {
      if (p.id === projectId && !p.columns?.includes(trimmed)) {
        return { ...p, columns: [...(p.columns || ["TODO", "IN_PROGRESS", "DONE"]), trimmed] };
      }
      return p;
    }));
    addToast({ title: "Column Added", description: trimmed });

    try {
      await api.addColumn(projectId, trimmed);
    } catch (err) {
      console.warn('[Column] Server sync failed for addColumn:', err.message);
    }
  }, [setProjects, addToast]);

  const renameColumn = useCallback(async (projectId, oldName, newName) => {
    const trimmed = newName.trim().toUpperCase();
    if (!trimmed || oldName === trimmed) return;
    pushUndoSnapshot(`Rename column ${oldName} to ${trimmed}`);
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, columns: (p.columns || []).map(c => c === oldName ? trimmed : c) };
      }
      return p;
    }));
    setTasks(prev => prev.map(t => {
      if (t.projectId === projectId && t.status === oldName) {
        return { ...t, status: trimmed };
      }
      return t;
    }));
    addToast({ title: "Column Renamed", description: `${oldName} -> ${trimmed}` });

    try {
      await api.renameColumn(projectId, oldName, trimmed);
    } catch (err) {
      console.warn('[Column] Server sync failed for renameColumn:', err.message);
    }
  }, [pushUndoSnapshot, setProjects, setTasks, addToast]);

  const deleteColumn = useCallback(async (projectId, columnName) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj || (proj.columns && proj.columns.length <= 1)) {
      addToast({ title: "Cannot Delete", description: "Board must have at least one column.", type: "destructive" });
      return;
    }
    pushUndoSnapshot(`Delete column ${columnName}`);
    const fallbackColumn = proj.columns.find(c => c !== columnName) || "TODO";
    setTasks(prev => prev.map(t => {
      if (t.projectId === projectId && t.status === columnName) {
        return { ...t, status: fallbackColumn };
      }
      return t;
    }));
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, columns: p.columns.filter(c => c !== columnName) };
      }
      return p;
    }));
    addToast({ title: "Column Deleted", description: `Tasks moved to ${fallbackColumn}` });

    try {
      await api.deleteColumn(projectId, columnName);
    } catch (err) {
      console.warn('[Column] Server sync failed for deleteColumn:', err.message);
    }
  }, [projects, pushUndoSnapshot, setTasks, setProjects, addToast]);

  // Task Operations
  const addTask = useCallback(async (taskData) => {
    pushUndoSnapshot(`Add task: ${taskData.title || "Untitled"}`);
    const projId = taskData.projectId || activeProject?.id;
    const defaultCol = activeProject?.columns?.[0] || "TODO";
    const tempTaskId = `task-${Date.now()}`;

    const newTask = {
      id: tempTaskId,
      projectId: projId,
      title: taskData.title || "Untitled Task",
      description: taskData.description || "",
      status: taskData.status || defaultCol,
      priority: taskData.priority || "Medium",
      assignees: taskData.assignees || (currentUser ? [currentUser.id] : ["usr-1"]),
      dueDate: taskData.dueDate || new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      tags: taskData.tags || [],
      subtasks: taskData.subtasks || [],
      attachments: taskData.attachments || [],
      comments: taskData.comments || [],
      activityLog: [
        {
          id: `act-${Date.now()}`,
          userId: currentUser?.id || "usr-1",
          action: "created this task",
          timestamp: new Date().toISOString()
        }
      ]
    };

    setTasks(prev => [newTask, ...prev]);
    addToast({
      title: "Task Created",
      description: newTask.title,
      action: { label: "Undo", onClick: undo }
    });

    // Backend sync
    try {
      const res = await api.createTask({
        ...newTask,
        userId: currentUser?.id
      });
      if (res.success && res.task) {
        setTasks(prev => prev.map(t => t.id === tempTaskId ? res.task : t));
      }
    } catch (err) {
      console.warn('[Task] Server sync failed for addTask:', err.message);
    }

    return tempTaskId;
  }, [pushUndoSnapshot, activeProject, currentUser, setTasks, addToast, undo]);

  const updateTask = useCallback(async (id, updates) => {
    pushUndoSnapshot(`Update task`);
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updates };
        const newLog = [...(t.activityLog || [])];
        if (updates.status && updates.status !== t.status) {
          newLog.unshift({
            id: `act-${Date.now()}`,
            userId: currentUser?.id || "usr-1",
            action: `changed status from ${t.status} to ${updates.status}`,
            timestamp: new Date().toISOString()
          });
        }
        if (updates.priority && updates.priority !== t.priority) {
          newLog.unshift({
            id: `act-${Date.now()}`,
            userId: currentUser?.id || "usr-1",
            action: `changed priority to ${updates.priority}`,
            timestamp: new Date().toISOString()
          });
        }
        updated.activityLog = newLog;
        return updated;
      }
      return t;
    }));

    try {
      await api.updateTask(id, { ...updates, userId: currentUser?.id });
    } catch (err) {
      console.warn('[Task] Server sync failed for updateTask:', err.message);
    }
  }, [pushUndoSnapshot, currentUser, setTasks]);

  const deleteTask = useCallback(async (id) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;
    pushUndoSnapshot(`Delete task: ${target.title}`);
    setTasks(prev => prev.filter(t => t.id !== id));
    addToast({
      title: "Task Deleted",
      description: target.title,
      type: "destructive",
      action: { label: "Undo", onClick: undo }
    });

    try {
      await api.deleteTask(id);
    } catch (err) {
      console.warn('[Task] Server sync failed for deleteTask:', err.message);
    }
  }, [tasks, pushUndoSnapshot, setTasks, addToast, undo]);

  const duplicateTask = useCallback(async (id) => {
    const original = tasks.find(t => t.id === id);
    if (!original) return;
    pushUndoSnapshot(`Duplicate task: ${original.title}`);
    const tempClonedId = `task-${Date.now()}`;
    const cloned = {
      ...JSON.parse(JSON.stringify(original)),
      id: tempClonedId,
      title: `${original.title} (Copy)`,
      activityLog: [
        {
          id: `act-${Date.now()}`,
          userId: currentUser?.id || "usr-1",
          action: `duplicated from #${original.id}`,
          timestamp: new Date().toISOString()
        }
      ]
    };
    setTasks(prev => [cloned, ...prev]);
    addToast({ title: "Task Duplicated", description: cloned.title });

    try {
      const res = await api.duplicateTask(id, currentUser?.id);
      if (res.success && res.task) {
        setTasks(prev => prev.map(t => t.id === tempClonedId ? res.task : t));
      }
    } catch (err) {
      console.warn('[Task] Server sync failed for duplicateTask:', err.message);
    }
  }, [tasks, pushUndoSnapshot, currentUser, setTasks, addToast]);

  // Subtask Operations
  const addSubtask = useCallback(async (taskId, title) => {
    if (!title.trim()) return;
    const tempSubId = `sub-${Date.now()}`;
    const newSub = { id: tempSubId, title: title.trim(), completed: false };
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, subtasks: [...(t.subtasks || []), newSub] };
      }
      return t;
    }));

    try {
      const res = await api.addSubtask(taskId, title.trim());
      if (res.success && res.subtask) {
        setTasks(prev => prev.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              subtasks: (t.subtasks || []).map(s => s.id === tempSubId ? res.subtask : s)
            };
          }
          return t;
        }));
      }
    } catch (err) {
      console.warn('[Subtask] Server sync failed for addSubtask:', err.message);
    }
  }, [setTasks]);

  const toggleSubtask = useCallback(async (taskId, subtaskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedSubs = (t.subtasks || []).map(s => {
          if (s.id === subtaskId) {
            return { ...s, completed: !s.completed };
          }
          return s;
        });
        return { ...t, subtasks: updatedSubs };
      }
      return t;
    }));

    try {
      await api.updateSubtask(taskId, subtaskId, {});
    } catch (err) {
      console.warn('[Subtask] Server sync failed for toggleSubtask:', err.message);
    }
  }, [setTasks]);

  const deleteSubtask = useCallback(async (taskId, subtaskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, subtasks: (t.subtasks || []).filter(s => s.id !== subtaskId) };
      }
      return t;
    }));

    try {
      await api.deleteSubtask(taskId, subtaskId);
    } catch (err) {
      console.warn('[Subtask] Server sync failed for deleteSubtask:', err.message);
    }
  }, [setTasks]);

  // Bidirectional Subtask <-> Task Conversion
  const convertSubtaskToTask = useCallback(async (taskId, subtaskId) => {
    const parent = tasks.find(t => t.id === taskId);
    if (!parent) return;
    const sub = (parent.subtasks || []).find(s => s.id === subtaskId);
    if (!sub) return;

    pushUndoSnapshot(`Convert subtask "${sub.title}" to full task`);

    // Remove subtask from parent locally
    deleteSubtask(taskId, subtaskId);

    const tempTaskId = `task-${Date.now()}`;
    const newTask = {
      id: tempTaskId,
      projectId: parent.projectId,
      title: sub.title,
      description: `Converted from subtask of #${parent.id}: ${parent.title}`,
      status: parent.status,
      priority: parent.priority,
      assignees: [...(parent.assignees || [])],
      dueDate: parent.dueDate,
      tags: [...(parent.tags || []), "promoted"],
      subtasks: [],
      attachments: [],
      comments: [],
      activityLog: [
        {
          id: `act-${Date.now()}`,
          userId: currentUser?.id || "usr-1",
          action: `elevated from subtask of "${parent.title}"`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    setTasks(prev => [newTask, ...prev]);
    addToast({ title: "Subtask Converted to Task", description: newTask.title });

    try {
      const res = await api.convertSubtaskToTask(taskId, subtaskId, currentUser?.id);
      if (res.success && res.task) {
        setTasks(prev => prev.map(t => t.id === tempTaskId ? res.task : t));
      }
    } catch (err) {
      console.warn('[Subtask] Server sync failed for convertSubtaskToTask:', err.message);
    }
  }, [tasks, pushUndoSnapshot, deleteSubtask, currentUser, setTasks, addToast]);

  const convertTaskToSubtask = useCallback(async (parentTaskId, taskIdToConvert) => {
    const parent = tasks.find(t => t.id === parentTaskId);
    const child = tasks.find(t => t.id === taskIdToConvert);
    if (!parent || !child || parent.id === child.id) return;

    pushUndoSnapshot(`Convert task "${child.title}" to subtask of "${parent.title}"`);

    const newSub = {
      id: `sub-${Date.now()}`,
      title: child.title,
      completed: child.status === "DONE"
    };

    setTasks(prev => prev
      .filter(t => t.id !== child.id)
      .map(t => t.id === parent.id ? { ...t, subtasks: [...(t.subtasks || []), newSub] } : t)
    );

    addToast({ title: "Task Converted to Subtask", description: `Added under ${parent.title}` });

    try {
      await api.convertTaskToSubtask(parentTaskId, taskIdToConvert);
    } catch (err) {
      console.warn('[Task] Server sync failed for convertTaskToSubtask:', err.message);
    }
  }, [tasks, pushUndoSnapshot, setTasks, addToast]);

  // Attachments
  const addAttachment = useCallback((taskId, fileObj) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, attachments: [...(t.attachments || []), fileObj] };
      }
      return t;
    }));
    addToast({ title: "Attachment Added", description: fileObj.name });
  }, [setTasks, addToast]);

  const deleteAttachment = useCallback(async (taskId, attachmentId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, attachments: (t.attachments || []).filter(a => a.id !== attachmentId) };
      }
      return t;
    }));
    addToast({ title: "Attachment Removed" });

    try {
      await api.deleteAttachment(taskId, attachmentId);
    } catch (err) {
      console.warn('[Attachment] Server sync failed for deleteAttachment:', err.message);
    }
  }, [setTasks, addToast]);

  // Comments
  const addComment = useCallback(async (taskId, text) => {
    if (!text.trim()) return;
    const tempCommId = `comm-${Date.now()}`;
    const newComment = {
      id: tempCommId,
      userId: currentUser?.id || "usr-1",
      text: text.trim(),
      createdAt: new Date().toISOString()
    };
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          comments: [...(t.comments || []), newComment],
          activityLog: [
            {
              id: `act-${Date.now()}`,
              userId: currentUser?.id || "usr-1",
              action: `commented: "${text.trim().slice(0, 35)}..."`,
              timestamp: new Date().toISOString()
            },
            ...(t.activityLog || [])
          ]
        };
      }
      return t;
    }));

    try {
      await api.addComment(taskId, text.trim(), currentUser?.id);
    } catch (err) {
      console.warn('[Comment] Server sync failed for addComment:', err.message);
    }
  }, [currentUser, setTasks]);

  // Bulk Operations
  const bulkUpdateStatus = useCallback(async (taskIds, newStatus) => {
    pushUndoSnapshot(`Bulk status update for ${taskIds.length} tasks to ${newStatus}`);
    setTasks(prev => prev.map(t => taskIds.includes(t.id) ? { ...t, status: newStatus } : t));
    addToast({ title: "Bulk Status Updated", description: `${taskIds.length} tasks moved to ${newStatus}` });

    try {
      await api.bulkUpdateStatus(taskIds, newStatus);
    } catch (err) {
      console.warn('[Bulk] Server sync failed for bulkUpdateStatus:', err.message);
    }
  }, [pushUndoSnapshot, setTasks, addToast]);

  const bulkUpdatePriority = useCallback(async (taskIds, newPriority) => {
    pushUndoSnapshot(`Bulk priority update for ${taskIds.length} tasks to ${newPriority}`);
    setTasks(prev => prev.map(t => taskIds.includes(t.id) ? { ...t, priority: newPriority } : t));
    addToast({ title: "Bulk Priority Updated", description: `${taskIds.length} tasks set to ${newPriority}` });

    try {
      await api.bulkUpdatePriority(taskIds, newPriority);
    } catch (err) {
      console.warn('[Bulk] Server sync failed for bulkUpdatePriority:', err.message);
    }
  }, [pushUndoSnapshot, setTasks, addToast]);

  const bulkAssign = useCallback(async (taskIds, userIds) => {
    pushUndoSnapshot(`Bulk assignment for ${taskIds.length} tasks`);
    setTasks(prev => prev.map(t => taskIds.includes(t.id) ? { ...t, assignees: userIds } : t));
    addToast({ title: "Bulk Assignment Updated", description: `${taskIds.length} tasks updated` });

    try {
      await api.bulkAssign(taskIds, userIds);
    } catch (err) {
      console.warn('[Bulk] Server sync failed for bulkAssign:', err.message);
    }
  }, [pushUndoSnapshot, setTasks, addToast]);

  const bulkDelete = useCallback(async (taskIds) => {
    pushUndoSnapshot(`Bulk delete ${taskIds.length} tasks`);
    setTasks(prev => prev.filter(t => !taskIds.includes(t.id)));
    addToast({ title: "Bulk Deleted", description: `Removed ${taskIds.length} tasks`, type: "destructive", action: { label: "Undo", onClick: undo } });

    try {
      await api.bulkDelete(taskIds);
    } catch (err) {
      console.warn('[Bulk] Server sync failed for bulkDelete:', err.message);
    }
  }, [pushUndoSnapshot, setTasks, addToast, undo]);

  // Manual Sync with Server
  const syncChanges = useCallback(async () => {
    await fetchBackendData(false);
  }, [fetchBackendData]);

  // Reset Demo Data
  const resetToDemoData = useCallback(async () => {
    try {
      const res = await api.resetDemoData();
      if (res.success && res.data) {
        setWorkspaces(res.data.workspaces);
        setProjects(res.data.projects);
        setTasks(res.data.tasks);
        setActiveWorkspaceId(res.data.workspaces[0]?.id || null);
        setActiveProjectId(res.data.projects[0]?.id || null);
      } else {
        throw new Error('Server reset returned non-success');
      }
    } catch (err) {
      console.warn('[Workspace] Server reset failed, falling back to local reset:', err.message);
      setWorkspaces(INITIAL_DATA.workspaces);
      setProjects(INITIAL_DATA.projects);
      setTasks(INITIAL_DATA.tasks);
      setActiveWorkspaceId(INITIAL_DATA.workspaces[0].id);
      setActiveProjectId(INITIAL_DATA.projects[0].id);
    }
    setUndoStack([]);
    setRedoStack([]);
    addToast({ title: "Demo Data Reset", description: "Restored fresh mock workspaces and projects.", type: "info" });
  }, [setWorkspaces, setProjects, setTasks, setActiveWorkspaceId, setActiveProjectId, addToast]);

  // Simulated Live Activity
  useEffect(() => {
    if (!preferences.simulatedActivity) return;

    const interval = setInterval(() => {
      const otherUsers = [
        { id: "usr-2", name: "Bilal Ahmed" },
        { id: "usr-3", name: "Ayesha Fatima" }
      ];
      const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];

      if (tasks.length === 0) return;
      const randomTask = tasks[Math.floor(Math.random() * tasks.length)];

      const events = [
        {
          title: `${randomUser.name} left a comment`,
          msg: `"${randomUser.name} commented on '${randomTask.title.slice(0, 30)}...'"`
        },
        {
          title: `Task Status Update`,
          msg: `${randomUser.name} reviewed progress on '${randomTask.title.slice(0, 30)}...'`
        }
      ];
      const ev = events[Math.floor(Math.random() * events.length)];

      addNotification({
        title: ev.title,
        message: ev.msg,
        type: "simulation"
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [preferences.simulatedActivity, tasks, addNotification]);

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      projects,
      tasks,
      activeWorkspaceId,
      setActiveWorkspaceId,
      activeProjectId,
      setActiveProjectId,
      activeWorkspace,
      activeProject,
      workspaceProjects,
      projectTasks,
      // Workspace CRUD
      addWorkspace,
      updateWorkspace,
      deleteWorkspace,
      // Project CRUD & templates
      addProject,
      updateProject,
      deleteProject,
      setProjectViewPreference,
      // Columns
      addColumn,
      renameColumn,
      deleteColumn,
      // Task CRUD & Subtasks
      addTask,
      updateTask,
      deleteTask,
      duplicateTask,
      addSubtask,
      toggleSubtask,
      deleteSubtask,
      convertSubtaskToTask,
      convertTaskToSubtask,
      // Attachments & Comments
      addAttachment,
      deleteAttachment,
      addComment,
      // Bulk Actions
      bulkUpdateStatus,
      bulkUpdatePriority,
      bulkAssign,
      bulkDelete,
      // Undo / Redo
      undo,
      redo,
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
      // Sync & State
      isOnline,
      isSyncing,
      syncChanges,
      resetToDemoData
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
