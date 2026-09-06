const API_BASE = import.meta.env.VITE_API_URL || '';

function getAuthToken() {
  return localStorage.getItem('wm_auth_token') || '';
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {})
  };

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg = (data && data.error) || (data && data.message) || `HTTP error ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  async getUsers() {
    return request('/api/auth/users');
  },
  async login(email) {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },
  async signup(userData) {
    return request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  async getMe() {
    return request('/api/auth/me');
  },

  // Workspaces
  async getWorkspaces() {
    return request('/api/workspaces');
  },
  async createWorkspace(data) {
    return request('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateWorkspace(id, data) {
    return request(`/api/workspaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deleteWorkspace(id) {
    return request(`/api/workspaces/${id}`, {
      method: 'DELETE'
    });
  },

  // Projects
  async getProjects(workspaceId) {
    const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
    return request(`/api/projects${query}`);
  },
  async createProject(data) {
    return request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateProject(id, data) {
    return request(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deleteProject(id) {
    return request(`/api/projects/${id}`, {
      method: 'DELETE'
    });
  },
  async addColumn(projectId, columnName) {
    return request(`/api/projects/${projectId}/columns`, {
      method: 'POST',
      body: JSON.stringify({ columnName })
    });
  },
  async renameColumn(projectId, oldName, newName) {
    return request(`/api/projects/${projectId}/columns`, {
      method: 'PUT',
      body: JSON.stringify({ oldName, newName })
    });
  },
  async deleteColumn(projectId, colName) {
    return request(`/api/projects/${projectId}/columns/${encodeURIComponent(colName)}`, {
      method: 'DELETE'
    });
  },

  // Tasks
  async getTasks(projectId) {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return request(`/api/tasks${query}`);
  },
  async createTask(data) {
    return request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateTask(id, data) {
    return request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deleteTask(id) {
    return request(`/api/tasks/${id}`, {
      method: 'DELETE'
    });
  },
  async duplicateTask(id, userId) {
    return request(`/api/tasks/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  // Subtasks
  async addSubtask(taskId, title) {
    return request(`/api/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title })
    });
  },
  async updateSubtask(taskId, subId, updates) {
    return request(`/api/tasks/${taskId}/subtasks/${subId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },
  async deleteSubtask(taskId, subId) {
    return request(`/api/tasks/${taskId}/subtasks/${subId}`, {
      method: 'DELETE'
    });
  },
  async convertSubtaskToTask(taskId, subId, userId) {
    return request(`/api/tasks/${taskId}/subtasks/${subId}/convert-to-task`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },
  async convertTaskToSubtask(parentTaskId, taskIdToConvert) {
    return request(`/api/tasks/${parentTaskId}/convert-to-subtask`, {
      method: 'POST',
      body: JSON.stringify({ taskIdToConvert })
    });
  },

  // Comments
  async addComment(taskId, text, userId) {
    return request(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, userId })
    });
  },

  // Attachments
  async uploadAttachment(taskId, file) {
    const formData = new FormData();
    formData.append('file', file);
    return request(`/api/tasks/${taskId}/attachments`, {
      method: 'POST',
      body: formData
    });
  },
  async deleteAttachment(taskId, attId) {
    return request(`/api/tasks/${taskId}/attachments/${attId}`, {
      method: 'DELETE'
    });
  },

  // Bulk Operations
  async bulkUpdateStatus(taskIds, status) {
    return request('/api/tasks/bulk/status', {
      method: 'POST',
      body: JSON.stringify({ taskIds, status })
    });
  },
  async bulkUpdatePriority(taskIds, priority) {
    return request('/api/tasks/bulk/priority', {
      method: 'POST',
      body: JSON.stringify({ taskIds, priority })
    });
  },
  async bulkAssign(taskIds, assignees) {
    return request('/api/tasks/bulk/assign', {
      method: 'POST',
      body: JSON.stringify({ taskIds, assignees })
    });
  },
  async bulkDelete(taskIds) {
    return request('/api/tasks/bulk/delete', {
      method: 'POST',
      body: JSON.stringify({ taskIds })
    });
  },

  // System & Health
  async healthCheck() {
    return request('/api/health');
  },
  async exportData() {
    return request('/api/system/export');
  },
  async importData(snapshot) {
    return request('/api/system/import', {
      method: 'POST',
      body: JSON.stringify(snapshot)
    });
  },
  async resetDemoData() {
    return request('/api/system/reset', {
      method: 'POST'
    });
  }
};
