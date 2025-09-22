# Telegram Dating App

Платформа знакомств, интегрированная в Telegram через мини-приложение.

## Особенности

- 🔐 Аутентификация через Telegram
- 👤 Профили пользователей с фото и интересами
- 💕 Система подбора пар на основе предпочтений
- 💬 Встроенная система сообщений
- 📱 Адаптивный дизайн для мобильных устройств
- 🚀 Быстрая загрузка и отзывчивый интерфейс
- 🔄 Real-time уведомления через Socket.io
- 📍 Геолокация для поиска поблизости
- 🎨 Современный UI с анимациями

## Технологии

### Backend
- Node.js + Express
- MongoDB с Mongoose
- JWT для аутентификации
- Socket.io для real-time сообщений
- Multer для загрузки файлов
- Express Rate Limit для защиты от спама

### Frontend
- React 18 + TypeScript
- Tailwind CSS для стилизации
- Framer Motion для анимаций
- React Query для управления состоянием
- Socket.io Client для real-time
- Telegram WebApp API

## Быстрый старт

### 🇷🇺 Для пользователей из России

**Используйте специальную инструкцию:** [LOCAL_SETUP_RUSSIA.md](LOCAL_SETUP_RUSSIA.md)

**Быстрый запуск:**
```bash
# Запустите скрипт автоматической настройки
scripts\setup-russia.bat

# Затем запустите приложение
scripts\start-russia.bat
```

### 🌍 Для остальных пользователей

### 1. Установка зависимостей

```bash
# Установка всех зависимостей
npm run install:all
```

### 2. Настройка окружения

Скопируйте файлы конфигурации:

```bash
# Windows
copy server\env.example server\.env
copy client\env.example client\.env

# Linux/Mac
cp server/env.example server/.env
cp client/env.example client/.env
```

### 3. Настройка переменных окружения

**server/.env:**
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/telegram-dating
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/webhook
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**client/.env:**
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_TELEGRAM_BOT_TOKEN=your-telegram-bot-token
REACT_APP_APP_NAME=Telegram Dating
REACT_APP_APP_VERSION=1.0.0
REACT_APP_DEBUG=true
```

### 4. Настройка MongoDB

Убедитесь, что MongoDB запущен:

```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### 5. Запуск приложения

```bash
# Запуск в режиме разработки
npm run dev

# Или запуск отдельных частей
npm run server:dev  # Только backend
npm run client:dev  # Только frontend
```

## Настройка Telegram Bot

### 1. Создание бота

1. Найдите @BotFather в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните полученный токен

### 2. Настройка Web App

1. Отправьте команду `/newapp` боту @BotFather
2. Выберите вашего бота
3. Укажите название приложения
4. Загрузите иконку (512x512px)
5. Укажите URL вашего приложения: `https://yourdomain.com`
6. Добавьте описание приложения

### 3. Настройка команд бота

Отправьте @BotFather команду `/setcommands` и добавьте:

```
start - Начать знакомства
profile - Мой профиль
matches - Мои совпадения
messages - Сообщения
settings - Настройки
help - Помощь
```

### 4. Настройка меню бота

Отправьте @BotFather команду `/setmenubutton` и настройте кнопку меню.

## Структура проекта

```
telegram-dating-app/
├── client/                 # React frontend
│   ├── public/            # Статические файлы
│   ├── src/
│   │   ├── components/    # React компоненты
│   │   ├── contexts/      # React контексты
│   │   ├── hooks/         # Кастомные хуки
│   │   ├── pages/         # Страницы приложения
│   │   ├── services/      # API сервисы
│   │   └── types/         # TypeScript типы
│   ├── package.json
│   └── tailwind.config.js
├── server/                # Node.js backend
│   ├── models/           # MongoDB модели
│   ├── routes/           # API маршруты
│   ├── middleware/       # Express middleware
│   ├── uploads/          # Загруженные файлы
│   ├── package.json
│   └── index.js
├── scripts/              # Скрипты для развертывания
├── package.json          # Root package.json
└── README.md
```

## API Endpoints

### Аутентификация
- `POST /api/auth/telegram` - Вход/регистрация через Telegram
- `POST /api/auth/refresh` - Обновление токена
- `GET /api/auth/me` - Получение текущего пользователя

### Пользователи
- `GET /api/users/profile` - Получение профиля
- `PUT /api/users/profile` - Обновление профиля
- `POST /api/users/photos` - Загрузка фото
- `GET /api/users/matches/potential` - Потенциальные совпадения
- `GET /api/users/search` - Поиск пользователей

### Совпадения
- `POST /api/matches/swipe` - Свайп (лайк/пасс/суперлайк)
- `GET /api/matches` - Получение совпадений
- `DELETE /api/matches/:id` - Отмена совпадения

### Сообщения
- `GET /api/messages/conversations` - Список разговоров
- `GET /api/messages/conversation/:userId` - История сообщений
- `POST /api/messages/send` - Отправка сообщения
- `PUT /api/messages/conversation/:userId/read` - Отметка как прочитанное

## Развертывание

### 1. Подготовка к продакшену

```bash
# Сборка frontend
npm run build

# Установка production зависимостей
cd server && npm install --production
```

### 2. Настройка сервера

- Установите Node.js и MongoDB на сервер
- Настройте reverse proxy (nginx)
- Настройте SSL сертификат
- Обновите переменные окружения для продакшена

### 3. Настройка домена

Обновите URL в настройках Telegram бота на ваш домен.

## Безопасность

- JWT токены с истечением срока действия
- Rate limiting для защиты от спама
- Валидация всех входящих данных
- Защита от XSS и CSRF атак
- Безопасная загрузка файлов

## Мониторинг

- Логирование всех запросов
- Обработка ошибок
- Health check endpoint: `/api/health`

## Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте логи сервера
2. Убедитесь, что все переменные окружения настроены
3. Проверьте подключение к MongoDB
4. Убедитесь, что Telegram бот настроен правильно

## Лицензия

MIT License - см. файл LICENSE для деталей.

## Вклад в проект

Мы приветствуем вклад в развитие проекта! Пожалуйста:

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## Roadmap

- [ ] Push уведомления
- [ ] Видео звонки
- [ ] Расширенная фильтрация
- [ ] Premium подписка
- [ ] Модерация контента
- [ ] Аналитика и статистика
