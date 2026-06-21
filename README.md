# AI Interview Simulator 🎙️

> An intelligent interview preparation platform that puts you in a **real interview scenario** — powered by voice AI and generative AI feedback.

🔗 **Live Demo:** [ai-interview-simulator-xi-umber.vercel.app](https://ai-interview-simulator-xi-umber.vercel.app)

---

## What Is It?

Most interview prep tools give you a list of questions. This one actually **interviews you**.

Pick a job title or upload your CV, choose your interviewer persona, and go through a full **voice-based interview session**. When it's over, Gemini AI breaks down your performance with detailed feedback — so you know exactly what to work on.

---

## Interviewers

Four distinct personalities, each simulating a different real-world interview scenario:

| Interviewer | Style |
|---|---|
| 🤝 **Friendly HR** | Warm and conversational — focuses on culture fit and soft skills |
| 🔬 **Strict Technical** | No small talk — deep dives into your technical knowledge |
| 🔥 **Stress Tester** | Interrupts, challenges your answers, tests how you handle pressure |
| 📚 **Theoretical Expert** | Heavy on concepts, algorithms, and academic depth |

---

## Key Features

- 🎤 **Voice-based interviews** powered by Vapi AI — speak your answers, not type them
- 📄 **CV-tailored interviews** — upload your resume and questions adapt to your background
- 🔍 **Job title mode** — pick any role and get interviewed for it on the spot
- 🧠 **AI-powered feedback** — Gemini evaluates your performance with a detailed breakdown
- 👥 **4 interviewer personalities** — each one tests something different

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| AI Evaluation | Google Gemini API |
| Voice Engine | Vapi AI |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- [Gemini API key](https://makersuite.google.com/app/apikey)
- [Vapi AI account](https://vapi.ai)

---

### Backend Setup

```bash
# Clone the repo (pick your fork)
git clone https://github.com/Dhiachairet/Ai-Interview-Simulator.git
# or
git clone https://github.com/FirasBrr/interview-simulator.git

cd <repo-folder>/backend
npm install
```

Create a `.env` file in `/backend`:

```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
VAPI_API_KEY=your_vapi_api_key
PORT=5000
```

```bash
npm run dev
```

---

### Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in `/frontend`:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_VAPI_PUBLIC_KEY=your_vapi_public_key
```

```bash
npm start
```

The app will be available at `http://localhost:3000`.

---

## Project Structure

```
├── backend/
│   ├── routes/         # API routes
│   ├── models/         # MongoDB schemas
│   ├── controllers/    # Business logic
│   └── server.js       # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # App pages
│   │   └── App.js      # Root component
│   └── public/
└── README.md
```

---

## Contributing

This project is maintained across two repositories by two contributors:

- [@Dhiachairet](https://github.com/Dhiachairet) — [Ai-Interview-Simulator](https://github.com/Dhiachairet/Ai-Interview-Simulator)
- [@FirasBrr](https://github.com/FirasBrr) — [interview-simulator](https://github.com/FirasBrr/interview-simulator)

Pull requests are welcome. For major changes, please open an issue first.

---

## License

MIT
