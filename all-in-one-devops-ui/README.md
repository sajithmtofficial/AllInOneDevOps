# All In One DevOps — Dashboard UI

A modern, fully responsive, dark-themed DevOps dashboard built with **React 19,
Vite, Tailwind CSS 4, lucide-react and React Router**. This is a standalone UI
prototype that uses mock data only and does not call the Django backend.

## Run locally

```bash
cd all-in-one-devops-ui
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

## Create the same project from scratch

```bash
npm create vite@latest all-in-one-devops-ui -- --template react
cd all-in-one-devops-ui
npm install
npm install react-router-dom lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

Then:

1. Add `tailwindcss()` to the plugins in `vite.config.js`.
2. Import `tailwindcss` from `@tailwindcss/vite`.
3. Add `@import "tailwindcss";` to `src/index.css`.

## Project structure

```text
all-in-one-devops-ui/
├─ index.html
├─ package.json
├─ vite.config.js
├─ public/
│  └─ favicon.svg
└─ src/
   ├─ main.jsx
   ├─ App.jsx
   ├─ index.css
   ├─ data/
   │  └─ mockData.js
   ├─ pages/
   │  └─ Dashboard.jsx
   └─ components/
      ├─ Layout.jsx
      ├─ Sidebar.jsx
      ├─ Navbar.jsx
      ├─ HeroBanner.jsx
      ├─ StatCard.jsx
      ├─ RecentProjects.jsx
      ├─ RecentActivity.jsx
      ├─ QuickActionCard.jsx
      ├─ PagePlaceholder.jsx
      └─ icons.jsx
```

## Routes

| Route | Page |
| --- | --- |
| `/` | Dashboard |
| `/projects` | Projects placeholder |
| `/editor` | Code Editor placeholder |
| `/git` | Git Repositories placeholder |
| `/docker` | Docker placeholder |
| `/jenkins` | Jenkins placeholder |
| `/cicd` | CI/CD placeholder |
| `/monitoring` | Monitoring placeholder |
| `/logs` | Logs placeholder |
| `/ai-assistant` | AI Assistant placeholder |
| `/settings` | Settings placeholder |

## Features

- Fixed 290px sidebar with grouped navigation and a mobile slide-over drawer.
- Sticky top navbar with search (`Ctrl + K`), theme toggle, notifications and
  account dropdown.
- Live date and clock in the hero banner.
- CSS/SVG laptop illustration with floating Docker, Git, Jenkins and cloud tiles.
- Four stat cards, recent projects, activity timeline and five quick actions.
- Reusable components and all dashboard content stored in `src/data/mockData.js`.
- Keyboard focus states, reduced-motion support and responsive layouts.
