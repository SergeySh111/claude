# Как связать проект с GitHub для автоматического деплоя на Railway

## Быстрый способ (рекомендуется)

### 1. Перезапустите терминал
После установки Git **обязательно перезапустите PowerShell**, чтобы Git появился в PATH.

### 2. Запустите скрипт
```powershell
cd c:\Users\sergey.sh\Downloads\campaign-analyzer
.\setup-github-railway.ps1
```

Скрипт проведет вас через все шаги интерактивно.

---

## Ручной способ (если скрипт не работает)

### Шаг 1: Инициализация Git

```powershell
cd c:\Users\sergey.sh\Downloads\campaign-analyzer
git init
git add .
git commit -m "Initial commit: Campaign Analyzer with backend AI integration"
```

### Шаг 2: Создайте репозиторий на GitHub

1. Откройте https://github.com/new
2. Название: `campaign-analyzer`
3. **НЕ добавляйте** README, .gitignore, лицензию
4. Нажмите "Create repository"
5. Скопируйте URL репозитория (например: `https://github.com/your-username/campaign-analyzer.git`)

### Шаг 3: Подключите к GitHub

```powershell
git remote add origin https://github.com/ваш-username/campaign-analyzer.git
git branch -M main
git push -u origin main
```

Если GitHub попросит авторизацию:
- Используйте **Personal Access Token** (не пароль)
- Или настройте SSH ключи

### Шаг 4: Подключите Railway

1. Откройте https://railway.app
2. Войдите через GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Выберите `campaign-analyzer`
5. Railway автоматически начнет деплой

### Шаг 5: Добавьте переменные окружения в Railway

Railway Dashboard → **Variables** → Добавьте:
```
OPENAI_API_KEY=sk-ваш-ключ
NODE_ENV=production
```

---

## После настройки

Теперь каждый раз, когда вы делаете изменения:

```powershell
# 1. Добавить изменения
git add .

# 2. Создать коммит
git commit -m "описание изменений"

# 3. Отправить на GitHub (Railway автоматически задеплоит!)
git push
```

**Railway автоматически обнаружит изменения и задеплоит новую версию!**

---

## Проверка статуса

```powershell
# Проверить статус Git
git status

# Посмотреть подключенные remotes
git remote -v

# Посмотреть последние коммиты
git log --oneline -5
```

---

## Troubleshooting

### Git не найден
- Перезапустите терминал
- Проверьте установку Git: `where.exe git`

### Ошибка авторизации GitHub
- Используйте Personal Access Token вместо пароля
- Или настройте SSH: `ssh-keygen -t ed25519 -C "your_email@example.com"`

### Railway не деплоит
- Проверьте логи в Railway Dashboard
- Убедитесь, что переменные окружения установлены
- Проверьте, что код действительно на GitHub (откройте репозиторий в браузере)
