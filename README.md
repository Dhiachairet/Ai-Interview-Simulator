# AI Interview Simulator 🎙️

An AI-powered interview simulation platform that helps candidates prepare for real interviews through realistic, personality-driven interview sessions — built with the MERN stack, Gemini AI, and Vapi AI.

## What is it?

Most interview prep tools give you a list of questions. This one puts you in an actual interview.

Choose your interviewer, answer out loud or in text, and get evaluated on your responses in real time. Four distinct AI interviewer personalities, each designed to simulate a different type of interview you'll face in the real world.

## Interviewer Personalities

| Personality | Style |
|-------------|-------|
| 🤝 **Friendly HR** | Warm, conversational — focuses on soft skills, culture fit, and your story |
| ⚡ **Strict Technical** | No small talk — deep dives into your technical knowledge and code reasoning |
| 🔥 **Stress Tester** | Interrupts, challenges, pushes back — tests how you perform under pressure |
| 📚 **Theoretical Expert** | Academic and precise — probes your understanding of CS fundamentals and concepts |

## Features
- Voice-based interviews powered by Vapi AI
- Real-time response evaluation powered by Google Gemini
- 4 distinct interviewer personalities with unique behavior and tone
- Post-interview feedback and scoring
- Full MERN stack with clean REST API

## Tech Stack
- **Frontend:** React.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Voice AI:** Vapi AI
- **Evaluation AI:** Google Gemini API

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Vapi AI account & API key
- Google Gemini API key

### Setup — Backend
1. Clone the repo
```bash
   git clone https://github.com/Dhiachairet/Ai-Interview-Simulator.git
   cd Ai-Interview-Simulator/backend
```
2. Install dependencies
```bash
   npm install
```
3. Create a `.env` file:
```
   MONGO_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   VAPI_API_KEY=your_vapi_api_key
   PORT=5000
```
4. Start the server
```bash
   npm run dev
```

### Setup — Frontend
1. Navigate to the frontend folder
```bash
   cd ../frontend
```
2. Install dependencies
```bash
   npm install
```
3. Create a `.env` file:
```
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_VAPI_PUBLIC_KEY=your_vapi_public_key
```
4. Start the app
```bash
   npm start
```
