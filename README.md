# AI-StudyMate 🎓

**Your AI-powered study companion.**

AI-StudyMate is a customized version of the open-source PageLM project, designed to make studying more interactive with AI-powered learning tools.

Upload study materials, ask questions, create quizzes, generate flashcards, organize notes, and explore other learning tools in one place.

## ✨ Features

- **AI Chat:** Ask questions and interact with your study materials.
- **Smart Notes:** Generate structured study notes.
- **Flashcards:** Create flashcards for revision.
- **Quizzes:** Test your understanding with interactive quizzes.
- **AI Podcasts:** Turn learning material into audio.
- **Voice Transcription:** Convert recordings into searchable study material.
- **Homework Planner:** Organize homework and study tasks.
- **ExamLab:** Practise exam-style questions.
- **Debate:** Improve critical thinking through AI discussions.
- **Study Companion:** Get assistance while learning.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, TypeScript |
| Backend | Node.js, TypeScript |
| Styling | Tailwind CSS |
| AI Integration | LangChain and supported LLM providers |
| Database | JSON by default, optional vector database |

## 🚀 Getting Started

### Prerequisites

- Node.js **22.23.4** (see `.nvmrc`)
- npm
- Git
- [Ollama](https://ollama.com/) for the default local AI configuration

### 1. Clone the repository

```bash
git clone https://github.com/Yogesh18072005/AI-StudyMate.git
cd AI-StudyMate
```

### 2. Install dependencies

Run these commands from the project root:

```bash
npm install
npm install --prefix frontend
```

### 3. Configure environment variables

Create your local environment file:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

The example configuration uses Ollama locally by default. Make sure Ollama is running, then download the configured chat and embedding models once:

```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

If you choose a hosted AI provider instead, update the relevant provider and API-key settings in `.env`. Hosted providers may incur usage charges.

**Never commit your `.env` file or share API keys.**

### 4. Start the backend

From the project root:

```bash
npm run dev
```

Backend address: `http://localhost:5000`

### 5. Start the frontend

Open a second terminal at the project root:

```bash
npm run dev --prefix frontend
```

Frontend address: `http://localhost:5173`

Open the frontend address in your browser.

### Optional: use the setup script

- Windows PowerShell: `./setup.ps1`
- macOS/Linux: `bash ./setup.sh`

The scripts install both dependency sets, create `.env` if it is missing, and start the backend and frontend.

## 🧪 Validation

Run backend tests and build from the project root:

```bash
npm test
npm run build
```

Run frontend lint and production build:

```bash
npm run lint --prefix frontend
npm run build --prefix frontend
```

## 🤖 Supported AI Providers

The codebase supports integrations including:

- Google Gemini
- OpenAI
- Anthropic Claude
- xAI Grok
- Ollama
- OpenRouter

Provider availability depends on configuration and credentials. Local Ollama inference does not require a hosted LLM API key, but it does require the models to be downloaded on your computer.

## 📁 Project Structure

```text
AI-StudyMate/
├── backend/
├── frontend/
│   ├── public/
│   └── src/
├── .env.example
├── package.json
└── README.md
```

## 🎯 Project Goal

The goal of AI-StudyMate is to provide students with a single platform for understanding concepts, organizing study material, practising questions, and improving their learning experience with AI.

## 🙏 Original Project & Credits

AI-StudyMate is based on **PageLM**, originally developed by [CaviraOSS](https://github.com/CaviraOSS/PageLM).

This repository contains personal customization and modifications built on top of the original project.

Please refer to the original repository for upstream updates and acknowledgements.

Original repository: https://github.com/CaviraOSS/PageLM

## 📜 License

The original project is distributed under the CaviraOSS Community License.

Please retain and follow the original `LICENSE.md` terms. Commercial use or resale requires prior written permission from CaviraOSS, according to the original project README.

---

**AI-StudyMate — Learn smarter with AI.**
