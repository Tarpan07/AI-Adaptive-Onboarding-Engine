# SkillMap — AI-Adaptive Onboarding Engine

An AI-driven learning engine that parses a new hire's resume and a target job description, identifies skill gaps, and generates a personalized learning roadmap.

---

## Project Structure

```
skillmap/
├── backend/          # Django REST API
│   ├── skillmap_api/ # App — views, settings, urls
│   ├── requirements.txt
│   ├── manage.py
│   ├── Dockerfile
│   └── .env.example
├── frontend/         # React UI
│   ├── src/
│   │   ├── components/
│   │   ├── styles/
│   │   ├── services/  # API calls to Django
│   │   └── data/
│   ├── Dockerfile
│   └── .env.example
└── docker-compose.yml
```

---

## Quick Start (Docker)

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd skillmap

# 2. Set up backend env
cp backend/.env.example backend/.env
# Edit backend/.env and add your Anthropic API key

# 3. Set up frontend env
cp frontend/.env.example frontend/.env

# 4. Run everything
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

---

## Manual Setup (without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install

cp .env.example .env
# REACT_APP_API_URL=http://localhost:8000

npm start
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health/` | Health check |
| POST | `/api/analyze/` | Analyze resume vs JD |

### POST /api/analyze/

**Request:**
```json
{
  "resume_text": "Jane Smith, 5 years Python...",
  "jd_text": "We are looking for an ML Engineer..."
}
```

**Response:**
```json
{
  "candidate_name": "Jane Smith",
  "role_title": "Machine Learning Engineer",
  "match_percent": 52,
  "skills_have": [{"name": "Python", "level": "advanced"}],
  "skills_gap": [{"name": "PyTorch", "priority": "high"}],
  "skills_partial": [{"name": "scikit-learn", "note": "Basic exposure only"}],
  "roadmap": [
    {
      "title": "Deep Learning Foundations",
      "description": "...",
      "priority": "high",
      "duration_weeks": 4,
      "tags": ["PyTorch", "Neural networks"]
    }
  ]
}
```

---

## Skill Gap Analysis Logic

1. **Parsing** — The resume and JD are sent to Claude (claude-sonnet-4) via the Anthropic API with a structured prompt requesting JSON output.

2. **Skill Extraction** — Claude extracts:
   - Skills present in the resume with proficiency level
   - Skills required by the JD
   - Partial matches (skill present but below required level)

3. **Gap Scoring** — Each missing skill is assigned a priority (high/medium/low) based on how prominently it appears in the JD requirements.

4. **Adaptive Pathing** — The roadmap is ordered by:
   - Priority (high gaps first)
   - Dependency order (foundational skills before advanced ones)
   - Estimated duration (shorter wins listed early for momentum)

5. **Match Percentage** — Calculated as: `(matched skills / total required skills) × 100`, adjusted for partial matches at 50% weight.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, CSS Modules |
| Backend | Django 4.2, Django REST Framework |
| AI | Anthropic Claude (claude-sonnet-4) |
| Containerization | Docker, Docker Compose |

---

## Dependencies

### Backend
- `django` — web framework
- `djangorestframework` — REST API toolkit
- `django-cors-headers` — CORS for React ↔ Django
- `anthropic` — official Anthropic Python SDK
- `python-dotenv` — environment variable loading
- `gunicorn` — production WSGI server

### Frontend
- `react` — UI library
- `react-scripts` — CRA build tooling

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `DJANGO_SECRET_KEY` | Django secret key (any random string) |
| `DEBUG` | `True` for development, `False` for production |

### Frontend (`frontend/.env`)
| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Django backend URL (default: `http://localhost:8000`) |
