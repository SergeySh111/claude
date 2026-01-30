# Команды Git для размещения проекта

## Важно: Перезапустите терминал после установки Git!

После установки Git нужно перезапустить PowerShell/терминал, чтобы PATH обновился.

## Шаг 1: Перейдите в папку проекта

```powershell
cd c:\Users\sergey.sh\Downloads\campaign-analyzer
```

## Шаг 2: Инициализация Git (если еще не сделано)

```powershell
git init
```

## Шаг 3: Добавьте все файлы

```powershell
git add .
```

## Шаг 4: Проверьте статус

```powershell
git status
```

Вы должны увидеть список файлов, готовых к коммиту.

## Шаг 5: Создайте коммит

```powershell
git commit -m "feat: Backend AI integration with OpenAI API

- Add POST /api/ai/analyze endpoint with Zod validation
- Implement server-side OpenAI integration
- Add week hallucination filtering
- Add rate limiting (30 req/min per IP)
- Update frontend to use new backend API
- Remove client-side API key dependency
- Add deployment documentation"
```

## Шаг 6: Создайте репозиторий на GitHub

1. Откройте https://github.com/new
2. Название: `campaign-analyzer`
3. Описание: "Campaign Performance Analyzer with AI-powered insights"
4. Выберите Public или Private
5. НЕ добавляйте README, .gitignore или лицензию (у нас уже есть)
6. Нажмите "Create repository"

## Шаг 7: Подключите локальный репозиторий к GitHub

```powershell
git remote add origin https://github.com/ваш-username/campaign-analyzer.git
```

Замените `ваш-username` на ваш GitHub username.

## Шаг 8: Переименуйте ветку в main (если нужно)

```powershell
git branch -M main
```

## Шаг 9: Отправьте код на GitHub

```powershell
git push -u origin main
```

Если GitHub попросит авторизацию:
- Используйте Personal Access Token (не пароль)
- Или настройте SSH ключи

## Альтернатива: Используйте готовый скрипт

Запустите PowerShell скрипт (после перезапуска терминала):

```powershell
cd c:\Users\sergey.sh\Downloads\campaign-analyzer
.\git-setup.ps1
```

## Проверка

После успешного push проверьте на GitHub:
- Все файлы загружены
- README.md отображается
- Код виден в репозитории

## Следующий шаг: Деплой на Railway

После того как код на GitHub:
1. Откройте https://railway.app
2. New Project → Deploy from GitHub repo
3. Выберите `campaign-analyzer`
4. Добавьте переменные окружения (см. DEPLOY.md)
