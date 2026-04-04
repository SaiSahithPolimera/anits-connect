@echo off
cd /d "%~dp0.."
echo Running CSM Placement Data Extraction...
node scripts\extractAndProcessCSM.js
echo.
echo Done!
pause
