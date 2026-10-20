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
      { label: "Jenkins", path: "/jenkins", icon: "user" },
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

export const placeholderPages = {
  "/editor": {
    eyebrow: "DEVELOPMENT",
    title: "Code Editor",
    description:
      "Write, preview and run code in a focused cloud IDE with AI assistance built in.",
    icon: "code",
    accent: "blue",
  },
  "/git": {
    eyebrow: "DEVELOPMENT",
    title: "Git Repositories",
    description:
      "Browse branches, review commit activity and connect repositories to your projects.",
    icon: "gitBranch",
    accent: "orange",
  },
  "/docker": {
    eyebrow: "DEPLOYMENT",
    title: "Docker",
    description:
      "Inspect images and containers, manage environments and track resource usage.",
    icon: "container",
    accent: "blue",
  },
  "/jenkins": {
    eyebrow: "DEPLOYMENT",
    title: "Jenkins",
    description:
      "Connect Jenkins jobs and keep an eye on classic build automation from one place.",
    icon: "user",
    accent: "purple",
  },
  "/cicd": {
    eyebrow: "DEPLOYMENT",
    title: "CI/CD",
    description:
      "Design, run and monitor pipelines from commit to production without leaving the dashboard.",
    icon: "lineChart",
    accent: "green",
  },
  "/monitoring": {
    eyebrow: "MONITORING",
    title: "Monitoring",
    description:
      "Live health, performance and availability signals for every service you operate.",
    icon: "activity",
    accent: "green",
  },
  "/logs": {
    eyebrow: "MONITORING",
    title: "Logs",
    description:
      "Search and stream application, container and pipeline logs in real time.",
    icon: "fileText",
    accent: "blue",
  },
  "/ai-assistant": {
    eyebrow: "AI TOOLS",
    title: "AI Assistant",
    description:
      "Ask questions, debug code and get DevOps guidance from your always-on AI partner.",
    icon: "bot",
    accent: "pink",
  },
  "/settings": {
    eyebrow: "SETTINGS",
    title: "Settings",
    description:
      "Manage your profile, workspace preferences, notifications and integrations.",
    icon: "settings",
    accent: "purple",
  },
};

export const currentUser = {
  name: "admin",
  role: "Platform Administrator",
  initials: "A",
};

export const notifications = [
  {
    id: "deployment",
    title: "Deployment completed",
    description: "AllInOneDevOps is live on production.",
    time: "12 min ago",
  },
  {
    id: "build",
    title: "Pipeline passed",
    description: "Build #184 finished successfully.",
    time: "1 hour ago",
  },
  {
    id: "container",
    title: "Container restarted",
    description: "api-gateway was restarted automatically.",
    time: "2 hours ago",
  },
];
