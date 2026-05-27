# Lovable Ops Hub

A full-stack Operations Management Dashboard that seamlessly integrates a modern React frontend with a robust Django REST framework backend. 

## Features
- **Master Data Management**: Setup roles, reporting managers, and departments.
- **CRM & Sales**: Track sales executives, manage territories, and configure distributor linkages.
- **Inventory & POS**: Monitor warehouses, product masters, categories, vendors, and real-time Point of Sale (POS) analytics.
- **Operations Tracking**: Real-time employee tracking, attendance monitoring, geofence alerts, and performance metrics.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn UI
- **Backend**: Python, Django, Django REST Framework, SQLite (Development)

## Prerequisites
- Node.js (v18 or higher recommended)
- Python 3.10+

## Quick Start (Windows)
You can launch both the frontend and backend simultaneously by simply double-clicking the `start.bat` script located in the root directory.

## Manual Setup Instructions

### 1. Backend Setup
Open a terminal in the `backend/` directory:
```bash
# Activate your virtual environment (if you are using one)
# .venv\Scripts\activate

# Install dependencies (if you haven't already)
pip install -r requirements.txt

# Run database migrations (already applied in the latest version)
python manage.py migrate

# Start the Django development server
python manage.py runserver
```
*The backend will be running at `http://127.0.0.1:8000/`*

### 2. Frontend Setup
Open a new terminal in the `frontend/` directory:
```bash
# Install NPM packages (first time only)
npm install

# Start the Vite development server
npm run dev
```
*The frontend will be running at `http://localhost:8080/` (or the port specified in your terminal)*

## Evaluation Notes
- If the backend is turned off, the dashboard features a fallback to local mock data to ensure the UI remains fully navigable.
- All forms in the dashboard (`Master Setup`, `Inventory`, `Sales Executive`, etc.) execute real `POST`/`PATCH` API requests back to the Django server.
