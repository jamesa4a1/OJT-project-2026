# Copilot Instructions for OJT-project-2026

## Project Overview
- This is a full-stack web application using React (frontend) and Node.js/Express (backend).
- The backend connects to a MySQL database, typically managed via XAMPP (Apache + MySQL).
- The project structure includes `src/` for React code, `server.js` for the backend, and `database/seed.sql` for DB setup.

## Key Workflows
- **First-time setup:**
  - Open XAMPP, start Apache and MySQL, then open phpMyAdmin.
  - In PowerShell: `npm install` in the project root.
- **Running the app:**
  - Frontend: `npm start` (http://localhost:3000)
  - Backend: `node server.js` (http://localhost:5000)
- **Database reset/import:**
  - Use phpMyAdmin to drop/import tables as needed. See `README.md` for step-by-step.
- **Testing:**
  - Run `npm test` for frontend tests (React, see `src/App.test.js`).
- **Stopping servers:**
  - Use Ctrl+C in each terminal. Stop XAMPP services via the control panel.

## Conventions & Patterns
- **Frontend:**
  - Components in `src/components/`, pages in `src/pages/`, context in `src/context/`.
  - Uses Tailwind CSS (`tailwind.config.js`, `postcss.config.js`).
- **Backend:**
  - Main entry: `server.js`. Database logic may be inlined or in `database/`.
- **Data flow:**
  - React frontend communicates with backend via REST endpoints (see `server.js`).
  - Backend interacts with MySQL (see `database/seed.sql` for schema).
- **Environment:**
  - Windows/PowerShell is assumed for scripts and paths.
  - XAMPP is required for local DB.

## Integration Points
- **Frontend-backend:**
  - API calls from React to Express (see `src/pages/` for usage).
- **Backend-database:**
  - SQL queries in `server.js` or imported from `database/`.
- **Uploads:**
  - Files stored in `uploads/` (see `uploads/index_cards/`, `uploads/profiles/`).

## Examples
- To start both servers:
  - `npm start` (frontend)
  - `node server.js` (backend)
- To reset DB:
  - Use phpMyAdmin, follow steps in `README.md` > Database Setup.
- To push code:
  - `git add . && git commit -m "message" && git push origin main`

## References
- See `README.md` for detailed setup, troubleshooting, and workflow commands.
- Key files: `server.js`, `src/App.js`, `src/pages/`, `database/seed.sql`, `uploads/`.

---
For more, see the project `README.md` and comments in key files.
