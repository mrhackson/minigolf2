# GitHub Copilot Instructions

## Project Overview

Minigolf2 is a full-stack web application for managing minigolf games. Players can create games, invite others via a unique code, track scores hole-by-hole, and view game history. Both registered users and ad-hoc guest players are supported.

## Architecture

```
minigolf2/
├── backend/          # Django REST API (port 8000)
│   ├── config/       # Django project settings and URL routing
│   ├── accounts/     # User authentication and preferences
│   └── games/        # Game, player, and score models/views/serializers
├── frontend/         # React + Vite SPA (port 5173)
│   └── src/
│       ├── api/      # Axios API client
│       ├── components/  # Reusable UI components (e.g., Navbar)
│       ├── context/  # React context providers (AuthContext, ThemeContext)
│       └── pages/    # Page-level components (Dashboard, GameView, etc.)
├── Makefile          # Cross-platform task runner
├── manage.ps1        # PowerShell management script (Windows)
└── manage.bat        # Batch management script (Windows)
```

## Tech Stack

### Backend
- **Python / Django 6** with **Django REST Framework**
- **JWT authentication** via `djangorestframework-simplejwt` (60-minute access tokens, 7-day refresh tokens)
- **CORS** via `django-cors-headers` (allowed origin: `http://localhost:5173`)
- **Database**: SQLite (`backend/db.sqlite3`) — suitable for development

### Frontend
- **React 18** with functional components and hooks
- **Vite 5** as the build tool and dev server
- **React Router v6** for client-side routing
- **Axios** for HTTP communication with the backend API
- No TypeScript; plain `.jsx` files throughout

## Key Domain Models (`backend/games/models.py`)

| Model | Purpose |
|---|---|
| `Game` | A minigolf round; has `name`, `num_holes` (default 18), `invite_code` (UUID), and `status` (`active` / `completed`) |
| `GamePlayer` | Links a registered `User` to a `Game` |
| `GuestPlayer` | A named guest player within a `Game` |
| `Score` | Stroke count for one hole; belongs to either a `GamePlayer` **or** a `GuestPlayer` (enforced by a `CheckConstraint`) |

`UserPreferences` (in `accounts/`) stores per-user theme selection (`default`, `dark`, `midnight`).

## API Conventions

- All endpoints require JWT authentication except registration and token endpoints.
- Base URL: `http://localhost:8000`
- Token endpoints follow simplejwt defaults (`/api/token/`, `/api/token/refresh/`).
- App-level routes are namespaced under `/api/accounts/` and `/api/games/`.

## Frontend Conventions

- Authentication state is managed in `AuthContext` (stores JWT tokens and current user).
- Theme state is managed in `ThemeContext`.
- API calls are centralised in `src/api/`; components should not call `axios` directly.
- Pages live in `src/pages/`; reusable UI pieces live in `src/components/`.
- Routing is defined in `src/App.jsx`.

## Development Workflow

```bash
# Install all dependencies
make install          # or: .\manage.ps1 install

# Start both services concurrently
make start            # or: .\manage.ps1 start

# Individual services
make start-backend    # Django on http://localhost:8000
make start-frontend   # Vite on http://localhost:5173

# Backend management (from backend/)
python manage.py migrate
python manage.py createsuperuser
python manage.py test

# Frontend (from frontend/)
npm run dev
npm run build
```

## Coding Guidelines

- **Python**: Follow PEP 8. Keep views thin — business logic belongs in models or serializers.
- **JavaScript/JSX**: Use functional components with React hooks. Keep components small and focused.
- **No secrets in source**: The `SECRET_KEY` in `settings.py` is for local development only; use environment variables in any deployed environment.
- **Migrations**: Always create and commit Django migrations when changing models (`python manage.py makemigrations`).
- **Tests**: Add Django tests in `<app>/tests.py`. Frontend tests are not yet configured.
