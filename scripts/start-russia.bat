@echo off
echo 🚀 Запуск Telegram Dating App для России...

REM Проверка Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не установлен
    pause
    exit /b 1
)

REM Настройка npm registry
echo 📦 Настройка npm registry...
npm config set registry https://registry.npmmirror.com/

REM Проверка зависимостей
if not exist "node_modules" (
    echo 📦 Установка зависимостей...
    call npm install
)

if not exist "server\node_modules" (
    echo 📦 Установка server зависимостей...
    cd server
    call npm install
    cd ..
)

if not exist "client\node_modules" (
    echo 📦 Установка client зависимостей...
    cd client
    call npm install
    cd ..
)

REM Проверка .env файлов
if not exist "server\.env" (
    echo ⚙️ Создание server\.env...
    copy "server\env-sqlite.example" "server\.env"
)

if not exist "client\.env" (
    echo ⚙️ Создание client\.env...
    copy "client\env.example" "client\.env"
)

REM Создание папки uploads
if not exist "server\uploads" (
    mkdir "server\uploads"
)

echo.
echo 🎉 Все готово для запуска!
echo.
echo 📋 Следующие шаги:
echo 1. Отредактируйте server\.env - добавьте токен Telegram бота
echo 2. Отредактируйте client\.env - добавьте токен Telegram бота
echo 3. Создайте бота через @BotFather в Telegram
echo.
echo 🚀 Запуск приложения...
echo.

REM Запуск приложения
start "Telegram Dating Server" cmd /k "cd server && node index-sqlite.js"
timeout /t 3 /nobreak >nul
start "Telegram Dating Client" cmd /k "cd client && npm start"

echo.
echo ✅ Приложение запущено!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:3001
echo 💾 База данных: SQLite (server\database.sqlite)
echo.
echo 📖 Подробная инструкция в LOCAL_SETUP_RUSSIA.md
echo.
pause
