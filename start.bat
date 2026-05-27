@echo off
echo Starting Lovable Ops Hub...

echo Starting Django Backend...
start cmd /k "cd backend && call ..\.venv\Scripts\activate 2>nul || echo Virtual env not found, relying on global Python... && python manage.py runserver"

echo Starting React Frontend...
start cmd /k "cd frontend && npm run dev"

echo Both servers are starting up. Please check the new terminal windows!
pause
