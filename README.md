# AI Interview Simulator 🎙️

An intelligent interview preparation platform that puts you in a real interview scenario — powered by Gemini AI and Vapi AI voice technology.

## What is it?

Most interview prep tools give you a list of questions. This one actually interviews you.

Pick a job title or upload your CV, choose your interviewer, and get put through a full voice-based interview session. When it's over, Gemini AI breaks down your performance with detailed feedback so you know exactly what to improve.

## Interviewers

Four distinct personalities, each designed to simulate a different real-world interview scenario:

| Interviewer | Style |
|-------------|-------|
| 🤝 **Friendly HR** | Warm and conversational, focuses on culture fit and soft skills |
| 🔬 **Strict Technical** | No small talk, deep dives into your technical knowledge |
| 🔥 **Stress Tester** | Interrupts, challenges your answers, tests how you handle pressure |
| 📚 **Theoretical Expert** | Heavy on concepts, algorithms, and academic depth |

## Key Features

- 🎤 **Voice-based interviews** powered by Vapi AI — speak your answers, not type them
- 📄 **CV-tailored interviews** — upload your resume and the questions adapt to your background
- 🔍 **Job title mode** — pick any role and get interviewed for it on the spot
- 🧠 **AI-powered feedback** — Gemini evaluates your answers and gives a detailed performance breakdown
- 👥 **4 interviewer personalities** — each one tests something different

## Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **AI Evaluation:** Google Gemini API
- **Voice Engine:** Vapi AI
- **Full Stack:** MERN

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Gemini API key — [get one here](https://makersuite.google.com/app/apikey)
- Vapi AI account — [sign up here](https://vapi.ai)

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
