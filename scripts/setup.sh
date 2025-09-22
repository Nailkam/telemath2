#!/bin/bash

echo "🚀 Setting up Telegram Dating App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB first."
    echo "   Visit: https://docs.mongodb.com/manual/installation/"
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

# Create environment files
echo "⚙️  Creating environment files..."

# Server env
if [ ! -f server/.env ]; then
    cp server/env.example server/.env
    echo "✅ Created server/.env file"
    echo "⚠️  Please update server/.env with your configuration"
else
    echo "ℹ️  server/.env already exists"
fi

# Client env
if [ ! -f client/.env ]; then
    cp client/env.example client/.env
    echo "✅ Created client/.env file"
    echo "⚠️  Please update client/.env with your configuration"
else
    echo "ℹ️  client/.env already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update server/.env with your MongoDB URI and JWT secret"
echo "2. Update client/.env with your API URL"
echo "3. Create a Telegram bot using @BotFather"
echo "4. Configure your bot's Web App URL"
echo "5. Run 'npm run dev' to start the development server"
echo ""
echo "For more information, see README.md"
