# dspy2

Small insurance cost prediction app — Python backend (FastAPI) + React frontend (Vite).


**Quickstart — Backend**
Prerequisites: Python 3.10+ recommended.

1. Create and activate a virtualenv:

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

2. Install dependencies and run the API:

```powershell
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload 
```

**Quickstart — Frontend**
Prerequisites: Node 18+ and npm.

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs on Vite (usually at `http://localhost:5173`) and calls the backend API — ensure CORS/ports are configured.

**Data & Large Files**
- `datasets-notebook/*.csv` and `backend/models/` are excluded in `.gitignore`. Do not commit sensitive or large CSVs with PII; use external storage or Git LFS instead.

**Git / Contribution Notes**
- Personal IDE folders (`.vscode/`, `.idea/`) and environment files (`.env`) are ignored.
- See `.gitignore` for the full list of excluded patterns.
