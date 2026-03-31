# Minigolf Application Makefile
# Manages both frontend (Vite/React) and backend (Django) services

# Configuration
BACKEND_DIR = backend
FRONTEND_DIR = frontend
BACKEND_PORT = 8000
FRONTEND_PORT = 5173
PID_DIR = .pids

# Colors for output
CYAN = \033[36m
GREEN = \033[32m
YELLOW = \033[33m
RED = \033[31m
NC = \033[0m

# Ensure PID directory exists
$(shell mkdir -p $(PID_DIR) 2>/dev/null || mkdir $(PID_DIR) 2>nul)

.PHONY: help start stop start-backend start-frontend stop-backend stop-frontend install install-backend install-frontend clean status

help: ## Show this help message
	@echo "$(CYAN)Minigolf Application Commands:$(NC)"
	@echo ""
	@echo "$(GREEN)Main Commands:$(NC)"
	@echo "  make start          - Start both frontend and backend"
	@echo "  make stop           - Stop both frontend and backend"
	@echo "  make status         - Check status of both services"
	@echo ""
	@echo "$(GREEN)Individual Service Commands:$(NC)"
	@echo "  make start-backend  - Start Django backend server"
	@echo "  make start-frontend - Start Vite frontend server"
	@echo "  make stop-backend   - Stop Django backend server"
	@echo "  make stop-frontend  - Stop Vite frontend server"
	@echo ""
	@echo "$(GREEN)Setup Commands:$(NC)"
	@echo "  make install        - Install dependencies for both frontend and backend"
	@echo "  make install-backend - Install Python dependencies"
	@echo "  make install-frontend - Install Node.js dependencies"
	@echo ""
	@echo "$(GREEN)Utility Commands:$(NC)"
	@echo "  make clean          - Stop all services and clean up"
	@echo ""

install: install-backend install-frontend ## Install dependencies for both frontend and backend

install-backend: ## Install Python dependencies
	@echo "$(YELLOW)Installing Python dependencies...$(NC)"
	cd $(BACKEND_DIR) && pip install -r requirements.txt
	@echo "$(GREEN)Backend dependencies installed!$(NC)"

install-frontend: ## Install Node.js dependencies
	@echo "$(YELLOW)Installing Node.js dependencies...$(NC)"
	cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)Frontend dependencies installed!$(NC)"

start: start-backend start-frontend ## Start both frontend and backend
	@echo "$(GREEN)Both services started!$(NC)"
	@echo "$(CYAN)Frontend: http://localhost:$(FRONTEND_PORT)$(NC)"
	@echo "$(CYAN)Backend:  http://localhost:$(BACKEND_PORT)$(NC)"

start-backend: ## Start Django backend server
	@if exist "$(PID_DIR)\backend.pid" ( \
		echo "$(YELLOW)Backend appears to be running already. Use 'make stop-backend' first.$(NC)" \
	) else ( \
		echo "$(YELLOW)Starting Django backend...$(NC)" && \
		start /b cmd /c "cd $(BACKEND_DIR) && python manage.py runserver $(BACKEND_PORT) > ../$(PID_DIR)/backend.log 2>&1" && \
		timeout 2 > nul && \
		for /f "tokens=2" %%i in ('tasklist /fi "imagename eq python.exe" /fi "windowtitle eq *manage.py*" /fo csv /nh 2^>nul') do echo %%~i > $(PID_DIR)/backend.pid 2>nul && \
		echo "$(GREEN)Backend started on port $(BACKEND_PORT)$(NC)" \
	)

start-frontend: ## Start Vite frontend server
	@if exist "$(PID_DIR)\frontend.pid" ( \
		echo "$(YELLOW)Frontend appears to be running already. Use 'make stop-frontend' first.$(NC)" \
	) else ( \
		echo "$(YELLOW)Starting Vite frontend...$(NC)" && \
		start /b cmd /c "cd $(FRONTEND_DIR) && npm run dev -- --port $(FRONTEND_PORT) > ../$(PID_DIR)/frontend.log 2>&1" && \
		timeout 2 > nul && \
		for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv /nh 2^>nul ^| findstr vite') do echo %%~i > $(PID_DIR)/frontend.pid 2>nul && \
		echo "$(GREEN)Frontend started on port $(FRONTEND_PORT)$(NC)" \
	)

stop: stop-backend stop-frontend ## Stop both frontend and backend
	@echo "$(GREEN)Both services stopped!$(NC)"

stop-backend: ## Stop Django backend server
	@if exist "$(PID_DIR)\backend.pid" ( \
		echo "$(YELLOW)Stopping Django backend...$(NC)" && \
		for /f %%i in ($(PID_DIR)/backend.pid) do taskkill /pid %%i /f /t >nul 2>&1 && \
		del "$(PID_DIR)\backend.pid" >nul 2>&1 && \
		echo "$(GREEN)Backend stopped$(NC)" \
	) else ( \
		echo "$(YELLOW)Backend is not running$(NC)" \
	)
	@tasklist 2>nul | findstr "python.exe" | findstr "manage.py" >nul && ( \
		echo "$(YELLOW)Found remaining Django processes, terminating...$(NC)" && \
		taskkill /f /im python.exe /fi "windowtitle eq *manage.py*" >nul 2>&1 \
	) || echo >nul

stop-frontend: ## Stop Vite frontend server  
	@if exist "$(PID_DIR)\frontend.pid" ( \
		echo "$(YELLOW)Stopping Vite frontend...$(NC)" && \
		for /f %%i in ($(PID_DIR)/frontend.pid) do taskkill /pid %%i /f /t >nul 2>&1 && \
		del "$(PID_DIR)\frontend.pid" >nul 2>&1 && \
		echo "$(GREEN)Frontend stopped$(NC)" \
	) else ( \
		echo "$(YELLOW)Frontend is not running$(NC)" \
	)
	@tasklist 2>nul | findstr "node.exe" >nul && ( \
		echo "$(YELLOW)Found remaining Node processes, checking for Vite...$(NC)" && \
		tasklist /fi "imagename eq node.exe" /fo csv /nh 2>nul | findstr "vite" >nul && ( \
			taskkill /f /im node.exe /fi "windowtitle eq *vite*" >nul 2>&1 || echo >nul \
		) \
	) || echo >nul

status: ## Check status of both services
	@echo "$(CYAN)Service Status:$(NC)"
	@echo ""
	@echo -n "Backend:  "
	@if exist "$(PID_DIR)\backend.pid" ( \
		for /f %%i in ($(PID_DIR)/backend.pid) do ( \
			tasklist /fi "pid eq %%i" /fo csv /nh 2>nul | findstr "%%i" >nul && ( \
				echo "$(GREEN)Running (PID: %%i)$(NC)" \
			) || ( \
				echo "$(RED)Not running (stale PID file)$(NC)" && \
				del "$(PID_DIR)\backend.pid" >nul 2>&1 \
			) \
		) \
	) else ( \
		echo "$(RED)Not running$(NC)" \
	)
	@echo -n "Frontend: "
	@if exist "$(PID_DIR)\frontend.pid" ( \
		for /f %%i in ($(PID_DIR)/frontend.pid) do ( \
			tasklist /fi "pid eq %%i" /fo csv /nh 2>nul | findstr "%%i" >nul && ( \
				echo "$(GREEN)Running (PID: %%i)$(NC)" \
			) || ( \
				echo "$(RED)Not running (stale PID file)$(NC)" && \
				del "$(PID_DIR)\frontend.pid" >nul 2>&1 \
			) \
		) \
	) else ( \
		echo "$(RED)Not running$(NC)" \
	)
	@echo ""
	@if exist "$(PID_DIR)\backend.pid" echo "$(CYAN)Backend:  http://localhost:$(BACKEND_PORT)$(NC)"
	@if exist "$(PID_DIR)\frontend.pid" echo "$(CYAN)Frontend: http://localhost:$(FRONTEND_PORT)$(NC)"

clean: stop ## Stop all services and clean up
	@echo "$(YELLOW)Cleaning up...$(NC)"
	@if exist "$(PID_DIR)" rmdir /s /q "$(PID_DIR)" >nul 2>&1
	@if exist "$(BACKEND_DIR)\*.pyc" del /s /q "$(BACKEND_DIR)\*.pyc" >nul 2>&1
	@if exist "$(FRONTEND_DIR)\dist" rmdir /s /q "$(FRONTEND_DIR)\dist" >nul 2>&1
	@echo "$(GREEN)Cleanup completed!$(NC)"

# Default target
.DEFAULT_GOAL := help