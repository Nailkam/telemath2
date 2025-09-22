const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-__v');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Middleware to verify Telegram WebApp data
const verifyTelegramWebApp = (req, res, next) => {
  try {
    const { initData } = req.body;
    
    if (!initData) {
      return res.status(400).json({ message: 'Telegram init data required' });
    }

    // Parse init data
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    // Sort parameters
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Verify hash (simplified - in production use proper crypto verification)
    // For now, we'll trust the data and extract user info
    const userData = {};
    for (const [key, value] of urlParams.entries()) {
      if (key === 'user') {
        try {
          userData.user = JSON.parse(decodeURIComponent(value));
        } catch (e) {
          userData.user = null;
        }
      } else {
        userData[key] = value;
      }
    }

    req.telegramData = userData;
    next();
  } catch (error) {
    console.error('Telegram verification error:', error);
    res.status(400).json({ message: 'Invalid Telegram data' });
  }
};

// Middleware to check if user has premium subscription
const requirePremium = (req, res, next) => {
  if (req.user.subscription.type !== 'premium') {
    return res.status(403).json({ 
      message: 'Premium subscription required',
      upgradeRequired: true 
    });
  }
  next();
};

// Middleware to check if user profile is complete
const requireCompleteProfile = (req, res, next) => {
  const user = req.user;
  const requiredFields = ['age', 'gender', 'lookingFor', 'bio'];
  const missingFields = requiredFields.filter(field => !user[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      message: 'Profile incomplete',
      missingFields,
      completeProfile: false
    });
  }
  
  if (!user.photos || user.photos.length === 0) {
    return res.status(400).json({
      message: 'At least one photo is required',
      missingFields: ['photos'],
      completeProfile: false
    });
  }
  
  next();
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

module.exports = {
  authenticateToken,
  verifyTelegramWebApp,
  requirePremium,
  requireCompleteProfile,
  generateToken,
  generateRefreshToken
};
