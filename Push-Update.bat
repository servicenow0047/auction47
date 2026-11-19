@echo off
cd /d "%~dp0"
echo ========================================================
echo   Pushing Registration App to new GitHub repository...
echo   Target: https://github.com/servicenow0047/auction47.git
echo ========================================================
echo.
git push -u origin main
echo.
echo ========================================================
echo   Done! Connect this repo in your new Vercel account.
echo ========================================================
pause
