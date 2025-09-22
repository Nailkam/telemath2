# 🚀 Локальный запуск Telegram Dating App в России

## ⚠️ Особенности для российских пользователей

### Проблемы с доступом:
- **npm registry** - может быть заблокирован
- **GitHub** - ограниченный доступ
- **MongoDB Atlas** - может быть недоступен
- **Telegram API** - работает, но могут быть задержки

## 🔧 Решения для локального запуска

### 1. Настройка npm для России

#### Вариант A: Использование российского зеркала
```bash
# Установите российский npm registry
npm config set registry https://registry.npmmirror.com/

# Или используйте Yandex registry
npm config set registry https://registry.yandex-team.ru/

# Проверьте текущий registry
npm config get registry
```

#### Вариант B: Использование Yarn (рекомендуется)
```bash
# Установите Yarn
npm install -g yarn

# Настройте Yarn для работы в России
yarn config set registry https://registry.npmmirror.com/
```

### 2. Альтернативные способы установки зависимостей

#### Способ 1: Через VPN
```bash
# Включите VPN и установите зависимости
npm run install:all
```

#### Способ 2: Ручная установка
```bash
# Установите зависимости по частям
cd server
npm install --registry https://registry.npmmirror.com/
cd ../client
npm install --registry https://registry.npmmirror.com/
cd ..
npm install --registry https://registry.npmmirror.com/
```

#### Способ 3: Использование Yarn
```bash
# Установите все зависимости через Yarn
yarn install
cd server && yarn install
cd ../client && yarn install
cd ..
```

### 3. Настройка MongoDB

#### Вариант A: Локальная установка MongoDB
```bash
# Windows (через Chocolatey)
choco install mongodb

# Или скачайте с официального сайта
# https://www.mongodb.com/try/download/community

# Запустите MongoDB
mongod --dbpath C:\data\db
```

#### Вариант B: Использование Docker
```bash
# Установите Docker Desktop
# Скачайте с https://www.docker.com/products/docker-desktop

# Запустите MongoDB в Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Вариант C: MongoDB Compass (GUI)
```bash
# Скачайте MongoDB Compass
# https://www.mongodb.com/products/compass

# Создайте локальную базу данных
# Подключитесь к mongodb://localhost:27017
```

### 4. Настройка переменных окружения для России

#### server/.env
```env
# Основные настройки
PORT=3001
NODE_ENV=development

# MongoDB (локальная)
MONGODB_URI=mongodb://localhost:27017/telegram-dating

# JWT (сгенерируйте свой секрет)
JWT_SECRET=ваш-супер-секретный-ключ-здесь
JWT_EXPIRES_IN=7d

# Telegram Bot (получите у @BotFather)
TELEGRAM_BOT_TOKEN=ваш-токен-бота
TELEGRAM_WEBHOOK_URL=http://localhost:3001/webhook

# Загрузка файлов
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# CORS (для локальной разработки)
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### client/.env
```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001/api

# Telegram Bot
REACT_APP_TELEGRAM_BOT_TOKEN=ваш-токен-бота

# App Configuration
REACT_APP_APP_NAME=Telegram Dating
REACT_APP_APP_VERSION=1.0.0
REACT_APP_DEBUG=true
```

## 🚀 Пошаговый запуск

### Шаг 1: Подготовка окружения
```bash
# Клонируйте проект (если еще не сделали)
git clone <ваш-репозиторий>
cd telegram-dating-app

# Настройте npm registry
npm config set registry https://registry.npmmirror.com/
```

### Шаг 2: Установка MongoDB
```bash
# Вариант 1: Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Вариант 2: Локальная установка
# Скачайте и установите MongoDB Community Edition
# https://www.mongodb.com/try/download/community
```

### Шаг 3: Установка зависимостей
```bash
# Установите зависимости
npm run install:all

# Или через Yarn
yarn install
cd server && yarn install
cd ../client && yarn install
cd ..
```

### Шаг 4: Настройка конфигурации
```bash
# Скопируйте файлы конфигурации
copy server\env.example server\.env
copy client\env.example client\.env

# Отредактируйте файлы .env с вашими настройками
```

### Шаг 5: Создание Telegram бота
1. Найдите @BotFather в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Сохраните токен в файлы .env

### Шаг 6: Запуск приложения
```bash
# Запустите в режиме разработки
npm run dev

# Или по отдельности
npm run server:dev  # Backend на порту 3001
npm run client:dev  # Frontend на порту 3000
```

## 🔧 Решение проблем

### Проблема: npm install не работает
```bash
# Решение 1: Используйте российский registry
npm config set registry https://registry.npmmirror.com/

# Решение 2: Используйте Yarn
yarn install

# Решение 3: Очистите кэш
npm cache clean --force
```

### Проблема: MongoDB не запускается
```bash
# Проверьте, что MongoDB запущен
net start MongoDB

# Или через Docker
docker start mongodb

# Проверьте подключение
mongo --host localhost --port 27017
```

### Проблема: Telegram бот не отвечает
```bash
# Проверьте токен бота
# Убедитесь, что бот создан через @BotFather
# Проверьте, что Web App настроен правильно
```

### Проблема: CORS ошибки
```bash
# Убедитесь, что в server/.env указаны правильные origins
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## 📱 Тестирование в Telegram

### 1. Настройка Web App
1. Откройте @BotFather
2. Отправьте `/newapp`
3. Выберите вашего бота
4. Укажите URL: `http://localhost:3000` (для тестирования)
5. Добавьте описание

### 2. Тестирование локально
```bash
# Запустите приложение
npm run dev

# Откройте Telegram
# Найдите вашего бота
# Нажмите на кнопку "Web App"
```

### 3. Использование ngrok для внешнего доступа
```bash
# Установите ngrok
npm install -g ngrok

# Запустите туннель
ngrok http 3000

# Используйте полученный URL в настройках бота
```

## 🛠️ Альтернативные инструменты

### Для работы с npm:
- **Yarn** - альтернатива npm
- **pnpm** - быстрый менеджер пакетов
- **Bun** - новый JavaScript runtime

### Для базы данных:
- **SQLite** - легкая локальная БД
- **PostgreSQL** - мощная реляционная БД
- **Redis** - для кэширования

### Для разработки:
- **VS Code** - редактор кода
- **WebStorm** - IDE от JetBrains
- **Sublime Text** - легкий редактор

## 📞 Поддержка

Если у вас возникли проблемы:

1. **Проверьте логи:**
   ```bash
   # Логи сервера
   npm run server:dev
   
   # Логи клиента
   npm run client:dev
   ```

2. **Проверьте подключения:**
   ```bash
   # MongoDB
   mongo --host localhost --port 27017
   
   # API
   curl http://localhost:3001/api/health
   ```

3. **Очистите кэш:**
   ```bash
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

## 🎯 Готово!

После выполнения всех шагов у вас будет:
- ✅ Локальный сервер на порту 3001
- ✅ React приложение на порту 3000
- ✅ MongoDB база данных
- ✅ Telegram бот для тестирования
- ✅ Полнофункциональная платформа знакомств

Удачи в разработке! 🚀💕
