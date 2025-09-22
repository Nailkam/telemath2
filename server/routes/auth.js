const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { 
  verifyTelegramWebApp, 
  generateToken, 
  generateRefreshToken 
} = require('../middleware/auth');

const router = express.Router();

// Register/Login with Telegram
router.post('/telegram', 
  verifyTelegramWebApp,
  [
    body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('lookingFor').isIn(['male', 'female', 'both']).withMessage('Invalid looking for preference')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: errors.array() 
        });
      }

      const { firstName, lastName, age, gender, lookingFor, bio, interests } = req.body;
      const telegramUser = req.telegramData.user;

      if (!telegramUser) {
        return res.status(400).json({ message: 'Telegram user data not found' });
      }

      // Check if user already exists
      let user = await User.findOne({ telegramId: telegramUser.id });

      if (user) {
        // Update last seen and return existing user
        user.lastSeen = new Date();
        await user.save();
        
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        return res.json({
          message: 'Login successful',
          user: {
            id: user._id,
            telegramId: user.telegramId,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            age: user.age,
            gender: user.gender,
            lookingFor: user.lookingFor,
            bio: user.bio,
            photos: user.photos,
            interests: user.interests,
            isVerified: user.isVerified,
            subscription: user.subscription,
            lastSeen: user.lastSeen
          },
          token,
          refreshToken
        });
      }

      // Create new user
      user = new User({
        telegramId: telegramUser.id,
        username: telegramUser.username,
        firstName: firstName || telegramUser.first_name,
        lastName: lastName || telegramUser.last_name,
        age: parseInt(age),
        gender,
        lookingFor,
        bio: bio || '',
        interests: interests || [],
        isVerified: true // Telegram users are considered verified
      });

      await user.save();

      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user._id,
          telegramId: user.telegramId,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          age: user.age,
          gender: user.gender,
          lookingFor: user.lookingFor,
          bio: user.bio,
          photos: user.photos,
          interests: user.interests,
          isVerified: user.isVerified,
          subscription: user.subscription,
          lastSeen: user.lastSeen
        },
        token,
        refreshToken
      });

    } catch (error) {
      console.error('Auth error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  }
);

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      token: newToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-__v');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        age: user.age,
        gender: user.gender,
        lookingFor: user.lookingFor,
        bio: user.bio,
        photos: user.photos,
        interests: user.interests,
        location: user.location,
        preferences: user.preferences,
        isVerified: user.isVerified,
        subscription: user.subscription,
        settings: user.settings,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
