const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { requireCompleteProfile } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
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
    cb(null, `photo-${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile',
  [
    body('firstName').optional().trim().isLength({ min: 1 }).withMessage('First name cannot be empty'),
    body('lastName').optional().trim(),
    body('age').optional().isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
    body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
    body('interests').optional().isArray().withMessage('Interests must be an array'),
    body('preferences.ageRange.min').optional().isInt({ min: 18 }).withMessage('Min age must be at least 18'),
    body('preferences.ageRange.max').optional().isInt({ max: 100 }).withMessage('Max age cannot exceed 100'),
    body('preferences.maxDistance').optional().isInt({ min: 1, max: 1000 }).withMessage('Max distance must be between 1 and 1000 km')
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

      const allowedUpdates = [
        'firstName', 'lastName', 'age', 'bio', 'interests', 
        'preferences', 'settings'
      ];
      
      const updates = {};
      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      const user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true, runValidators: true }
      ).select('-__v');

      res.json({ 
        message: 'Profile updated successfully',
        user 
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  }
);

// Upload photo
router.post('/photos', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    const photoUrl = `/uploads/photos/${req.file.filename}`;
    const isMain = req.body.isMain === 'true' || req.user.photos.length === 0;

    await req.user.addPhoto(photoUrl, isMain);

    res.json({ 
      message: 'Photo uploaded successfully',
      photo: {
        url: photoUrl,
        isMain
      }
    });

  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ message: 'Failed to upload photo' });
  }
});

// Set main photo
router.put('/photos/:photoId/main', async (req, res) => {
  try {
    const { photoId } = req.params;
    await req.user.setMainPhoto(photoId);
    
    res.json({ message: 'Main photo updated successfully' });
  } catch (error) {
    console.error('Set main photo error:', error);
    res.status(500).json({ message: 'Failed to set main photo' });
  }
});

// Delete photo
router.delete('/photos/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    await req.user.removePhoto(photoId);
    
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ message: 'Failed to delete photo' });
  }
});

// Update location
router.put('/location',
  [
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('city').optional().trim(),
    body('country').optional().trim()
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

      const { latitude, longitude, city, country } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          location: {
            type: 'Point',
            coordinates: [longitude, latitude],
            city,
            country
          }
        },
        { new: true }
      ).select('-__v');

      res.json({ 
        message: 'Location updated successfully',
        location: user.location
      });

    } catch (error) {
      console.error('Update location error:', error);
      res.status(500).json({ message: 'Failed to update location' });
    }
  }
);

// Get potential matches
router.get('/matches/potential', requireCompleteProfile, async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    
    const matches = await User.findPotentialMatches(req.user._id, parseInt(limit));
    
    res.json({ 
      matches: matches.slice(parseInt(skip)),
      hasMore: matches.length > parseInt(skip) + parseInt(limit)
    });

  } catch (error) {
    console.error('Get potential matches error:', error);
    res.status(500).json({ message: 'Failed to get potential matches' });
  }
});

// Search users
router.get('/search', requireCompleteProfile, async (req, res) => {
  try {
    const { 
      ageMin, 
      ageMax, 
      gender, 
      interests, 
      maxDistance = 50,
      limit = 20,
      skip = 0 
    } = req.query;

    const query = {
      _id: { $ne: req.user._id },
      isActive: true
    };

    // Age filter
    if (ageMin || ageMax) {
      query.age = {};
      if (ageMin) query.age.$gte = parseInt(ageMin);
      if (ageMax) query.age.$lte = parseInt(ageMax);
    }

    // Gender filter
    if (gender) {
      query.gender = gender;
    }

    // Interests filter
    if (interests) {
      const interestArray = interests.split(',').map(i => i.trim());
      query.interests = { $in: interestArray };
    }

    // Location filter (if user has location)
    if (req.user.location && req.user.location.coordinates) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: req.user.location.coordinates
          },
          $maxDistance: parseInt(maxDistance) * 1000 // Convert km to meters
        }
      };
    }

    const users = await User.find(query)
      .select('firstName lastName age photos interests location lastSeen')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ lastSeen: -1 });

    res.json({ 
      users,
      hasMore: users.length === parseInt(limit)
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('firstName lastName age gender bio photos interests location lastSeen createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
});

// Update user settings
router.put('/settings', async (req, res) => {
  try {
    const { notifications, privacy } = req.body;

    const updates = {};
    if (notifications) updates['settings.notifications'] = notifications;
    if (privacy) updates['settings.privacy'] = privacy;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('-__v');

    res.json({ 
      message: 'Settings updated successfully',
      settings: user.settings
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

// Deactivate account
router.put('/deactivate', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    
    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ message: 'Failed to deactivate account' });
  }
});

module.exports = router;
