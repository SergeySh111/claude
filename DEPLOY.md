# Инструкция по развертыванию на Railway

## Шаг 1: Инициализация Git репозитория

Если Git еще не инициализирован:

```bash
git init
git add .
git commit -m "Initial commit: Campaign Analyzer with backend AI integration"
```

## Шаг 2: Создание GitHub репозитория

1. Создайте новый репозиторий на GitHub (например, `campaign-analyzer`)
2. Подключите локальный репозиторий:

```bash
git remote add origin https://github.com/your-username/campaign-analyzer.git
git branch -M main
git push -u origin main
```

## Шаг 3: Настройка Railway

1. **Войдите в Railway**: https://railway.app
2. **Создайте новый проект**: "New Project" → "Deploy from GitHub repo"
3. **Выберите репозиторий**: `campaign-analyzer`

## Шаг 4: Настройка переменных окружения в Railway

В настройках проекта Railway → Variables, добавьте:

### Обязательные:
```
OPENAI_API_KEY=sk-ваш-ключ-от-openai
NODE_ENV=production
```

### Опциональные (для полной функциональности):
```
DATABASE_URL=mysql://user:password@host:port/database
PORT=3000
JWT_SECRET=ваш-секретный-ключ
OAUTH_SERVER_URL=https://ваш-oauth-сервер.com
OWNER_OPEN_ID=ваш-openid
```

## Шаг 5: Настройка Build & Start команд

Railway автоматически определит из `package.json`:
- **Build Command**: `pnpm install && pnpm build`
- **Start Command**: `pnpm start`

Если нужно настроить вручную:
- Build: `pnpm install && pnpm build`
- Start: `pnpm start`

## Шаг 6: Деплой

Railway автоматически задеплоит при push в main ветку.

Или запустите вручную:
```bash
git push origin main
```

## Шаг 7: Проверка деплоя

1. **Проверьте логи** в Railway Dashboard → Deployments → Logs
2. **Откройте URL** который Railway предоставил
3. **Протестируйте**:
   - Загрузите CSV файлы
   - Откройте AI sidebar
   - Отправьте вопрос

## Troubleshooting

### Ошибка "OPENAI_API_KEY is missing"
- Убедитесь, что переменная добавлена в Railway Variables
- Проверьте, что значение начинается с `sk-`
- Перезапустите деплой после добавления переменной

### Ошибка сборки
- Проверьте логи сборки в Railway
- Убедитесь, что Node.js версия 18+
- Проверьте, что все зависимости в `package.json`

### Порт не определен
- Railway автоматически устанавливает `PORT` через переменную `$PORT`
- Убедитесь, что сервер использует `process.env.PORT || 3000`

## Проверка работоспособности

После деплоя проверьте:

1. ✅ Главная страница загружается
2. ✅ CSV загрузка работает (`/api/process-summary`, `/api/process-daily`)
3. ✅ AI анализ работает (`/api/ai/analyze`)
4. ✅ Нет ошибок в логах Railway

## Мониторинг

- **Логи**: Railway Dashboard → Deployments → Logs
- **Метрики**: Railway Dashboard → Metrics
- **Переменные**: Railway Dashboard → Variables
