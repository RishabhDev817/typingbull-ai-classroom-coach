# 🐂 TypingBull AI Classroom Coach

<p align="center">
  <img src="public/favicon.svg" alt="TypingBull Logo" width="96" height="96" />
</p>

<p align="center">
  <strong>AI-Assisted Touch-Typing Classroom Intelligence for Schools & Computer Labs</strong><br />
  <em>Submitted to ForgeHacks Online 2026</em>
</p>

<p align="center">
  <a href="https://github.com/RishabhDev817/typingbull-ai-classroom-coach"><img src="https://img.shields.io/badge/ForgeHacks-2026-8A2BE2?logo=google&logoColor=white" alt="ForgeHacks 2026" /></a>
  <a href="https://github.com/RishabhDev817/typingbull-ai-classroom-coach"><img src="https://img.shields.io/badge/Google_Gemini-Powered-4285F4?logo=google-gemini&logoColor=white" alt="Google Gemini" /></a>
  <a href="https://github.com/RishabhDev817/typingbull-ai-classroom-coach"><img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black" alt="React 19" /></a>
  <a href="https://github.com/RishabhDev817/typingbull-ai-classroom-coach"><img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://github.com/RishabhDev817/typingbull-ai-classroom-coach"><img src="https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://github.com/RishabhDev817/typingbull-ai-classroom-coach"><img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" /></a>
</p>

---

## 💡 What is TypingBull AI Classroom Coach?

**TypingBull AI Classroom Coach** transforms computer lab typing sessions from disconnected drills into a **continuous, data-driven instructional loop**. 

In conventional typing classrooms, teachers watch dozens of typing screens, but identifying which keys are failing across 25–30 students simultaneously is nearly impossible. Students finish a timed test, see a raw WPM score, and move on with the same uncorrected errors.

**TypingBull AI Classroom Coach solves this with Google Gemini AI:**
1. Captures real-time keystroke precision and error distributions during synchronized classroom races.
2. Delivers an immediate, non-intrusive **AI Micro-Coach** to each student with actionable finger-placement advice.
3. Synthesizes a comprehensive **AI Classroom Debrief** for the educator, surfacing class health scores, pedagogical takeaways, and error cohorts.
4. Generates an **AI Adaptive Drill** targeting the classroom's empirical error clusters.
5. Launches the targeted drill back to all connected students with **one click**—without room resets or reloads.

---

## 🔄 The Closed-Loop AI Classroom Workflow

```text
               ┌────────────────────────────────────────────────────────┐
               │              Student Typing Performance                │
               │   (Synchronized WPM, Accuracy, Keystroke Cadence)      │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │             Classroom Telemetry Engine                 │
               │        (Weak-Key Analyzer, Top-Error Clusters)         │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
   ┌───────────────────────────────────┐     ┌───────────────────────────────────┐
   │     Student AI Micro-Coach        │     │       Teacher AI Debrief          │
   │  Personalized encouragement,      │     │  Class health score (0-100),      │
   │  strength recognition & next step │     │  priority areas & student cohorts │
   └───────────────────────────────────┘     └─────────────────┬─────────────────┘
                                                               │
                                                               ▼
                                             ┌───────────────────────────────────┐
                                             │     AI Adaptive Drill Synthesizer │
                                             │  Custom targeted practice passage │
                                             │  focused on observed weak keys    │
                                             └─────────────────┬─────────────────┘
                                                               │
                                                               ▼
                                             ┌───────────────────────────────────┐
                                             │       One-Click Class Launch      │
                                             │  Broadcasts drill to all students │
                                             │  without room reset or reload     │
                                             └─────────────────┬─────────────────┘
                                                               │
                                                               ▼
                                             ┌───────────────────────────────────┐
                                             │   Next Synchronized Typing Round  │
                                             │  Fresh telemetry with zero leaks  │
                                             └───────────────────────────────────┘
```

---

## 🤖 The Three Core AI Capabilities

### 1. 🧑‍🎓 Student AI Micro-Coach (`/api/classroom/student-coach`)
Immediately after finishing a session, students see their standing rank, WPM, and accuracy—accompanied by an empowering, non-blocking **AI Coach Card**:
- **Metric Grounding**: Derived strictly from their WPM, accuracy %, completion status, weak keys, top error reach, target WPM, and elapsed time.
- **Supportive Pedagogical Guidance**:
  - High accuracy + lower speed → Celebrates keystroke precision; gently encourages accelerating tempo.
  - Low accuracy + high speed → Praises velocity; advises pacing down by 5 WPM to clean up reach accuracy.
- **Visual Focus Keys**: High-contrast physical keycaps highlighting the 1–3 keys requiring relaxed reaches.
- **Fail-Safe Operation**: Local results render with zero latency; if offline or rate-limited, an instant deterministic fallback ensures the student always receives constructive coaching.

### 2. 👩‍🏫 AI Classroom Debrief (`/api/classroom/debrief`)
Gives educators immediate pedagogical insight after a class typing activity:
- **Class Health Score**: A holistic 0–100 score reflecting classroom mastery relative to speed benchmarks and accuracy targets.
- **Key Takeaways**: A single impactful sentence summarizing the most urgent learning insight.
- **Classroom Strengths**: Identifies collective positive habits across participating learners.
- **Priority Intervention Areas**: Surfaces error reach clusters (e.g. *Top Row Reaches [P, O]*) with exact counts of affected students.
- **Instructional Cohort Grouping**: Categorizes learners into meaningful instructional groups (*Velocity Masters*, *Precision Anchors*, *Developing Typists*, *Needs Support*).
- **Recommended Action**: Actionable advice for the immediate next instructional step.

### 3. 🎯 AI Adaptive Drill Synthesizer (`/api/classroom/adaptive-drill`)
Turns debrief observations into immediate class-wide remediation:
- **Targeted Synthesis**: Generates customized practice text specifically engineered to reinforce the classroom's observed weak keys (e.g., alternating pinky reach patterns for `P` & `B`).
- **Interactive Preview**: Shows the educator why the drill was synthesized, target WPM, duration, progression layer (*Foundational*, *Targeted*, or *Advanced*), student instructions, and the full passage text.
- **One-Click Instant Launch**: Clicking **"Launch to Class"** dispatches the new activity via WebSocket `updateSettings`, seamlessly resetting student room state to `WAITING` with the new drill active in the lobby.

---

## 🔒 Privacy & Safety Architecture

TypingBull AI Classroom Coach is engineered with a strict **Privacy-First Model**:
- **No Database Required**: All classroom rooms, assignments, and sessions operate entirely in memory. Zero student PII is persisted.
- **No Student Accounts or Passwords**: Students join with a 6-character room code and a chosen first name/display nickname.
- **Zero Student Identity to AI**:
  - The Student AI Micro-Coach receives only numerical performance metrics (`wpm`, `accuracy`, `weakKeys`, `timeSpentSec`). Name, student ID, IP, and session tokens are strictly omitted.
  - The Classroom Debrief anonymizes all students into generic labels (`Student 1`, `Student 2`, etc.) before passing telemetry to Google Gemini.
- **Secure Server-Side API Keys**:
  - `GEMINI_API_KEY` is loaded exclusively server-side via `process.env` in the Vite dev proxy or Cloudflare serverless handlers.
  - Zero API keys are bundled into frontend client code.
- **Text & Prompt Sanitization**:
  - Model outputs pass through `sanitizeDrillText`, which removes code fences, HTML, emojis, and control symbols, ensuring 100% clean typing corpora.

---

## 🏗️ Architecture: AI Enhances, Never Replaces

TypingBull preserves its battle-tested real-time classroom WebSocket pipeline and layers AI intelligence directly on top:

```text
[ Browser Clients (Teacher & Students) ]
                  │
                  ▼ WebSocket (/classroom-ws)
[ ClassroomServer.ts & ClassroomManager.ts (In-Memory Room State) ]
                  │
                  ├── Session State Machine: WAITING ──► STARTING ──► ACTIVE ──► FINISHED
                  ├── Real-Time Broadcasts: STUDENT_PROGRESS, SESSION_FINISHED, ROOM_UPDATED
                  │
                  ▼ Post-Session Telemetry
[ AI Service Layer (Google Gemini / Deterministic Fallbacks) ]
   ├── POST /api/classroom/debrief         --> Generates teacher class debrief
   ├── POST /api/classroom/adaptive-drill  --> Synthesizes targeted practice passage
   └── POST /api/classroom/student-coach   --> Generates student micro-coaching
                  │
                  ▼ Launch Drill (updateSettings)
[ Reset Room to WAITING with new Drill & Telemetry Reset --> Start Round 2 ]
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript 6, Vite 8 |
| **Styling & Motion** | Tailwind CSS v4, Framer Motion 13, Lucide React |
| **Typing Engine** | Custom zero-latency keystroke engine, Howler.js audio |
| **Real-Time Sockets** | Node.js `ws`, Cloudflare Workers & Durable Objects |
| **AI & LLM Services** | Google Gemini 2.5 (`@google/generative-ai`) with candidate failover |
| **Deployment Targets** | Cloudflare Pages (Frontend + Serverless Functions) |
| **Code Quality** | Oxlint, TypeScript Strict Mode |

---

## 🚀 Quickstart: Running Locally

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** or **pnpm**
- A free **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. Clone the Repository
```bash
git clone https://github.com/RishabhDev817/typingbull-ai-classroom-coach.git
cd typingbull-ai-classroom-coach
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```

Open `.env` and insert your Gemini API Key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

*(Note: The platform features deterministic fallback generators for all three AI services, allowing complete testing even without an active API key).*

### 5. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:5173/classroom](http://localhost:5173/classroom) in your browser.

> 💡 **Integrated WebSocket & AI Proxy:** The Vite dev server automatically proxies live classroom WebSockets (`/classroom-ws`) and all AI endpoints (`/api/classroom/*`) without needing a secondary backend process!

---

## 🕹️ Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite dev server with built-in WebSocket & Gemini API proxies |
| `npm run build` | Compiles TypeScript (`tsc -b`) and produces production bundle in `dist/` |
| `npm run preview` | Previews the production bundle locally with WebSocket support |
| `npm run lint` | Runs ultra-fast Oxlint across all TypeScript/JavaScript files |
| `npm run classroom` | Starts standalone Node.js classroom server on port 3002 |
| `npm run deploy` | Builds and deploys the application to Cloudflare Pages |

---

## 🎬 Recommended Hackathon Demo Flow (3–4 Minutes)

1. **Teacher Creates Room:** Open [http://localhost:5173/classroom](http://localhost:5173/classroom), click **"Create Classroom"**, and note the 6-character room code.
2. **Student Joins:** Open an Incognito window, visit [http://localhost:5173/classroom](http://localhost:5173/classroom), click **"Join Classroom"**, enter the code and name ("Alex"), and toggle **"Ready"**.
3. **Round 1 Race:** Teacher clicks **"Start Session"**; watch live student speed and accuracy update on the teacher's live monitor.
4. **Student Micro-Coach:** When Alex finishes, show the instant results and the personalized **"Your AI Coach"** card with focus keys.
5. **Teacher Debrief:** On teacher screen, click **"Generate AI Classroom Debrief"** to view the Class Health Score, Key Takeaways, and Priority Areas.
6. **Adaptive Drill Synthesis:** Click **"Synthesize Adaptive Drill"**, preview the generated passage, and click **"🚀 Launch to Class"**.
7. **Round 2 Practice:** Observe the student window automatically transition back to the lobby with the new drill loaded without a page reload, ready for the next round!

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

<p align="center">
  Built with ❤️ for <strong>ForgeHacks Online 2026</strong>.
</p>
