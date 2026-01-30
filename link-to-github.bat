@echo off
chcp 65001 >nul
echo ========================================
echo Связывание проекта с GitHub и Railway
echo ========================================
echo.

cd /d "%~dp0"

echo Проверка Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo [ОШИБКА] Git не найден!
    echo.
    echo Перезапустите терминал после установки Git.
    echo Или запустите PowerShell скрипт: setup-github-railway.ps1
    pause
    exit /b 1
)

echo Git найден!
echo.

echo Инициализация Git репозитория...
if not exist .git (
    git init
    echo Репозиторий инициализирован.
) else (
    echo Репозиторий уже существует.
)
echo.

echo Добавление файлов...
git add .
echo.

echo Статус:
git status --short
echo.

echo ========================================
echo Следующие шаги:
echo ========================================
echo.
echo 1. Создайте репозиторий на GitHub:
echo    https://github.com/new
echo    Название: campaign-analyzer
echo    НЕ добавляйте README, .gitignore, лицензию
echo.
echo 2. После создания репозитория выполните:
echo.
echo    git commit -m "Initial commit"
echo    git remote add origin https://github.com/ваш-username/campaign-analyzer.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. Подключите Railway:
echo    https://railway.app
echo    New Project ^> Deploy from GitHub repo
echo    Выберите campaign-analyzer
echo.
echo 4. Добавьте переменные окружения в Railway:
echo    OPENAI_API_KEY=sk-ваш-ключ
echo    NODE_ENV=production
echo.
echo ========================================
pause
