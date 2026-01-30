# Исправление ошибки Railway "Error creating build plan"

## Проблема
Railway не может автоматически определить способ сборки проекта (Error creating build plan with Railpack).

## Решение

Созданы следующие файлы для явной конфигурации:

### 1. `nixpacks.toml`
Явно указывает Railway:
- Использовать Node.js 20
- Использовать pnpm как менеджер пакетов
- Команды для установки, сборки и запуска

### 2. `.node-version`
Указывает версию Node.js (20)

### 3. Исправления в коде:
- Исправлен путь к статическим файлам в production (`dist/public`)
- Сервер слушает на `0.0.0.0` вместо `localhost` (требуется для Railway)

## Что делать дальше:

1. **Закоммитьте изменения**:
```bash
git add nixpacks.toml .node-version server/_core/index.ts server/_core/vite.ts
git commit -m "fix: Add Railway deployment configuration"
git push
```

2. **Railway автоматически перезапустит деплой** после push

3. **Проверьте логи** в Railway Dashboard:
   - Должен появиться этап "Build" с командой `pnpm run build`
   - После сборки должен запуститься `pnpm start`

## Если ошибка сохраняется:

1. **Проверьте переменные окружения** в Railway:
   - `NODE_ENV=production`
   - `OPENAI_API_KEY=sk-...`
   - `PORT` устанавливается автоматически Railway

2. **Проверьте логи сборки**:
   - Railway Dashboard → Deployments → View Logs
   - Ищите ошибки в этапе "Build"

3. **Альтернатива**: Используйте Railway CLI для локальной проверки:
```bash
railway login
railway link
railway up
```

## Структура сборки:

После успешной сборки должны быть созданы:
- `dist/public/` - собранный frontend (Vite)
- `dist/index.js` - собранный backend (esbuild)

Сервер запускается из `dist/index.js` и обслуживает статику из `dist/public/`.
