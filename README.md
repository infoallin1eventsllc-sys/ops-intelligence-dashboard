# Ops Intelligence Dashboard# OPS Intelligence Dashboard

A full-stack CRM and operations intelligence dashboard for a luxury event-production business, built with React 19, TypeScript, Firebase Firestore, and a Node/Express backend with Gemini AI woven throughout. It unifies leads, contacts, projects, invoices, subscriptions, tasks, and content into a single real-time workspace — with AI assistance and a one-tap privacy mode for screen sharing.

> Built by Otis Williams

---

## Features

- **Dashboard overview** — KPIs, pipeline analytics, and recent activity across the whole business at a glance.
- **Leads funnel** — track opportunities from New through Won/Lost with values and expected close dates.
- **Client contacts** — a searchable relationship ledger with roles, sources, and interaction recency.
- **Projects** — status board (Planning → In Progress → In Review → Completed) with subtasks, budgets, and deadlines.
- **Kanban task board** — Todo / In Progress / Done with priorities and project links.
- **Invoices** — line items, statuses (Draft/Sent/Paid/Overdue), and outstanding-vs-paid tracking.
- **Subscriptions** — recurring SaaS expenses with monthly-burn and renewal tracking.
- **AI copilot** — Gemini-powered drafting and assistance available throughout the app.
- **Privacy mode** — instantly blurs every name, email, and dollar figure for safe screen sharing.
- **Authenticated access** — email/password login gate with Firestore rules requiring a signed-in user.

---

## Tech Stack

| Layer    | Tools                                                        |
| -------- | ------------------------------------------------------------ |
| Frontend | React 19, TypeScript, Tailwind CSS 4, Recharts, lucide-react |
| Backend  | Node.js, Express, Vite middleware                            |
| Database | Firebase Firestore (real-time listeners)                     |
| AI       | Google Gemini (`@google/genai`) via a server-side proxy      |
| Tooling  | Vite 6, esbuild, tsx, Vitest                                 |

---

## Architecture

The browser never talks to Gemini directly. AI requests go to the Express server (`/api/gemini/generate` and `/api/gemini/search`), which holds the `GEMINI_API_KEY` server-side — keeping the key out of the shipped bundle.

Data is stored in Firestore and streamed with real-time `onSnapshot` listeners so changes appear instantly. All collections are centralized in a single `CRMContext` provider that exposes typed CRUD operations to every component.



---

## Getting Started

**Prerequisites:** Node.js 18+ and a Gemini API key.

```bash
npm install
cp .env.example .env      # add your GEMINI_API_KEY
npm run dev               # http://localhost:3000
npm run dev         # Development (Express + Vite HMR)
npm run build       # Production build
npm start           # Run production build
npm run lint        # Type-check
npm test            # Vitest unit tests
npm run dev         # Development (Express + Vite HMR)
npm run build       # Production build
npm start           # Run production build
npm run lint        # Type-check
npm test            # Vitest unit tests
src/
  App.tsx                   # Layout, navigation, privacy toggle
  firebase.ts               # Firebase initialization
  types.ts                  # Shared TypeScript interfaces
  context/CRMContext.tsx    # Firestore wiring + typed CRUD
  components/               # One component per section
  utils/calculations.ts     # Business logic utilities
server.ts                   # Express + Gemini proxy + static hosting
firestore.rules             # Per-collection security rules
npm run build && npm start

---

Just paste that into the editor you already had open on GitHub and click **Commit changes**. That will make the README fully visible to recruiters immediately.


