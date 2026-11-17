# QuizUp AI 🚀

**AI-Powered Learning & Quizzing Platform**

🔗 **Live Demo:** https://quiz-app-gold-sigma.vercel.app/
📂 **GitHub:** https://github.com/AkshatSharma5/Quiz-App

---

## Overview ✨

**QuizUp AI** is an modern AI-powered learning and quizzing platform that combines adaptive quizzes, flashcards, and an AI chatbot into a single interactive ecosystem.

The platform leverages **Google Gemini AI** and **Firebase infrastructure** to deliver personalized learning experiences, gamified engagement, and real-time analytics — helping users track progress and improve performance efficiently.

---

## Key Features ⚡

### 🤖 AI Learning System

* Integrated **Google Gemini API** for AI-powered chatbot assistance
* Adaptive quizzes that adjust difficulty based on performance
* AI-generated improvement suggestions for personalized learning

### 🧠 Interactive Flashcards

* Smart flashcard system for concept reinforcement
* Improves retention and session engagement
* Increased average session duration by **45%**

### 📊 Personalized Dashboard

* Real-time performance analytics using Chart.js
* Visual tracking of learning trends and quiz accuracy
* AI-recommended improvement areas

### 🏆 Gamification Engine

* Global leaderboard and ranking system
* Points engine and performance tracking
* Confetti animations and achievement rewards

### 👥 Community-Driven Quizzes

* Users can create and publish quizzes
* 30+ community quizzes actively played
* Detailed attempt-level statistics and accuracy metrics

### 🔐 Secure Authentication

* Firebase Authentication (Email + OAuth)
* Personalized user profiles
* Protected routes and secure authorization

### ⚡ High-Performance Architecture

* Firebase Firestore + Storage backend
* Real-time analytics with <200ms read latency
* 90+ Lighthouse performance score (mobile + desktop)

<img width="423" height="180" alt="image" src="https://github.com/user-attachments/assets/cfeacf39-a18d-4926-a09d-0a3425c7421f" />


---

## Tech Stack ⚙️

### Backend & Infrastructure

* Firebase Auth
* Firestore Database
* Firebase Storage
* Firebase Analytics

### Frontend

* ReactJS
* TailwindCSS
* ShadCN/UI
* Framer Motion
* Chart.js
* React Router

### AI Integration

* Google Gemini API

### Dev Tools

* Git
* Vercel Deployment
  
---

## Core Functional Modules 🧩

* AI Chatbot Integration
* Advanced Analytics Dashboard
* Streak Challenges
* Adaptive AI Quiz Creator
* Flashcards Learning System
* Leaderboard & Ranking System
* Performance Analytics Dashboard
* Timer & Lives System
* Hint & Cooldown Mechanisms
* Responsive UI & Animations

---

## Installation 👨‍💻

1. **Clone the repository**

   ```bash
   git clone https://github.com/AkshatSharma5/Quiz-App.git
   ```

2. **Navigate to project folder**

   ```bash
   cd Quiz-App
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Run development server**

   ```bash
   npm run dev
   ```

   Add `GEMINI_API_KEY=your_key` to a local `.env` file to enable AI requests. The key is read by the server endpoint and is not included in the browser bundle. The app uses `gemini-3.5-flash-lite` for chatbot answers, generated quizzes, flashcards, explanations, and adaptive practice. Without a configured key or when Gemini is unavailable, the app uses its built-in learning content where available.

---

## Usage ▶️

Open your browser and visit:

👉 http://localhost:3000

Start exploring AI-powered quizzes, flashcards, and personalized learning insights.

---

## Media 📸

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/b797fb1e-77e9-44c4-aae9-7f8cb142373a" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/ec64ccc0-19bb-4f51-8b58-7252882f907e" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/65f66e00-2620-4f7c-9328-9fb9ac5afe4d" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/ec97f6b2-4c58-4f2d-9809-4652f285af68" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/13f71be3-1f04-4eb1-b6a9-d29ec69ca3a6" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/db75448f-fc3a-4c9f-943f-e8d227a83403" />


---

## Contributing 🤝

Contributions are welcome!

1. Fork the repository
2. Create a new branch
3. Commit your changes
4. Submit a pull request

## Adaptive Learning MCP

The adaptive practice flow is available from the **Adaptive** navigation link. It inspects the learner's most recent attempts, ranks topics by accuracy, asks Gemini for focused questions based on the weak topic and recent mistakes, validates the generated choices, and falls back to previous mistakes or the local question bank when Gemini is unavailable. Submitted answers update topic mastery and review dates on the learner profile.

Five validated MCP tools are available at `POST /api/mcp`:

| Tool | Operation |
| --- | --- |
| `retrieve_attempt_history` | Read up to 20 recent attempts and the current revision plan |
| `identify_weak_topics` | Rank topics using answer accuracy and saved mastery |
| `generate_targeted_quiz` | Generate up to 10 focused questions with Gemini, then fall back to stored questions |
| `record_answers` | Store per-question outcomes, including question details for future review |
| `update_revision_plan` | Recalculate mastery and schedule review intervals |

The endpoint uses stateless JSON-RPC over HTTP and supports `initialize`, `ping`, `tools/list`, and `tools/call`. Learner tool calls require a Firebase ID token; the endpoint verifies the token and accesses Firestore with that user's token, so Firestore security rules still apply. For Vercel, configure `GEMINI_API_KEY`, `FIREBASE_PROJECT_ID`, and `FIREBASE_API_KEY` as server environment variables. No `VITE_GEMINI_API_KEY` is used. Without Firebase, the in-app adapter keeps attempts and plans in this browser's local storage.

Tool schemas and bounded execution live in `src/lib/adaptiveCore.js`; the Firebase/local adapters are in `src/lib/adaptiveTools.js`. The workflow allows at most 6 tool calls, 4 logical stages, and 1 retry per tool. It records structured failures and rejects malformed arguments or quiz output. Topic history is retained for the most recent 20 attempts on the learner profile.

Run `npm test` for the six failure scenarios and MCP contract checks. Run `npm run evaluate:adaptive` for a deterministic synthetic comparison with a fixed-topic baseline; the harness reports topic relevance, tool-call success, and workflow completion. This small synthetic set is a development check, not a production learning-outcomes study.

---
