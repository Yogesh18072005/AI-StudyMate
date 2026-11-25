# AI-StudyMate 🎓

**An AI-powered study companion for learning, revision, and academic productivity.**

AI-StudyMate is a student-focused web application that brings AI-assisted study workflows into one interface, including document-based learning, question answering, revision tools, and study organization.

> **Project maintainer:** [Yogesh18072005](https://github.com/Yogesh18072005)  
> This repository contains my project-specific configuration, branding, documentation, and development work. Original third-party contributions remain credited to their respective authors and are subject to their applicable licenses.

---

## Contents

- [Project at a glance](#project-at-a-glance)
- [Features](#features)
- [Technology stack](#technology-stack)
- [AI providers and processing](#ai-providers-and-processing)
- [Algorithms and technical techniques](#algorithms-and-technical-techniques)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Installation and setup](#installation-and-setup)
- [Run the application](#run-the-application)
- [Validation](#validation)
- [Configuration notes](#configuration-notes)
- [Project structure](#project-structure)
- [Limitations and future work](#limitations-and-future-work)
- [Credits and license](#credits-and-license)

## Project at a glance

| Item | Details |
|---|---|
| Project | AI-StudyMate |
| Domain | Artificial Intelligence / Educational Technology |
| Application type | Web application |
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, TypeScript |
| Styling | Tailwind CSS |
| AI orchestration | LangChain ecosystem |
| Default AI configuration | Local Ollama (configurable) |
| Default embedding/storage mode | `db_mode=json` in the example environment |
| Backend development port | `5000` |
| Frontend development port | `5173` |

## Features

The project README and application are organized around the following learning tools. Availability of individual tools can depend on configuration and connected providers.

- **AI Chat:** Ask questions and interact with learning material.
- **Smart Notes:** Create structured notes from study content.
- **Flashcards:** Prepare revision cards.
- **Quizzes:** Practise and check understanding.
- **AI Podcasts:** Convert learning material into audio.
- **Voice Transcription:** Turn recordings into text-based study material.
- **Homework Planner:** Organize homework and study tasks.
- **ExamLab:** Practise exam-style questions.
- **Debate:** Explore topics through AI-assisted discussion.
- **Study Companion:** Get assistance while studying.

## Technology stack

The following technologies are reflected in the repository's package manifests and environment template.

| Layer | Technologies / libraries | Purpose |
|---|---|---|
| Frontend | React, TypeScript, Vite | User interface and frontend development |
| Routing and UI | React Router, React Markdown | Navigation and Markdown rendering |
| Styling | Tailwind CSS | UI styling |
| Backend | Node.js, TypeScript | Server-side application |
| AI orchestration | LangChain, LangGraph, LangChain integrations | Connecting model providers and AI workflows |
| Document processing | pdf-parse, Mammoth, docxtemplater, pdf-lib | PDF and Word-document processing |
| Text processing | LangChain text splitters, Marked | Text segmentation and content rendering |
| Local AI runtime | Ollama | Run supported language and embedding models locally |
| Storage-related packages | Keyv, @keyv/sqlite | Key-value storage integrations |
| Testing | Vitest | Automated test execution |
| Development tools | Nodemon, ts-node, tsx, ESLint | Development, execution, and code quality |

The exact runtime path and storage backend depend on the application's configuration. The example environment sets `db_mode=json`; do not assume that every optional storage integration is active in every setup.

## AI providers and processing

### Language-model providers

The environment template contains configuration options for:

- Ollama
- Google Gemini
- OpenAI
- Anthropic Claude
- xAI Grok
- OpenRouter
- Requesty
- LiteLLM
- Cheaper Inference
- Atlas Cloud
- Opper
- Runcrate
- MiniMax
- API Route

A provider must be selected and configured with the appropriate credentials or local runtime. Listing a provider here means the repository includes configuration support; it does not mean that provider is active by default.

### Default local configuration

The example environment uses Ollama for chat and embeddings:

```env
LLM_PROVIDER=ollama
EMB_PROVIDER=ollama
OLLAMA_MODEL=llama3.2:3b
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_BASE_URL=http://localhost:11434
```

This local setup avoids a hosted LLM API key for the configured Ollama models. It still requires Ollama to be installed, running, and supplied with the required models.

### Speech and audio integrations

The environment template also contains settings for text-to-speech and transcription providers, including Edge TTS, Google, ElevenLabs, Speech SDK, VoxCPM, OpenAI, and AssemblyAI. The active service depends on the relevant environment settings and credentials.

## Algorithms and technical techniques

The repository includes libraries for model orchestration, text splitting, embeddings, and document extraction. These support the following technical areas:

| Area | Repository-level evidence | Role |
|---|---|---|
| Language-model orchestration | LangChain packages and provider integrations | Connects application workflows to supported LLMs |
| Text splitting | `@langchain/textsplitters` | Supports dividing long text into manageable segments |
| Embeddings | Configurable embedding provider and model settings | Supports converting text into vector representations when used by the configured workflow |
| PDF extraction | `pdf-parse` | Extracts text from PDF documents |
| Word-document extraction | `mammoth` | Extracts content from DOCX documents |
| Audio transcription and speech | Speech/transcription dependencies and provider settings | Supports audio-related study workflows |

**Implementation accuracy note:** The exact retrieval algorithm, chunking strategy, similarity metric, ranking method, and whether a complete Retrieval-Augmented Generation (RAG) pipeline is active must be confirmed from the corresponding source-code path and runtime configuration. They are deliberately not claimed here as specific implemented algorithms without that verification. Do not describe a library dependency alone as proof that a particular algorithm is used end to end.

## Architecture

At a high level, the repository is separated into a frontend and backend:

1. **Frontend:** React application built with Vite; provides the student-facing interface.
2. **Backend:** Node.js and TypeScript application; handles server-side application workflows.
3. **AI integration layer:** LangChain integrations connect supported model and embedding providers.
4. **Document and content processing:** Libraries support PDF/DOCX extraction, text processing, and audio-related workflows.
5. **Configuration and storage:** Environment variables select providers and runtime settings; the example configuration uses JSON mode.

This is a repository-level overview, not a substitute for a verified component diagram. Update it if implementation details change.

## Requirements

- Node.js **22.23.4** (specified in `.nvmrc`)
- npm
- Corepack (ships with supported Node.js releases) and pnpm 10 for the frontend
- Git
- Ollama for the default local AI configuration
- Sufficient memory and disk space for the selected local models

The root package declares Node.js `>=21.18.0`, while `.nvmrc` pins the recommended development version to `22.23.4`.

## Installation and setup

### 1. Clone the repository

```bash
git clone https://github.com/Yogesh18072005/AI-StudyMate.git
cd AI-StudyMate
```

### 2. Install dependencies

Run from the project root. The backend uses npm and the frontend uses the pinned pnpm 10 toolchain:

```bash
npm ci --legacy-peer-deps
corepack pnpm --dir frontend install --frozen-lockfile
```

### 3. Configure environment variables

Create a local environment file.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

Review `.env` and choose the AI providers you intend to use. For the default local setup, install and start [Ollama](https://ollama.com/), then download the configured models:

```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

If you select a hosted provider, add its API key and update the provider/model settings as required. Hosted providers may charge for usage.

**Security:** Never commit `.env`, API keys, service-account files, or other secrets to Git.

## Run the application

Open two terminals in the project root.

**Terminal 1 — backend:**

```bash
npm run dev
```

Backend development address: [http://localhost:5000](http://localhost:5000)

**Terminal 2 — frontend:**

```bash
corepack pnpm --dir frontend dev
```

Frontend development address: [http://localhost:5173](http://localhost:5173)

Open the frontend address in your browser.

### Optional setup scripts

- Windows PowerShell: `./setup.ps1`
- macOS/Linux: `bash ./setup.sh`

The scripts are provided to assist with dependency installation and local setup. Review them before execution if you have customized your environment.

## Validation

Run the backend tests and TypeScript build from the project root:

```bash
npm test
npm run build
```

Run frontend linting and production build:

```bash
corepack pnpm --dir frontend run lint
corepack pnpm --dir frontend run build
```

A successful build or test command does not by itself verify every AI provider or external integration. Test those separately using the provider configuration you plan to demonstrate.



### Run with Docker Compose

Docker Desktop (or another Docker Engine with Compose v2) must be running before these commands. From the repository root, first create your local environment file if it does not exist:

**Windows PowerShell:**

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

Open the frontend at [http://localhost:5173](http://localhost:5173). The backend exposes [http://localhost:5000/healthz](http://localhost:5000/healthz) for a machine-readable liveness check. Compose waits for the backend container health check before starting the frontend. To inspect startup problems:

```powershell
docker compose logs --tail=100```

Stop the containers with:

```powershell
docker compose down
```

The health endpoint confirms that the backend process is responding; it does not prove that an AI provider, model, or external integration is configured correctly. Validate those separately with your chosen provider.

## Configuration notes

- Keep local settings in `.env`; use `.env.example` as the template.
- The example environment selects Ollama for language-model and embedding tasks.
- Hosted model providers require valid credentials and may incur charges.
- Speech generation and transcription use separate provider settings.
- Do not publish private keys, tokens, personal documents, or service-account credentials.

## Project structure

```text
AI-StudyMate/
├── backend/             # Node.js / TypeScript backend
├── frontend/
│   ├── public/          # Static frontend assets
│   └── src/             # React application source
├── .env.example         # Example configuration (no real secrets)
├── .nvmrc               # Recommended Node.js version
├── package.json         # Backend/root scripts and dependencies
└── README.md
```

## Limitations and future work

Potential areas for further development include:

- Add verified architecture, data-flow, and use-case diagrams.
- Document the actual document retrieval and answer-generation pipeline in detail.
- Add reproducible test cases for document uploads, AI responses, and provider failures.
- Document data retention, privacy, and security behavior.
- Add screenshots and a short demonstration workflow.
- Improve setup guidance for different operating systems and AI providers.
- Add deployment instructions once a supported deployment target is selected.

These are improvement areas, not claims that the functionality is already implemented.

## Project ownership

**AI-StudyMate is owned and maintained by [Yogesh Chhikara](https://github.com/Yogesh18072005).**

Project identity, configuration, documentation, and project-specific development are managed in this repository by the maintainer.

Third-party libraries and services used by the application remain subject to their own applicable terms.

---

**AI-StudyMate — Learn smarter with AI.**

### Backend origin allowlist

The backend uses an explicit CORS allowlist. Set `CORS_ALLOWED_ORIGINS` in your local `.env` to a comma-separated list of exact frontend origins, including the scheme and port. For local development, the template allows:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

For deployment, replace these values with your actual frontend origin(s). Do not use `*` when credentials are enabled. Keep API keys and other secrets in `.env`, which is excluded from Git.
