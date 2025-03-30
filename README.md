# Quiz App 

## Overview ✨  
Quiz App is a dynamic platform built with ReactJS that provides engaging quizzes, gamified feedback, and advanced AI features like real-time assistance and translation support. 🚀  

## Features ✨  
- **Responsive UI**: Built with React, Vite, Tailwind CSS, DaisyUI, and Shadcn UI for seamless user experiences.  
- **Interactive Timer**: Countdown timer ⏳ for added challenge and urgency.  
- **Performance Analytics**: Real-time tracking 📊 using Chart.js and react-chartjs-2.  
- **Gamification Effects**: 🎉 Confetti animations (canvas-confetti, react-confetti) to celebrate achievements.  
- **AI Chatbot**: Integrated with @google/generative-ai 🤖 for assistance.  
- **Translation Support**: Google Translate 🌐 integration for multilingual user accessibility.  
- **Cooldown Mechanism**: Prevents rapid inputs for fair play 🛡️.  

## Tech Stack ⚙️  
- **Frontend**: React, Vite, Tailwind CSS, DaisyUI, Shadcn UI  
- **Charts & Analytics**: Chart.js + react-chartjs-2   
- **Animations**: Framer Motion + Canvas Confetti 
- **Routing**: React Router DOM   
- **UI Components**: Radix UI (Dialog, Dropdown Menu, Toasts) 
- **AI & Translation**: @google/generative-ai   

### Core Features Developed:
1. **Gamification Effects** :
   - Implemented celebratory animations using `canvas-confetti` and `react-confetti`.  
   - Added sound effects for correct/incorrect answers using `use-sound`.  

2. **AI Chatbot Integration** :
   - Built an interactive chatbot powered by @google/generative-ai for real-time hints and learning suggestions.  

3. **Quiz Mechanics** :
   - Designed a scoring system based on difficulty levels (Easy: 3pts, Medium: 4pts, Hard: 5pts).  
   - Added a cooldown mechanism (3 minutes) after game-over scenarios to ensure balanced gameplay.  

4. **Performance Metrics Dashboard** :
   - Created real-time analytics using Chart.js to display user progress (correct answers vs incorrect answers).  

5. **Dynamic Timer & Lives System** :
   - Developed a countdown timer with automatic transitions to the next question.  
   - Implemented a lives system (5 lives per session) with visual indicators for user status.  

6. **Hints System**:
   - Added a feature allowing users to reveal correct answers (limited to 3 hints per session).  

7. **Responsive Design & Animations** :
   - Styled the app using Tailwind CSS for responsive layouts.  
   - Enhanced user experience with Framer Motion animations for smooth transitions.

### Additional Contributions:
- Integrated OpenTDB API for fetching quiz questions dynamically 📚.
- Saved user progress locally using `localStorage` for session persistence 🔄.
- Developed a results screen showing final score, accuracy percentage, and time taken ⏱️.

## Installation 👨‍💻✨

1️⃣ **Clone the repository:**  
   git clone https://github.com/AkshatSharma5/Quiz-App.git

2️⃣ **Navigate to the project directory:**  
   cd Quiz-App

3️⃣ **Install dependencies:**  
   npm install

4️⃣ **Run the development server:**  
   npm run dev
## Media
Home Page
![image](https://github.com/user-attachments/assets/b4b87cce-3f62-4540-ae8a-54d694aa25db)
Translation
![image](https://github.com/user-attachments/assets/e011aa55-e93b-4c41-a536-a4a94b31d387)
AI Chatbot (Google Gemini)
![image](https://github.com/user-attachments/assets/684b25c9-d5c0-4a55-9f8f-3ecd26fd275b)
Gamified Quiz
![image](https://github.com/user-attachments/assets/2561c2bf-cd76-4f50-acb9-90ae06707918)
![image](https://github.com/user-attachments/assets/4c76ed59-9df1-4ca5-a192-23bf4b641551)



## Usage 
- Open your browser and navigate to [http://localhost:3000](http://localhost:3000).  
- Start quizzes featuring gamified feedback 🎉, AI-powered hints 🤖, and translation support 🌐.

## Contributing 🤝 
Contributions are welcome! Here’s how you can help 🚀:
1️⃣ Fork the repository 🍴.
2️⃣ Create a new branch for your changes 🌿.
3️⃣ Submit a pull request detailing your improvements 📝.

🎯 Let’s make learning fun together!

