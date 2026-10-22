export const quickActions = [
  {
    id: "new-project",
    title: "New Project",
    description: "Create a new project",
    icon: "folder",
    tone: "purple",
    path: "/projects?new=1",
  },
  {
    id: "open-editor",
    title: "Open Editor",
    description: "Start coding online",
    icon: "code",
    tone: "blue",
    path: "/editor",
  },
  {
    id: "build-project",
    title: "Build Project",
    description: "Run build pipeline",
    icon: "settings",
    tone: "green",
    path: "/cicd",
  },
  {
    id: "manage-containers",
    title: "Manage Containers",
    description: "View running containers",
    icon: "container",
    tone: "orange",
    path: "/docker",
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    description: "Get instant help",
    icon: "bot",
    tone: "pink",
    path: "/ai-assistant",
  },
];

export const sidebarSections = [
  {
    label: "PROJECT",
    items: [
      { label: "Projects", path: "/projects", icon: "folder" },
      { label: "Change History", path: "/history", icon: "history" },
    ],
  },
  {
    label: "DEVELOPMENT",
    items: [
      { label: "Code Editor", path: "/editor", icon: "code" },
      { label: "Git Repositories", path: "/git", icon: "gitBranch" },
    ],
  },
  {
    label: "DEPLOYMENT",
    items: [
      { label: "Docker", path: "/docker", icon: "container" },
      { label: "Jenkins", path: "/jenkins", icon: "server" },
      { label: "CI/CD", path: "/cicd", icon: "lineChart" },
    ],
  },
  {
    label: "MONITORING",
    items: [
      { label: "Monitoring", path: "/monitoring", icon: "activity" },
      { label: "Logs", path: "/logs", icon: "fileText" },
    ],
  },
  {
    label: "AI TOOLS",
    items: [
      { label: "AI Assistant", path: "/ai-assistant", icon: "bot" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { label: "Settings", path: "/settings", icon: "settings" },
      {
        label: "Logout",
        action: "logout",
        icon: "logOut",
        danger: true,
      },
    ],
  },
];
