@echo off
echo ========================================
echo Git Setup for Campaign Analyzer
echo ========================================
echo.

cd /d "%~dp0"

echo Checking Git installation...
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not found in PATH!
    echo Please restart your terminal after installing Git.
    echo Or add Git to PATH manually.
    pause
    exit /b 1
)

echo Git found!
echo.

echo Initializing Git repository...
if not exist .git (
    git init
    echo Git repository initialized.
) else (
    echo Git repository already exists.
)
echo.

echo Adding files to staging...
git add .
echo.

echo Current status:
git status --short
echo.

echo ========================================
echo Ready to commit!
echo ========================================
echo.
echo Run these commands manually:
echo.
echo   git commit -m "feat: Backend AI integration with OpenAI API"
echo.
echo   git remote add origin https://github.com/your-username/campaign-analyzer.git
echo.
echo   git push -u origin main
echo.
pause
