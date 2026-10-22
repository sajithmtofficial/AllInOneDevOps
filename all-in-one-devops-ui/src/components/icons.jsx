import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bot,
  Calendar,
  ChartLine,
  ChevronDown,
  ChevronRight,
  Circle,
  Cloud,
  Code2,
  Container,
  ExternalLink,
  FileText,
  Folder,
  FolderPlus,
  GitBranch,
  History,
  Home,
  Infinity as InfinityIcon,
  Laptop,
  LogIn,
  LogOut,
  Menu,
  MoreVertical,
  Play,
  Plus,
  Rocket,
  Search,
  Server,
  Settings,
  Sparkles,
  Sun,
  Moon,
  User,
  Wrench,
  X,
} from "lucide-react";

export const iconLibrary = {
  activity: Activity,
  arrowRight: ArrowRight,
  arrowUpRight: ArrowUpRight,
  bell: Bell,
  bot: Bot,
  calendar: Calendar,
  lineChart: ChartLine,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  circle: Circle,
  cloud: Cloud,
  code: Code2,
  container: Container,
  externalLink: ExternalLink,
  fileText: FileText,
  folder: Folder,
  folderPlus: FolderPlus,
  gitBranch: GitBranch,
  history: History,
  home: Home,
  infinity: InfinityIcon,
  laptop: Laptop,
  logIn: LogIn,
  logOut: LogOut,
  menu: Menu,
  moreVertical: MoreVertical,
  play: Play,
  plus: Plus,
  rocket: Rocket,
  search: Search,
  server: Server,
  settings: Settings,
  sparkles: Sparkles,
  sun: Sun,
  moon: Moon,
  user: User,
  wrench: Wrench,
  x: X,
};

export function Icon({ name, ...props }) {
  const Component = iconLibrary[name] ?? Circle;
  return <Component {...props} />;
}

export function DockerWhale({ className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 64 48"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <rect
        x="18"
        y="15"
        width="9"
        height="7"
        rx="1.4"
        fill="currentColor"
        opacity="0.95"
      />
      <rect
        x="29"
        y="15"
        width="9"
        height="7"
        rx="1.4"
        fill="currentColor"
        opacity="0.95"
      />
      <rect
        x="40"
        y="15"
        width="9"
        height="7"
        rx="1.4"
        fill="currentColor"
        opacity="0.95"
      />
      <rect
        x="23.5"
        y="7"
        width="9"
        height="6"
        rx="1.4"
        fill="currentColor"
        opacity="0.8"
      />
      <rect
        x="34.5"
        y="7"
        width="9"
        height="6"
        rx="1.4"
        fill="currentColor"
        opacity="0.8"
      />
      <path
        d="M8 30c0-5 4.3-9 9.6-9h28.2c6.1 0 11.2 3.3 13.2 9.2 2.2-.8 4.2.2 4.2 2.3 0 5.6-4.7 10.2-10.5 10.2H20.1C13.4 42.7 8 37.6 8 30Z"
        fill="currentColor"
      />
      <circle cx="18.5" cy="26.5" r="1.6" fill="#0a0e1f" />
      <path
        d="M8.2 28.6C5.7 25.4 3 25 1.4 27c1.1 3.1 3.7 5.1 6.8 5.1"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M30 42c-1.5 2.8-4.3 4.4-7.4 4.4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}

export function CloudTileIcon(props) {
  return <Cloud {...props} />;
}

export function GitHubIcon({ size = 16, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}

export function InfinityLogo({ className = "", monochrome = false, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient
          id="infinity-gradient"
          x1="3"
          y1="8"
          x2="21"
          y2="16"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#38bdf8" />
          <stop offset="0.5" stopColor="#818cf8" />
          <stop offset="1" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <path
        d="M6 16c5 0 7-8 12-8a4 4 0 0 1 0 8c-5 0-7-8-12-8a4 4 0 1 0 0 8"
        stroke={monochrome ? "currentColor" : "url(#infinity-gradient)"}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
