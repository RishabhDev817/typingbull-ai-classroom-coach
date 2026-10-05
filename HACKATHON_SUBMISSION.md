# 🐂 TypingBull AI Classroom Coach
> **Turn Classroom Typing Into a Closed-Loop, AI-Adaptive Learning System**  
> *Submitted to ForgeHacks Online 2026*  
> **Repository:** [https://github.com/RishabhDev817/typingbull-ai-classroom-coach](https://github.com/RishabhDev817/typingbull-ai-classroom-coach)

---

## 📌 Executive Summary

**TypingBull AI Classroom Coach** transforms school computer labs and touch-typing classrooms from static, disconnected exercises into a **real-time, closed-loop AI instructional intelligence system**.

Powered by Google Gemini and a zero-latency telemetry engine, it analyzes student keystroke errors during synchronized classroom sessions, immediately equips students with personalized micro-coaching, provides teachers with actionable pedagogical debriefs, synthesizes targeted adaptive drills on the fly, and launches the next round back to the class in a single click—without student logouts, room recreation, or page refreshes.

---

## 🛑 Problem Statement

Touch typing is a foundational 21st-century digital literacy skill, yet how it is taught in schools remains fundamentally broken:

1. **One-Size-Fits-All Drills:** Every student in a computer lab is assigned the exact same static paragraph, regardless of whether a student struggles with top-row pinky reaches (`P`, `Q`) or home-row anchors (`F`, `J`).
2. **Educator Blind Spots:** A teacher managing 25–30 students cannot watch every screen or manually compute error clusters across thousands of live keystrokes.
3. **Superficial Student Feedback:** Traditional typing tools only show a vanity score (e.g., "42 WPM, 88% Accuracy") at the end of a round. Students receive no diagnostic insight on *why* they slipped or *which* specific finger transitions need attention.
4. **Actionless Class Data:** After a test concludes, teachers have no automated pedagogical summary to guide the immediate next 5 minutes of instruction.
5. **Disconnected Practice Loops:** When remedial practice is needed, teachers must manually search for or write new drills, disrupting classroom momentum and disengaging learners.

---

## 💡 Solution

**TypingBull AI Classroom Coach** solves this by establishing a continuous **closed-loop feedback cycle**:

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

The system does not replace the teacher or the classroom—it acts as an **instructional co-pilot**, converting raw student effort into real-time teaching intelligence and immediate remedial action.

---

## 🤖 What Makes It AI-Powered

TypingBull integrates **Google Gemini** at three distinct, high-impact touchpoints in the classroom lifecycle:

### 1. 🧑‍🎓 Personalized Student AI Micro-Coach (`POST /api/classroom/student-coach`)
* **Trigger:** Mounts instantly when a student finishes their typing test.
* **Input Metrics:** Numerical speed (WPM), accuracy %, completion status, weak-key reach list, top errors, target WPM benchmark, and time elapsed.
* **Pedagogical Intelligence:**
  * If a student exhibits high accuracy (≥ 90%) but lower speed, the AI praises keystroke precision and gently encourages increasing rhythm without rushing.
  * If a student exhibits high speed but low accuracy (< 85%), the AI praises typing velocity and advises easing the pace by 5 WPM to clean up reach accuracy.
* **Actionable Visual Keycaps:** Highlights 1–3 specific physical keys (e.g., `[P]`, `[B]`) that caused slips, giving the learner an immediate focus target.
* **Non-Blocking & Deterministic Failover:** The local scorecard renders instantly (zero latency). If the network or AI service is rate-limited, an internal deterministic rule engine generates positive, metric-grounded coaching advice immediately.

### 2. 👩‍🏫 AI Classroom Debrief (`POST /api/classroom/debrief`)
* **Trigger:** Generated on demand by the teacher upon session conclusion.
* **Classroom-Wide Synthesis:**
  * **Class Health Score (0–100):** A single holistic indicator of classroom readiness calculated against speed benchmarks, accuracy targets, and completion rates.
  * **Key Takeaway:** An executive 1-sentence pedagogical summary for the teacher.
  * **Empirical Priority Areas:** Detects collective reach failure patterns (e.g., *"Top-Row Left/Right Pinky Reaches (P, Q)"*) and reports the exact count of affected students.
  * **Instructional Cohort Grouping:** Automatically categorizes participating students into meaningful instructional cohorts (*Velocity Masters*, *Precision Anchors*, *Developing Typists*, *Needs Support*).
  * **Recommended Action:** Concrete instructional advice for what to teach or drill next.

### 3. 🎯 AI Adaptive Drill Synthesizer (`POST /api/classroom/adaptive-drill`)
* **Trigger:** Clicked directly from the debrief recommendation.
* **Dynamic Synthesis:** Gemini engineers a custom practice passage specifically designed to challenge the observed error keys (e.g., dense combinations of `P` and `B` embedded in natural sentence fluency or targeted word structures).
* **Educator Preview & Control:** The teacher inspects the synthesized title, rationale, focus keycaps, difficulty level (*Foundational*, *Targeted*, or *Advanced*), duration, target WPM, student instructions, and the full typing passage.
* **Seamless Class Launch:** Clicking **"Launch to Class"** sends the drill through the existing WebSocket `updateSettings` pipeline. Connected students are seamlessly placed into the lobby with the new drill active—ready for the next synchronized round.

---

## ⚡ Key Features

* **Zero-Login, Zero-Friction Classroom:** Privacy-first design requiring no student accounts, emails, passwords, or stored profiles.
* **Instant 6-Character Room Codes:** Teachers create rooms instantly; students join on Chromebooks, tablets, or laptops in seconds.
* **Real-Time WebSocket State Synchronization:** Sub-10ms synchronization for countdowns, race starts, student progress bars, and completion events.
* **Teacher Live Monitoring Dashboard:** Real-time visibility into every student's active WPM, accuracy %, character position, and completion status.
* **Automated Weak-Key Telemetry:** Computes key-by-key error rates and error frequencies per session without storing keylogs.
* **One-Click Adaptive Drill Launch:** Teachers transition the entire room from Round 1 results to Round 2 practice without recreation or link resharing.
* **Multi-Round Telemetry Isolation:** State machine cleanly resets student telemetry on new rounds, preventing previous error data from contaminating new drill results.
* **Deterministic Fallback Engine:** Built-in rule-based generators guarantee that students and teachers receive valid feedback and adaptive drills even if Gemini is completely offline.
* **Zero Client API Key Exposure:** All generative AI calls are handled through secure server-side proxies and serverless functions.

---

## 🏛️ Technical Architecture

TypingBull is architected with a separation between real-time socket communication and asynchronous AI services:

```text
[ Browser Clients (Teacher & Students) ]
                  │
                  ▼ WebSocket (/classroom-ws)
[ ClassroomServer.ts & ClassroomManager.ts (In-Memory Room State) ]
                  │
                  ├── State Machine: WAITING ──► STARTING ──► ACTIVE ──► FINISHED
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

### Core Architectural Components:
1. **Frontend (`React 19` + `TypeScript 6` + `Vite 8` + `Tailwind CSS v4`):**
   * High-contrast, responsive interface with accessible ARIA live-regions.
   * `ClassroomTypingArea.tsx`: Zero-latency local keystroke engine with instant visual and audio feedback.
   * `StudentAIMicroCoachCard.tsx`: Non-blocking feedback card with request fingerprinting to prevent duplicate fetches.
   * `AIClassroomDebriefCard.tsx`: Teacher analytics card with interactive drill preview and launch controls.
2. **Real-Time Server (`ClassroomServer.ts` & `ClassroomManager.ts`):**
   * Lightweight Node.js WebSocket server managing room lifecycles entirely in memory.
   * State machine coordinates room transitions: `WAITING` → `STARTING` (countdown) → `ACTIVE` (live typing) → `FINISHED` (results) → `WAITING` (next round).
3. **Telemetry Engine (`weakKeyAnalyzer.ts`):**
   * Analyzes session mistake maps against key totals to output prioritized `weakKeys` and `topErrors`.
4. **AI Synthesis & Validation Layer (`server/classroomDebrief.ts`, `server/classroomAdaptiveDrill.ts`, `server/classroomStudentCoach.ts`):**
   * Interacts with Google Gemini via candidate failover (`gemini-2.5-flash` → `gemini-2.5-pro`).
   * Sanitizes all output with `sanitizeDrillText` (stripping markdown, HTML, emojis, and control symbols) to ensure pristine typing text.

---

## 🔒 Privacy & Security Model

TypingBull AI Classroom Coach was intentionally built with an **educational privacy-first stance**:

* **No Database Storage:** No student database or persistent profile store exists. All sessions exist only in memory during the active classroom lifetime.
* **No PII Sent to AI:**
  * **Student Micro-Coach:** Sends *only* numerical metrics (`wpm`, `accuracy`, `weakKeys`, `topErrors`, `timeSpentSec`). Names, student IDs, tokens, emails, and IP addresses are never transmitted.
  * **Classroom Debrief:** Anonymizes all student records into generic aliases (`Student 1`, `Student 2`, etc.) before calling Gemini.
  * **Adaptive Drill:** Receives only aggregated classroom averages and focus key lists.
* **No Raw Keystrokes or Timestamps:** Keystroke timings and keylogs are never sent to AI models; only aggregated error counts and weak keys are evaluated.
* **Server-Side API Key Protection:** `GEMINI_API_KEY` is loaded exclusively through server-side environment variables (`process.env`) and is never included in client JavaScript bundles.
* **Git Cleanliness:** `.env` and local secrets are excluded via `.gitignore`; `.env.example` contains only benign placeholders.

---

## 🔬 Adaptive Learning in Action: Illustrative Walkthrough

The following scenario illustrates the implemented closed-loop behavior during a classroom session:

1. **The Challenge:** A class completes a 60-second baseline typing activity.
2. **Empirical Detection:** Multiple students slip on top-row reaching keys, specifically `P` (right pinky) and `B` (left index reach). The telemetry engine identifies `p` and `b` as the dominant error keys.
3. **Student Feedback:** Student Alex immediately sees Rank #1, 28 WPM, 84.5% Accuracy, and an AI Coach card displaying:
   * *Headline:* "Fast Fingers, Now Dial In Precision!"
   * *Focus Keycaps:* `[P]` `[B]`
   * *Next Step:* "Ease off your speed by 5 WPM on your next round to make sure your P & B reaches land cleanly."
4. **Teacher Debrief:** The teacher clicks "Generate AI Classroom Debrief" and sees:
   * *Class Health Score:* 74 / 100 ("Moderate Mastery")
   * *Priority Area:* "Top & Bottom Row Index/Pinky Reaches (P, B) — 4 students affected."
   * *Instructional Recommendation:* "Conduct a 2-minute accuracy drill reinforcing P and B finger transitions."
5. **Drill Synthesis:** The teacher clicks "Synthesize Adaptive Drill". Gemini produces:
   * *Title:* "P & B Word Precision Drill"
   * *Passage:* *"Bob puts the blue bag beside the desk. Pat placed the purple pen by the big paper pad. The brave puppy barked at the busy brown bus."*
   * *Target Keys:* `P`, `B` | *Target Speed:* 30 WPM
6. **One-Click Launch:** The teacher clicks **"🚀 Launch to Class"**.
7. **Round 2 Execution:** All student screens instantly transition back to the lobby with the new drill loaded. The teacher starts the session, students type the targeted passage, and new telemetry is collected showing increased precision on `P` and `B`!

---

## 🧑‍🎓 The Student Journey

```text
[ Join Classroom ] ──► Enters 6-character room code & chooses avatar emoji
         │
         ▼
[ Classroom Lobby ] ──► Toggles "Ready" status; sees assigned lesson & target keys
         │
         ▼
[ Synchronized Countdown ] ──► 3... 2... 1... GO! (Zero race lag)
         │
         ▼
[ Active Typing Area ] ──► Types target passage; real-time visual caret & audio feedback
         │
         ▼
[ Instant Results Screen ] ──► Immediate rank, WPM, accuracy, and class average comparison
         │
         ▼
[ Your AI Coach Card ] ──► Non-blocking personalized feedback with clear focus keycaps
         │
         ▼
[ Next Round Ready ] ──► Automatically receives adaptive drill for Round 2 without refreshing
```

---

## 👩‍🏫 The Teacher Journey

```text
[ Create Room ] ──► Selects curriculum lesson or passage; receives 6-character room code
         │
         ▼
[ Lobby Roster ] ──► Monitors students joining live & ready indicators
         │
         ▼
[ Start Session ] ──► Triggers synchronized start for all connected devices
         │
         ▼
[ Live Monitoring ] ──► Real-time leaderboard tracking progress, WPM, and accuracy live
         │
         ▼
[ Review Results ] ──► Class averages, student gradebook table, and completion metrics
         │
         ▼
[ AI Classroom Debrief ] ──► 1-click Gemini evaluation of class health & student cohorts
         │
         ▼
[ AI Adaptive Drill ] ──► Synthesizes remediation drill based on observed weak keys
         │
         ▼
[ Launch to Class ] ──► Broadcasts new drill directly to all active students for Round 2
```

---

## 🌟 Why This Matters: Educational Impact

Touch typing is the primary physical interface through which students write essays, take standardized exams, interact with learning management systems, and write code. Yet typing education has remained largely unchanged for twenty years.

* **For Students:** TypingBull replaces blind repetition with deliberate practice. Students learn *why* mistakes happen and focus on 1–2 high-leverage key reaches at a time, accelerating muscle memory formation.
* **For Teachers:** TypingBull eliminates manual grading and guesswork. In 10 seconds, an educator understands the exact pedagogical health of their classroom and has a tailored drill ready to deploy.
* **For Schools:** Zero login overhead means it works out of the box on shared school Chromebook carts with zero privacy liability under student privacy regulations.

---

## 🏆 Hackathon Differentiator: More Than a Typing App

Most typing applications fall into one of two categories:
1. Static solo typing test websites with canned paragraphs.
2. Standard multiplayer racing clones that only report WPM.

**TypingBull AI Classroom Coach is different because it is a closed-loop pedagogical engine:**
* It does not just measure typing; it **diagnoses** learning bottlenecks.
* It does not just display errors; it **synthesizes** custom remedial coursework.
* It does not just give feedback; it **deploys** the next round directly into an active, synchronized classroom.
* It does not break existing infrastructure; it **enhances** real-time WebSocket classrooms with assistive AI intelligence.

---

## 🛠️ Complete Tech Stack

| Domain | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, TypeScript 6, Vite 8 | Ultra-fast client rendering and strict type safety |
| **Styling & Animation** | Tailwind CSS v4, Framer Motion 13 | Responsive design, dark mode, smooth state transitions |
| **Real-Time Sockets** | Node.js `ws`, Cloudflare Durable Objects | Low-latency classroom synchronization and live feeds |
| **Generative AI** | Google Gemini (`@google/generative-ai`) | Classroom debrief, adaptive drill synthesis, student coach |
| **AI Models** | `gemini-2.5-flash`, `gemini-2.5-pro` | Fast synthesis with automatic candidate model failover |
| **Audio & Engine** | Howler.js, custom keystroke analyzer | Tactile keyboard sounds and zero-latency telemetry |
| **Deployment** | Cloudflare Pages, Node.js standalone | Serverless edge functions with standalone local fallback |
| **Code Quality** | Oxlint, TypeScript strict mode | Zero lint errors across 185 files; clean production bundle |

---

## 🎬 3-Minute Hackathon Demo Script (For Judges)

1. **Teacher Setup (0:00 – 0:30):**
   * Open `/classroom` in Browser Window 1 → click **"Create Classroom"** as Teacher.
   * Note the generated 6-character room code (e.g. `8AHYEE`).
2. **Student Joins (0:30 – 1:00):**
   * Open `/classroom` in an Incognito Window → click **"Join Classroom"**.
   * Enter room code and name ("Alex") → toggle **"Ready"**.
   * Teacher's lobby instantly updates with Alex's ready indicator.
3. **Synchronized Round 1 Race (1:00 – 1:45):**
   * Teacher clicks **"Start Session"** → 3-2-1 countdown fires on both screens.
   * Student types; Teacher observes real-time WPM, accuracy %, and progress bars on the live monitoring dashboard.
4. **Student Results & AI Micro-Coach (1:45 – 2:15):**
   * Student finishes → immediate standing card (Rank #1, WPM, Accuracy).
   * Highlight **"Your AI Coach"** card showing personalized metric guidance and highlighted focus keycaps (`[P]`, `[B]`).
5. **Teacher AI Classroom Debrief (2:15 – 2:40):**
   * On Teacher screen, click **"Generate AI Classroom Debrief"**.
   * Point out the **Class Health Score (0–100)**, **Key Takeaway**, **Priority Areas**, and **Instructional Cohort Grouping**.
6. **Adaptive Drill Synthesis & Launch (2:40 – 3:15):**
   * In the debrief, click **"Synthesize Adaptive Drill"**.
   * Review preview (targeted focus keys, instructions, generated practice text).
   * Click **"🚀 Launch to Class"**.
7. **Round 2 Practice (3:15 – 3:30):**
   * Switch to the Student window: show that the student is seamlessly back in the lobby with the newly synthesized adaptive drill loaded—without any page refresh or reconnection!

---

## 🔮 Future Scope

While the current hackathon MVP is fully functional and self-contained, the architecture cleanly supports:
* **Longitudinal Cohort Tracking:** Anonymous session tokens could allow cross-session progress tracking over a multi-week semester.
* **Curriculum Integration Hooks:** Direct export of classroom debrief summaries to Google Classroom or Canvas assignments.
* **Voice-Guided Accessibility:** Text-to-speech narration of AI micro-coaching advice for early readers and visually impaired learners.
* **Gamified Remediation Arenas:** Auto-generating multiplayer mini-game challenges based on synthesized adaptive drill passages.

---

## 📦 Project Repository & Links

* **GitHub Repository:** [https://github.com/RishabhDev817/typingbull-ai-classroom-coach](https://github.com/RishabhDev817/typingbull-ai-classroom-coach)
* **Latest Commit:** `ef7c106` (`feat: add AI classroom coach and adaptive learning loop`)
* **Branch:** `main`
* **Hackathon:** ForgeHacks Online 2026

---

<p align="center">
  <strong>TypingBull AI Classroom Coach</strong> — Transforming computer lab touch-typing into an intelligent, adaptive learning experience.
</p>
