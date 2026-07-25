# GitVerdict — What Your GitHub Actually Says About You

GitVerdict is a full-stack web application that fetches public GitHub profile data (repositories, commit history, readmes, languages) and applies rule-based scoring filters to generate an honest, explanatory verdict report. It helps identify genuine activity, originality, code documentation discipline, and spots signs of rushed work or copy-pasted/one-shot repository dumps.

## Project Structure

```
.
├── backend/                  # Node.js/Express REST API
│   ├── src/
│   │   ├── app.js            # Express app & middleware setups
│   │   ├── index.js          # Server bootstrapper
│   │   ├── config/           # App configuration settings (e.g. GitHub Axios instance)
│   │   ├── routes/           # Endpoint handlers (routing definition)
│   │   ├── controllers/      # API controller functions
│   │   ├── services/         # Integrations (GitHub REST client layer)
│   │   ├── analyzers/        # Scoring rules and grading logic modules
│   │   └── middleware/       # General error handler and protection routes
│   ├── package.json
│   └── .env.example
│
├── frontend/                 # React UI client powered by Vite
│   ├── index.html            # SPA main HTML wrapper
│   ├── src/
│   │   ├── main.jsx          # UI entrance loader
│   │   ├── App.jsx           # Application routing, page states, and layout manager
│   │   ├── index.css         # Main stylesheet with premium glassmorphic variables
│   │   ├── components/       # Custom React UI components (form, scorecards, headers)
│   │   │   └── ui/           # Shared widgets (Buttons, Tooltips, Cards)
│   │   ├── hooks/            # State and API hooks (fetching logic wrapper)
│   │   └── services/         # HTTP request hooks connecting to backend Express API
│   ├── package.json
│   └── vite.config.js
│
├── GitVerdict.md             # Original project description & specifications
├── README.md                 # Main workspace developer guide
└── .gitignore                # Global workspace ignoring rules
```

## Setup & Running Locally

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (Node Package Manager)

### Step 1: Clone and Install Dependencies

Open separate terminals for frontend and backend components.

**Backend Setup:**
```bash
cd backend
npm install
cp .env.example .env
```
*(Optionally provide a `GITHUB_TOKEN` in `backend/.env` to prevent GitHub REST API rate-limiting issues)*

**Frontend Setup:**
```bash
cd frontend
npm install
```

### Step 2: Run Development Servers

**Start the Express API server (Runs on Port 3000):**
```bash
cd backend
npm run dev
```

**Start the Vite Frontend client (Runs on Port 5173):**
```bash
cd frontend
npm run dev
```

Point your browser to `http://localhost:5173` to test the application interface.
