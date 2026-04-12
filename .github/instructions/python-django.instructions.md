---
applyTo: '**/*.py'
description: 'Django REST Framework coding standards and patterns for the Minigolf2 backend.'
---

# Python & Django Development Guidelines

## Project Structure

- **`backend/config/`** — Django project settings and root URL routing
- **`backend/accounts/`** — User authentication and preferences app
- **`backend/games/`** — Game, player, and score models/views/serializers
- All Django apps follow the standard layout: `models.py`, `views.py`, `serializers.py`, `urls.py`, `tests.py`, `admin.py`

## Code Style

- Follow PEP 8 for all Python code
- Use 4-space indentation; no tabs
- Keep lines to 100 characters or fewer
- Use descriptive variable and function names; avoid single-letter names except for loop counters
- Do not add comments unless they explain non-obvious logic; strive for self-documenting code

## Models (`models.py`)

- Define `__str__` on every model
- Use `class Meta` to set `ordering`, `unique_together`, and `constraints` where appropriate
- Prefer `settings.AUTH_USER_MODEL` over a direct `User` import for `ForeignKey` fields to the user model
- Use `CheckConstraint` (via `models.Q`) to enforce mutually-exclusive nullable FK relationships at the database level
- Use `auto_now_add=True` for creation timestamps; avoid `auto_now` on fields the user may need to set manually
- Always create and commit migrations after changing models (`python manage.py makemigrations`)

## Serializers (`serializers.py`)

- Use `ModelSerializer` for straightforward CRUD; use `Serializer` for custom or non-model data shapes
- Expose `read_only_fields` explicitly in the `Meta` class rather than marking individual fields
- Validate business rules in `validate_<field>()` or `validate()` methods; raise `serializers.ValidationError` with a clear message
- Inject request context via `context={'request': request}` when passing to a serializer that needs it (e.g., `is_creator` checks)
- Pass game context via `context={'game': game}` for serializers that validate against a specific game instance

## Views (`views.py`)

- Keep views thin — delegate business logic to models or serializers, not views
- Use `generics.ListCreateAPIView`, `generics.RetrieveUpdateAPIView`, etc. for standard CRUD endpoints
- Use `APIView` for endpoints with non-standard semantics (e.g., `JoinGameView`, `BulkScoreView`)
- Always filter querysets by the authenticated user: `Game.objects.filter(players__user=request.user)`
- Return `status.HTTP_403_FORBIDDEN` when an authenticated user attempts an action they're not authorised for
- Return `status.HTTP_404_NOT_FOUND` (not 403) when the resource is not found in the user's filtered queryset
- Do not import serializers inside method bodies unless necessary to avoid circular imports

## URL Routing (`urls.py`)

- Namespace accounts routes under `/api/auth/` and games routes under `/api/games/`
- Use `path()` for all URL patterns; avoid `re_path()` unless a regex is truly required

## Authentication

- All endpoints require JWT authentication via `djangorestframework-simplejwt`
- Access tokens expire after 60 minutes; refresh tokens after 7 days
- Do not store secrets in source code; use environment variables in any deployed environment

## Testing (`tests.py`)

- Use Django's `TestCase` for all tests
- Create test users with `User.objects.create_user()`
- Use `self.client.force_login(user)` or JWT headers for authenticated requests in tests
- Test both the success path and common error paths (404, 403, 400) for every view
- Test serializer `validate_*` methods with both valid and invalid inputs

## Error Handling

- Use DRF's built-in exception handling; avoid bare `except` clauses
- Return structured error responses with a `detail` key, consistent with DRF conventions
- Validate game status (`active` vs `completed`) before allowing score or player mutations
