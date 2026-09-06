export const PROJECT_TEMPLATES = [
  {
    id: "template-agile",
    name: "Agile Sprint Board",
    description: "Standard 2-week sprint workflow with Backlog, In Progress, Review, and Done stages.",
    color: "blue",
    icon: "Zap",
    columns: ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"],
    defaultTasks: [
      {
        title: "Architecture review: API Gateway & Auth tokens",
        description: "Review JWT rotation, RBAC permission matrices, and token refresh endpoints.",
        status: "IN_PROGRESS",
        priority: "Urgent",
        tags: ["backend", "security"],
        subtasks: [
          { id: "sub-1", title: "Verify token expiration headers", completed: true },
          { id: "sub-2", title: "Test RBAC middleware on viewer routes", completed: true },
          { id: "sub-3", title: "Write documentation on Swagger", completed: false }
        ]
      },
      {
        title: "Sprint Retrospective & Velocity tracking",
        description: "Review completed story points and estimate sprint 42 capacity.",
        status: "TODO",
        priority: "Medium",
        tags: ["agile", "planning"],
        subtasks: [
          { id: "sub-4", title: "Collect feedback on Miro board", completed: false },
          { id: "sub-5", title: "Update burndown chart", completed: false }
        ]
      }
    ]
  },
  {
    id: "template-launch",
    name: "Product Launch Roadmap",
    description: "End-to-end launch plan covering marketing, engineering, analytics, and press releases.",
    color: "emerald",
    icon: "Rocket",
    columns: ["PLANNING", "IN_PROGRESS", "STAGING", "LAUNCHED"],
    defaultTasks: [
      {
        title: "Press release & Product Hunt assets",
        description: "Prepare hero screenshots, product pitch GIF, and founder comment.",
        status: "PLANNING",
        priority: "High",
        tags: ["marketing", "launch"],
        subtasks: [
          { id: "sub-6", title: "Design 1200x630 og-image banner", completed: true },
          { id: "sub-7", title: "Schedule launch announcement email", completed: false }
        ]
      },
      {
        title: "Setup PostHog & Google Analytics 4",
        description: "Implement custom event tracking for signups, workspace creations, and task drags.",
        status: "IN_PROGRESS",
        priority: "Urgent",
        tags: ["analytics"],
        subtasks: [
          { id: "sub-8", title: "Define tracking taxonomy document", completed: true },
          { id: "sub-9", title: "Test event triggers in staging environment", completed: false }
        ]
      }
    ]
  },
  {
    id: "template-bugs",
    name: "Bug & Issue Tracker",
    description: "Structured triage workflow for reporting, investigating, fixing, and verifying bugs.",
    color: "rose",
    icon: "Bug",
    columns: ["REPORTED", "TRIAGED", "IN_FIX", "VERIFIED"],
    defaultTasks: [
      {
        title: "Fix memory leak in calendar monthly grid view",
        description: "When toggling between months rapidly, unmounted event listeners cause memory spikes.",
        status: "TRIAGED",
        priority: "High",
        tags: ["bug", "frontend"],
        subtasks: [
          { id: "sub-10", title: "Profile React component re-renders", completed: true },
          { id: "sub-11", title: "Clean up animation frame listeners", completed: false }
        ]
      },
      {
        title: "Kanban board card jitter during multi-touch drag",
        description: "Touch devices occasionally trigger scroll bounce when dragging cards between columns.",
        status: "REPORTED",
        priority: "Medium",
        tags: ["mobile", "dnd"],
        subtasks: [
          { id: "sub-12", title: "Add touch-action: none on drag handles", completed: false }
        ]
      }
    ]
  }
];

export const INITIAL_DATA = {
  workspaces: [
    {
      id: "ws-1",
      name: "Engineering & Product",
      description: "Primary workspace for engineering sprints, core product roadmaps, and releases.",
      color: "indigo",
      icon: "Layers",
      members: [
        { userId: "usr-1", role: "Admin" },
        { userId: "usr-2", role: "Owner" },
        { userId: "usr-3", role: "Member" },
        { userId: "usr-4", role: "Viewer" }
      ]
    },
    {
      id: "ws-2",
      name: "Marketing & Growth",
      description: "Acquisition campaigns, content calendars, and brand positioning.",
      color: "pink",
      icon: "TrendingUp",
      members: [
        { userId: "usr-2", role: "Owner" },
        { userId: "usr-1", role: "Admin" },
        { userId: "usr-3", role: "Member" }
      ]
    }
  ],
  projects: [
    {
      id: "proj-1",
      workspaceId: "ws-1",
      name: "Core Platform 2.0",
      description: "Replatforming to modern React Vite SPA with drag-and-drop workflow engine.",
      color: "indigo",
      icon: "Code",
      columns: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"],
      members: ["usr-1", "usr-2", "usr-3", "usr-4"],
      viewPreference: "kanban"
    },
    {
      id: "proj-2",
      workspaceId: "ws-1",
      name: "Q4 Sprint: AI Copilot",
      description: "Next-gen workspace intelligence features, command palette search, and automated workflows.",
      color: "emerald",
      icon: "Sparkles",
      columns: ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"],
      members: ["usr-1", "usr-3"],
      viewPreference: "kanban"
    },
    {
      id: "proj-3",
      workspaceId: "ws-2",
      name: "Q4 Brand Campaign",
      description: "Brand repositioning, developer advocacy outreach, and landing page overhaul.",
      color: "pink",
      icon: "Megaphone",
      columns: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"],
      members: ["usr-2", "usr-1"],
      viewPreference: "list"
    }
  ],
  tasks: [
    {
      id: "task-1",
      projectId: "proj-1",
      title: "Design and implement global Command Palette (Cmd+K)",
      description: "Provide quick jumping to projects, tasks, workspace settings, and switching theme shortcuts.",
      status: "DONE",
      priority: "High",
      assignees: ["usr-1", "usr-3"],
      dueDate: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
      tags: ["ui", "ux", "accessibility"],
      subtasks: [
        { id: "sub-101", title: "Add global keydown event listener for Cmd+K and Ctrl+K", completed: true },
        { id: "sub-102", title: "Fuzzy search across projects and tasks", completed: true },
        { id: "sub-103", title: "Add keyboard navigation support (arrow keys + enter)", completed: true }
      ],
      attachments: [
        {
          id: "att-1",
          name: "cmd-k-spec.pdf",
          size: "142 KB",
          type: "application/pdf",
          createdAt: "2026-09-01"
        }
      ],
      comments: [
        {
          id: "comm-1",
          userId: "usr-2",
          text: "Awesome work! Make sure it closes gracefully when Escape key is pressed @Hamza Khan.",
          createdAt: "2026-09-02T10:15:00Z"
        },
        {
          id: "comm-2",
          userId: "usr-1",
          text: "Done! It also auto-focuses the input upon opening.",
          createdAt: "2026-09-02T11:04:00Z"
        }
      ],
      activityLog: [
        { id: "act-1", userId: "usr-1", action: "created the task", timestamp: "2026-09-01T09:00:00Z" },
        { id: "act-2", userId: "usr-1", action: "moved to DONE", timestamp: "2026-09-02T11:05:00Z" }
      ]
    },
    {
      id: "task-2",
      projectId: "proj-1",
      title: "Offline Sync Engine & IndexedDB Rehydration",
      description: "Ensure complete offline capability with automatic localStorage synchronization and simulated network status indicator.",
      status: "IN_PROGRESS",
      priority: "Urgent",
      assignees: ["usr-1"],
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      tags: ["offline", "storage", "core"],
      subtasks: [
        { id: "sub-201", title: "Setup window.navigator.onLine event listeners", completed: true },
        { id: "sub-202", title: "Implement manual 'Sync Now' action with optimistic rollback", completed: true },
        { id: "sub-203", title: "Provide JSON Schema validation for imported backup files", completed: false }
      ],
      attachments: [],
      comments: [
        {
          id: "comm-3",
          userId: "usr-3",
          text: "Can we also add a Reset to Demo Data button in Settings? @Hamza Khan",
          createdAt: "2026-09-03T14:20:00Z"
        }
      ],
      activityLog: [
        { id: "act-3", userId: "usr-1", action: "created the task", timestamp: "2026-09-02T13:00:00Z" },
        { id: "act-4", userId: "usr-1", action: "moved to IN_PROGRESS", timestamp: "2026-09-03T09:30:00Z" }
      ]
    },
    {
      id: "task-3",
      projectId: "proj-1",
      title: "Interactive Kanban Board with drag-and-drop & custom columns",
      description: "Support fluid column reordering, task cards with priority badges, and checklist indicators.",
      status: "REVIEW",
      priority: "High",
      assignees: ["usr-3"],
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
      tags: ["kanban", "dnd", "ui"],
      subtasks: [
        { id: "sub-301", title: "Integrate @hello-pangea/dnd context and droppables", completed: true },
        { id: "sub-302", title: "Allow adding, renaming, and deleting custom columns", completed: true },
        { id: "sub-303", title: "Support bulk selection of tasks across columns", completed: false }
      ],
      attachments: [],
      comments: [],
      activityLog: [
        { id: "act-5", userId: "usr-3", action: "created the task", timestamp: "2026-09-02T16:00:00Z" },
        { id: "act-6", userId: "usr-3", action: "moved to REVIEW", timestamp: "2026-09-04T12:10:00Z" }
      ]
    },
    {
      id: "task-4",
      projectId: "proj-1",
      title: "Multi-parameter filter bar & Saved Presets",
      description: "Allow filtering tasks by text, priority, status, assignee, and tags with quick-select presets.",
      status: "TODO",
      priority: "Medium",
      assignees: ["usr-2"],
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
      tags: ["filtering", "search"],
      subtasks: [
        { id: "sub-401", title: "Text query search debounced", completed: false },
        { id: "sub-402", title: "Filter chips for priority and status", completed: false },
        { id: "sub-403", title: "One-click 'My Tasks' preset", completed: false }
      ],
      attachments: [],
      comments: [],
      activityLog: [
        { id: "act-7", userId: "usr-2", action: "created the task", timestamp: "2026-09-03T10:00:00Z" }
      ]
    },
    {
      id: "task-5",
      projectId: "proj-1",
      title: "Subtask <-> Full Task Bidirectional Conversion",
      description: "Elevate a checklist subtask into a full standalone task with one click, and convert a task to a subtask.",
      status: "TODO",
      priority: "Low",
      assignees: ["usr-3"],
      dueDate: new Date(Date.now() + 86400000 * 9).toISOString().split("T")[0],
      tags: ["subtasks", "feature"],
      subtasks: [
        { id: "sub-501", title: "Add 'Convert to Task' button next to each subtask", completed: false }
      ],
      attachments: [],
      comments: [],
      activityLog: [
        { id: "act-8", userId: "usr-3", action: "created the task", timestamp: "2026-09-04T08:30:00Z" }
      ]
    }
  ]
};
