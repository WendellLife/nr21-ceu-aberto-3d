@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 goto python
node server.mjs
goto end
:python
where python >nul 2>&1
if errorlevel 1 goto missing
echo Abra no navegador: http://127.0.0.1:8765
python -m http.server 8765 --bind 127.0.0.1 --directory dist
goto end
:missing
echo Instale Node.js 18 ou superior, ou Python 3, e execute este arquivo novamente.
:end
pause
