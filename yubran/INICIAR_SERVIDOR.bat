@echo off
where py >nul 2>nul
if %errorlevel%==0 (
  start "NovaAdmin CR" http://localhost:8000
  py -m http.server 8000
) else (
  echo No se encontro Python. Abra el proyecto con Live Server en VS Code.
  pause
)
