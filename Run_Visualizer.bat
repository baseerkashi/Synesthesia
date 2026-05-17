@echo off
echo Starting Aura Music Visualizer...
echo ===================================
call npm install
start http://localhost:5173
call npm run dev
