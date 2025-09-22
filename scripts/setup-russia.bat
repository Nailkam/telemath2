@echo off
echo 🚀 Настройка Telegram Dating App для России...

REM Проверка Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не установлен. Установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js найден

REM Настройка npm registry для России
echo 📦 Настройка npm registry для России...
npm config set registry https://registry.npmmirror.com/
echo ✅ npm registry настроен

REM Установка зависимостей
echo 📦 Установка зависимостей...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Ошибка установки root зависимостей
    pause
    exit /b 1
)

REM Установка server зависимостей
echo 📦 Установка server зависимостей...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Ошибка установки server зависимостей
    pause
    exit /b 1
)
cd ..

REM Установка client зависимостей
echo 📦 Установка client зависимостей...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Ошибка установки client зависимостей
    pause
    exit /b 1
)
cd ..

REM Создание .env файлов
echo ⚙️ Создание файлов конфигурации...

if not exist "server\.env" (
    copy "server\env.example" "server\.env"
    echo ✅ Создан server\.env
) else (
    echo ℹ️ server\.env уже существует
)

if not exist "client\.env" (
    copy "client\env.example" "client\.env"
    echo ✅ Создан client\.env
) else (
    echo ℹ️ client\.env уже существует
)

REM Создание папки uploads
if not exist "server\uploads" (
    mkdir "server\uploads"
    echo ✅ Создана папка uploads
)

echo.
echo 🎉 Настройка завершена!
echo.
echo 📋 Следующие шаги:
echo 1. Установите MongoDB:
echo    - Скачайте с https://www.mongodb.com/try/download/community
echo    - Или используйте Docker: docker run -d -p 27017:27017 mongo
echo.
echo 2. Создайте Telegram бота:
echo    - Найдите @BotFather в Telegram
echo    - Отправьте /newbot
echo    - Сохраните токен
echo.
echo 3. Настройте .env файлы:
echo    - server\.env - добавьте токен бота и настройки MongoDB
echo    - client\.env - добавьте токен бота
echo.
echo 4. Запустите приложение:
echo    - npm run dev
echo.
echo 📖 Подробная инструкция в файле LOCAL_SETUP_RUSSIA.md
echo.
pause
