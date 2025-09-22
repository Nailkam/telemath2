const express = require('express');
const { Sequelize } = require('sequelize');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Создать папку uploads если её нет
const uploadDir = 'uploads/photos';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory');
}

// Инициализация SQLite базы данных
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false, // Отключить логи SQL запросов
});

// Простые модели для SQLite
const User = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  telegramId: {
    type: Sequelize.INTEGER,
    unique: true,
    allowNull: false,
  },
  firstName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  lastName: Sequelize.STRING,
  username: Sequelize.STRING,
  age: Sequelize.INTEGER,
  gender: {
    type: Sequelize.ENUM('male', 'female', 'other'),
    allowNull: false,
  },
  lookingFor: {
    type: Sequelize.ENUM('male', 'female', 'both'),
    allowNull: false,
  },
  bio: Sequelize.TEXT,
  photos: {
    type: Sequelize.TEXT,
    defaultValue: '[]', // JSON строка
  },
  interests: {
    type: Sequelize.TEXT,
    defaultValue: '[]', // JSON строка
  },
  location: {
    type: Sequelize.TEXT,
    defaultValue: '{}', // JSON строка
  },
  preferences: {
    type: Sequelize.TEXT,
    defaultValue: '{}', // JSON строка
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  isVerified: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  lastSeen: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  settings: {
    type: Sequelize.TEXT,
    defaultValue: '{}', // JSON строка
  },
  subscription: {
    type: Sequelize.TEXT,
    defaultValue: '{"type":"free"}', // JSON строка
  },
});

const Swipe = sequelize.define('Swipe', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  targetUserId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  action: {
    type: Sequelize.ENUM('like', 'pass', 'superlike'),
    allowNull: false,
  },
});

const Message = sequelize.define('Message', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  senderId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  receiverId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  type: {
    type: Sequelize.ENUM('text', 'image', 'sticker', 'gif'),
    defaultValue: 'text',
  },
  mediaUrl: Sequelize.STRING,
  isRead: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  readAt: Sequelize.DATE,
  isDeleted: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  deletedAt: Sequelize.DATE,
  replyTo: Sequelize.INTEGER,
});

// Связи между таблицами
User.hasMany(Swipe, { foreignKey: 'userId' });
Swipe.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Message, { foreignKey: 'senderId' });
User.hasMany(Message, { foreignKey: 'receiverId' });
Message.belongsTo(User, { foreignKey: 'senderId' });
Message.belongsTo(User, { foreignKey: 'receiverId' });

const app = express();

// Настройка trust proxy для Railway
app.set('trust proxy', 1);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Middleware для аутентификации
const jwt = require('jsonwebtoken');
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Токен доступа не предоставлен' });
    }

    // Проверка JWT токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findOne({ where: { id: decoded.userId } });
    
    if (!user) {
      return res.status(403).json({ message: 'Пользователь не найден' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Недействительный токен' });
    }
    res.status(500).json({ message: 'Ошибка аутентификации' });
  }
};

// Простые маршруты для тестирования
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'SQLite'
  });
});

// Простой маршрут для аутентификации
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const { initData, firstName, lastName, age, gender, lookingFor, bio, interests } = req.body;
    
    // Простая проверка данных Telegram
    if (!initData || !firstName) {
      return res.status(400).json({ message: 'Недостаточно данных для регистрации' });
    }

    // Поиск или создание пользователя
    let user = await User.findOne({ where: { firstName } });
    
    if (!user) {
      user = await User.create({
        telegramId: Math.floor(Math.random() * 1000000), // Временный ID
        firstName,
        lastName: lastName || '',
        age: parseInt(age) || null,
        gender: gender || 'other',
        lookingFor: lookingFor || 'both',
        bio: bio || '',
        interests: JSON.stringify(interests || []),
        photos: JSON.stringify([]),
        location: JSON.stringify({}),
        preferences: JSON.stringify({
          ageRange: { min: 18, max: 100 },
          maxDistance: 50,
          showMe: 'both'
        }),
        settings: JSON.stringify({
          notifications: { newMatches: true, messages: true, likes: true },
          privacy: { showAge: true, showDistance: true, showOnlineStatus: true }
        })
      });
    }

    // Создание JWT токена
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id, timestamp: Date.now() },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Успешная аутентификация',
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        gender: user.gender,
        lookingFor: user.lookingFor,
        bio: user.bio,
        photos: JSON.parse(user.photos),
        interests: JSON.parse(user.interests),
        isVerified: user.isVerified,
        subscription: JSON.parse(user.subscription),
        lastSeen: user.lastSeen
      },
      token,
      refreshToken: token
    });

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Ошибка аутентификации' });
  }
});


// Получение потенциальных совпадений
app.get('/api/users/matches/potential', authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user;

    // Простой поиск совпадений
    const users = await User.findAll({
      where: {
        id: { [require('sequelize').Op.ne]: currentUser.id },
        isActive: true
      },
      limit: 20
    });

    const matches = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      photos: JSON.parse(user.photos),
      interests: JSON.parse(user.interests),
      bio: user.bio,
      lastSeen: user.lastSeen
    }));

    res.json({ matches, hasMore: false });

  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ message: 'Ошибка получения совпадений' });
  }
});

// Socket.io для real-time сообщений
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });
  
  socket.on('send_message', (data) => {
    socket.to(data.roomId).emit('receive_message', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});


// Маршруты для пользователей
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Парсим JSON поля
    const userData = {
      ...user.toJSON(),
      photos: user.photos ? JSON.parse(user.photos) : [],
      interests: user.interests ? JSON.parse(user.interests) : [],
      location: user.location ? JSON.parse(user.location) : {},
      preferences: user.preferences ? JSON.parse(user.preferences) : {},
      subscription: user.subscription ? JSON.parse(user.subscription) : {},
      settings: user.settings ? JSON.parse(user.settings) : {}
    };
    
    res.json({ user: userData });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Ошибка получения профиля' });
  }
});

// Endpoint для получения текущего пользователя (используется AuthContext)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Парсим JSON поля
    const userData = {
      ...user.toJSON(),
      photos: user.photos ? JSON.parse(user.photos) : [],
      interests: user.interests ? JSON.parse(user.interests) : [],
      location: user.location ? JSON.parse(user.location) : {},
      preferences: user.preferences ? JSON.parse(user.preferences) : {},
      subscription: user.subscription ? JSON.parse(user.subscription) : {},
      settings: user.settings ? JSON.parse(user.settings) : {}
    };
    
    res.json({ user: userData });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Ошибка получения данных пользователя' });
  }
});

// Загрузка фото
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/photos';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `photo-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения (JPEG, PNG, GIF, WebP)'));
    }
  }
});

app.post('/api/users/photos', authenticateToken, (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Файл слишком большой. Максимальный размер: 10MB' });
      }
      if (err.message === 'Разрешены только изображения (JPEG, PNG, GIF, WebP)') {
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: 'Ошибка загрузки файла' });
    }
    next();
  });
}, async (req, res) => {
  try {
    // Проверяем ошибки multer
    if (req.fileValidationError) {
      return res.status(400).json({ message: req.fileValidationError });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Фото не загружено' });
    }

    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/photos/${req.file.filename}`;
    const isMain = req.body.isMain === 'true' || !req.user.photos || req.user.photos === '[]';

    // Обновляем пользователя с новым фото
    let photos = [];
    try {
      photos = req.user.photos ? JSON.parse(req.user.photos) : [];
    } catch (parseError) {
      console.error('Error parsing photos:', parseError);
      photos = [];
    }
    
    photos.push({ url: photoUrl, isMain, uploadedAt: new Date().toISOString() });
    
    await req.user.update({ photos: JSON.stringify(photos) });

    res.json({ 
      message: 'Фото загружено успешно',
      photo: {
        url: photoUrl,
        isMain
      }
    });

  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ message: 'Ошибка загрузки фото' });
  }
});

// Инициализация базы данных
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite подключена успешно');
    
    await sequelize.sync({ force: false }); // Создать таблицы если их нет
    console.log('✅ Таблицы синхронизированы');
    
  } catch (error) {
    console.error('❌ Ошибка подключения к SQLite:', error);
    process.exit(1);
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Что-то пошло не так!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Маршрут не найден' });
});

const PORT = process.env.PORT || 3001;

// Запуск сервера
initializeDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🌍 Окружение: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 База данных: SQLite`);
  });
});
