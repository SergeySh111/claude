# Скрипт для связывания проекта с GitHub и Railway
# Запустите после перезапуска терминала (чтобы Git был в PATH)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Настройка связи с GitHub и Railway" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = $PSScriptRoot
Set-Location $projectPath

# Проверка Git
Write-Host "Проверка Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✓ Git найден: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git не найден! Перезапустите терминал после установки Git." -ForegroundColor Red
    Write-Host "Или добавьте Git в PATH вручную." -ForegroundColor Yellow
    exit 1
}

# Инициализация Git репозитория
Write-Host "`nИнициализация Git репозитория..." -ForegroundColor Yellow
if (-not (Test-Path .git)) {
    git init
    Write-Host "✓ Git репозиторий инициализирован" -ForegroundColor Green
} else {
    Write-Host "✓ Git репозиторий уже существует" -ForegroundColor Green
}

# Проверка remote
Write-Host "`nПроверка подключения к GitHub..." -ForegroundColor Yellow
try {
    $remoteUrl = git remote get-url origin 2>$null
    Write-Host "✓ Remote 'origin' уже настроен: $remoteUrl" -ForegroundColor Green
    Write-Host ""
    Write-Host "Текущие remotes:" -ForegroundColor Cyan
    git remote -v
} catch {
    Write-Host "⚠ Remote 'origin' не настроен" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Создайте репозиторий на GitHub:" -ForegroundColor Cyan
    Write-Host "1. Откройте https://github.com/new" -ForegroundColor White
    Write-Host "2. Название: campaign-analyzer" -ForegroundColor White
    Write-Host "3. НЕ добавляйте README, .gitignore или лицензию" -ForegroundColor White
    Write-Host "4. Нажмите 'Create repository'" -ForegroundColor White
    Write-Host ""
    
    $githubUrl = Read-Host "Введите URL вашего GitHub репозитория (например: https://github.com/username/campaign-analyzer.git)"
    
    if ($githubUrl) {
        git remote add origin $githubUrl
        Write-Host "✓ Remote 'origin' добавлен: $githubUrl" -ForegroundColor Green
    } else {
        Write-Host "⚠ Remote не добавлен. Добавьте вручную позже:" -ForegroundColor Yellow
        Write-Host "  git remote add origin https://github.com/your-username/campaign-analyzer.git" -ForegroundColor White
    }
}

# Добавление файлов
Write-Host "`nДобавление файлов в staging..." -ForegroundColor Yellow
git add .
Write-Host "✓ Файлы добавлены" -ForegroundColor Green

# Показать статус
Write-Host "`nСтатус репозитория:" -ForegroundColor Cyan
git status --short

# Создание коммита
Write-Host ""
$createCommit = Read-Host "Создать коммит? (y/n)"
if ($createCommit -eq 'y' -or $createCommit -eq 'Y') {
    $commitMessage = @"
feat: Backend AI integration with OpenAI API

- Add POST /api/ai/analyze endpoint with Zod validation
- Implement server-side OpenAI integration
- Add week hallucination filtering
- Add rate limiting (30 req/min per IP)
- Update frontend to use new backend API
- Remove client-side API key dependency
- Add Railway deployment configuration (nixpacks.toml)
- Fix static file paths for production
"@
    
    git commit -m $commitMessage
    Write-Host "✓ Коммит создан" -ForegroundColor Green
} else {
    Write-Host "⚠ Коммит пропущен. Создайте вручную: git commit -m 'your message'" -ForegroundColor Yellow
}

# Переименование ветки в main
Write-Host "`nНастройка ветки main..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    git branch -M main
    Write-Host "✓ Ветка переименована в 'main'" -ForegroundColor Green
} else {
    Write-Host "✓ Уже на ветке 'main'" -ForegroundColor Green
}

# Push на GitHub
Write-Host ""
$pushToGitHub = Read-Host "Отправить код на GitHub? (y/n)"
if ($pushToGitHub -eq 'y' -or $pushToGitHub -eq 'Y') {
    Write-Host "Отправка на GitHub..." -ForegroundColor Yellow
    try {
        git push -u origin main
        Write-Host "✓ Код успешно отправлен на GitHub!" -ForegroundColor Green
    } catch {
        Write-Host "✗ Ошибка при отправке на GitHub" -ForegroundColor Red
        Write-Host "Возможные причины:" -ForegroundColor Yellow
        Write-Host "- Нужна авторизация (используйте Personal Access Token)" -ForegroundColor White
        Write-Host "- Remote не настроен правильно" -ForegroundColor White
        Write-Host ""
        Write-Host "Выполните вручную: git push -u origin main" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠ Push пропущен. Выполните вручную: git push -u origin main" -ForegroundColor Yellow
}

# Инструкции по Railway
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Следующие шаги для Railway:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Откройте https://railway.app" -ForegroundColor White
Write-Host "2. New Project → Deploy from GitHub repo" -ForegroundColor White
Write-Host "3. Выберите репозиторий: campaign-analyzer" -ForegroundColor White
Write-Host "4. Добавьте переменные окружения:" -ForegroundColor White
Write-Host "   - OPENAI_API_KEY=sk-ваш-ключ" -ForegroundColor Yellow
Write-Host "   - NODE_ENV=production" -ForegroundColor Yellow
Write-Host "5. Railway автоматически задеплоит проект" -ForegroundColor White
Write-Host ""
Write-Host "После этого каждый git push будет автоматически деплоить на Railway!" -ForegroundColor Green
Write-Host ""
