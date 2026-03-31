# Minigolf Application

A full-stack minigolf application with Django backend and React frontend.

## Quick Start

### Prerequisites
- Python 3.8+ with pip
- Node.js 16+ with npm
- Git

### Installation
```bash
# Install dependencies (choose one method):

# Using Makefile (if Make is installed)
make install

# Using PowerShell script 
.\manage.ps1 install

# Using batch file
manage.bat install

# Or manually:
cd backend && pip install -r requirements.txt
cd ../frontend && npm install
```

### Running the Application

Choose one of the following methods to manage your application:

#### Method 1: Makefile (Linux/Mac/Windows with Make)
```bash
# Start both services
make start

# Stop both services  
make stop

# Start individual services
make start-backend    # Django on http://localhost:8000
make start-frontend   # Vite on http://localhost:5173

# Stop individual services
make stop-backend
make stop-frontend

# Check status
make status

# Clean up
make clean

# Help
make help
```

#### Method 2: PowerShell Script (Windows - Recommended)
```powershell
# Start both services
.\manage.ps1 start

# Stop both services
.\manage.ps1 stop

# Start individual services
.\manage.ps1 start-backend    # Django on http://localhost:8000
.\manage.ps1 start-frontend   # Vite on http://localhost:5173

# Stop individual services
.\manage.ps1 stop-backend
.\manage.ps1 stop-frontend

# Check status
.\manage.ps1 status

# Install dependencies
.\manage.ps1 install

# Clean up
.\manage.ps1 clean

# Help
.\manage.ps1 help
```

#### Method 3: Batch File (Windows Simple)
```cmd
# Start both services
manage.bat start

# Stop both services
manage.bat stop

# Start individual services
manage.bat start-backend     # Django on http://localhost:8000
manage.bat start-frontend    # Vite on http://localhost:5173

# Stop individual services
manage.bat stop-backend
manage.bat stop-frontend

# Check status
manage.bat status

# Install dependencies
manage.bat install

# Clean up
manage.bat clean

# Help
manage.bat help
```

## Application URLs

After starting the services:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin

## Architecture

### Backend (Django)
- **Location**: `backend/`
- **Port**: 8000
- **Framework**: Django 5.0+ with Django REST Framework
- **Database**: SQLite (db.sqlite3)
- **Features**: 
  - User authentication with JWT
  - Game management
  - REST API
  - CORS enabled for frontend

### Frontend (React + Vite)
- **Location**: `frontend/`
- **Port**: 5173
- **Framework**: React 18 with Vite
- **Features**:
  - Modern React with hooks
  - React Router for navigation
  - Axios for API communication
  - Context for state management (Auth, Theme)

## Development

### Backend Development
```bash
cd backend

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
python manage.py test

# Access Django shell
python manage.py shell
```

### Frontend Development
```bash
cd frontend

# Run in development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
minigolf/
├── backend/                 # Django backend
│   ├── manage.py           # Django management script
│   ├── requirements.txt    # Python dependencies
│   ├── db.sqlite3         # SQLite database
│   ├── config/            # Django settings
│   ├── accounts/          # User authentication app
│   └── games/             # Game management app
├── frontend/               # React frontend
│   ├── package.json       # Node.js dependencies
│   ├── vite.config.js     # Vite configuration
│   ├── index.html         # Entry HTML file
│   └── src/               # React source code
│       ├── App.jsx        # Main app component
│       ├── components/    # Reusable components
│       ├── pages/         # Page components
│       ├── context/       # React context providers
│       └── api/           # API client
├── Makefile               # Make commands
├── manage.ps1             # PowerShell management script
├── manage.bat             # Batch management script
└── README.md              # This file
```

## Troubleshooting

### Port Issues
If you get port conflicts, you can modify the ports in the management scripts:
- Backend: Change `8000` to your preferred port
- Frontend: Change `5173` to your preferred port

### Process Management
- Use `.\manage.ps1 status` (or equivalent) to check running services
- Use `.\manage.ps1 clean` to forcefully stop all processes and clean up
- On Windows, you can also use Task Manager to manually kill processes if needed

### Dependencies
- Make sure Python and Node.js are installed and in your PATH
- If pip install fails, try upgrading pip: `python -m pip install --upgrade pip`
- If npm install fails, try clearing cache: `npm cache clean --force`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontend and backend
5. Submit a pull request