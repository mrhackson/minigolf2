---
applyTo: '**/*.jsx, **/*.js'
description: 'React and JavaScript coding standards and patterns for the Minigolf2 frontend.'
---

# React & JavaScript Development Guidelines

## Project Structure

- **`frontend/src/api/`** — Axios API client (`client.js`); all HTTP calls must go through this module
- **`frontend/src/components/`** — Reusable UI pieces (e.g., `Navbar`); keep these small and focused
- **`frontend/src/context/`** — React context providers (`AuthContext`, `ThemeContext`)
- **`frontend/src/pages/`** — Page-level components (`Dashboard`, `GameView`, `History`, etc.)
- **`frontend/src/utils/`** — Shared utility functions
- Routing is defined in `src/App.jsx` using React Router v6

## Code Style

- Use functional components with hooks throughout; do not use class components
- Use plain `.jsx` files for components; no TypeScript
- Use 2-space indentation
- Use descriptive variable and function names
- Keep components small and focused on a single responsibility
- Do not add inline comments unless they explain non-obvious logic

## API Calls

- **Never** call `axios` directly from components or pages; always import and use the central `api` client from `src/api/client.js`
- The API client automatically attaches the JWT `Authorization: Bearer <token>` header on every request
- The API client automatically retries a request once after refreshing the access token on a 401 response; components do not need to handle token refresh manually
- All backend routes are proxied under `/api`; use relative paths (e.g., `/api/games/`) rather than hardcoded `http://localhost:8000`

## State Management

- Use React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`) for local component state
- Access authentication state (current user, tokens, login/logout) exclusively via `useContext(AuthContext)`
- Access and set the theme exclusively via `useContext(ThemeContext)`
- Do not store JWT tokens in component state; they live in `localStorage` and are managed by `AuthContext`

## Routing (React Router v6)

- Define all routes in `src/App.jsx` using `<Routes>` and `<Route>`
- Use `useNavigate()` for programmatic navigation
- Use `useParams()` to access URL parameters
- Protect authenticated routes by checking `AuthContext` and redirecting to `/login` if unauthenticated

## Component Patterns

- Co-locate API calls in `useEffect` hooks; handle loading and error states with local `useState`
- Use controlled inputs (`value` + `onChange`) for all form fields
- Display user-facing error messages from API responses (e.g., `error.response?.data?.detail`)
- Use `async/await` for all asynchronous operations; wrap in `try/catch` to handle errors gracefully

## Styling

- Global styles are in `src/index.css`
- Theme variants (`default`, `dark`, `midnight`) are applied via CSS classes driven by `ThemeContext`
- Prefer CSS classes over inline styles

## Build Tooling

- The project uses **Vite 5** as the build tool and dev server (port 5173)
- Run `npm run dev` to start the development server
- Run `npm run build` to produce a production build
- Do not add new npm dependencies without checking first; prefer the packages already in `package.json`
