const express = require('express');
const { body, validationResult } = require('express-validator');
const Swipe = require('../models/Swipe');
const User = require('../models/User');
const Message = require('../models/Message');

const router = express.Router();

// Swipe on a user (like/pass/superlike)
router.post('/swipe',
  [
    body('targetUserId').isMongoId().withMessage('Invalid target user ID'),
    body('action').isIn(['like', 'pass', 'superlike']).withMessage('Invalid action')
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

      const { targetUserId, action } = req.body;
      const userId = req.user._id;

      // Check if user is trying to swipe on themselves
      if (userId.toString() === targetUserId) {
        return res.status(400).json({ message: 'Cannot swipe on yourself' });
      }

      // Check if target user exists and is active
      const targetUser = await User.findById(targetUserId);
      if (!targetUser || !targetUser.isActive) {
        return res.status(404).json({ message: 'User not found or inactive' });
      }

      // Check if swipe already exists
      const existingSwipe = await Swipe.findOne({ userId, targetUserId });
      if (existingSwipe) {
        return res.status(400).json({ message: 'Already swiped on this user' });
      }

      // Create new swipe
      const swipe = new Swipe({
        userId,
        targetUserId,
        action
      });

      await swipe.save();

      // Check for match if action is like or superlike
      let isMatch = false;
      if (action === 'like' || action === 'superlike') {
        isMatch = await Swipe.checkMatch(userId, targetUserId);
        
        if (isMatch) {
          // Create a conversation room for matched users
          // This could trigger a notification or other match-related actions
          console.log(`Match found between ${userId} and ${targetUserId}`);
        }
      }

      res.json({
        message: 'Swipe recorded successfully',
        isMatch,
        action
      });

    } catch (error) {
      console.error('Swipe error:', error);
      res.status(500).json({ message: 'Failed to record swipe' });
    }
  }
);

// Get user's matches
router.get('/', async (req, res) => {
  try {
    const matches = await Swipe.getMatches(req.user._id);
    
    res.json({ matches });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ message: 'Failed to get matches' });
  }
});

// Get match details
router.get('/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    
    // Verify that this is actually a match
    const match = await Swipe.findOne({
      $or: [
        { userId: req.user._id, targetUserId: matchId },
        { userId: matchId, targetUserId: req.user._id }
      ],
      action: { $in: ['like', 'superlike'] }
    });

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Get the other user's info
    const otherUserId = match.userId.toString() === req.user._id.toString() 
      ? match.targetUserId 
      : match.userId;

    const user = await User.findById(otherUserId)
      .select('firstName lastName age photos interests bio lastSeen');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get last message in conversation
    const lastMessage = await Message.findOne({
      $or: [
        { senderId: req.user._id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.user._id }
      ],
      isDeleted: false
    }).sort({ createdAt: -1 });

    res.json({
      match: {
        userId: otherUserId,
        user,
        matchedAt: match.createdAt,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          type: lastMessage.type,
          createdAt: lastMessage.createdAt,
          isRead: lastMessage.isRead
        } : null
      }
    });

  } catch (error) {
    console.error('Get match details error:', error);
    res.status(500).json({ message: 'Failed to get match details' });
  }
});

// Unmatch a user
router.delete('/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    
    // Remove swipes in both directions
    await Swipe.deleteMany({
      $or: [
        { userId: req.user._id, targetUserId: matchId },
        { userId: matchId, targetUserId: req.user._id }
      ]
    });

    // Mark all messages in conversation as deleted
    await Message.updateMany({
      $or: [
        { senderId: req.user._id, receiverId: matchId },
        { senderId: matchId, receiverId: req.user._id }
      ]
    }, {
      isDeleted: true,
      deletedAt: new Date()
    });

    res.json({ message: 'Unmatched successfully' });
  } catch (error) {
    console.error('Unmatch error:', error);
    res.status(500).json({ message: 'Failed to unmatch' });
  }
});

// Get swipe history
router.get('/history/swipes', async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    
    const swipes = await Swipe.find({ userId: req.user._id })
      .populate('targetUserId', 'firstName lastName age photos')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json({ 
      swipes,
      hasMore: swipes.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get swipe history error:', error);
    res.status(500).json({ message: 'Failed to get swipe history' });
  }
});

// Get who liked me
router.get('/likes/received', async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    
    const likes = await Swipe.find({
      targetUserId: req.user._id,
      action: { $in: ['like', 'superlike'] }
    })
    .populate('userId', 'firstName lastName age photos')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

    res.json({ 
      likes,
      hasMore: likes.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get received likes error:', error);
    res.status(500).json({ message: 'Failed to get received likes' });
  }
});

// Get who I liked
router.get('/likes/sent', async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    
    const likes = await Swipe.find({
      userId: req.user._id,
      action: { $in: ['like', 'superlike'] }
    })
    .populate('targetUserId', 'firstName lastName age photos')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

    res.json({ 
      likes,
      hasMore: likes.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get sent likes error:', error);
    res.status(500).json({ message: 'Failed to get sent likes' });
  }
});

// Get match statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const [
      totalMatches,
      totalLikes,
      totalPasses,
      totalSuperLikes,
      receivedLikes
    ] = await Promise.all([
      Swipe.countDocuments({
        $or: [
          { userId, action: { $in: ['like', 'superlike'] } },
          { targetUserId: userId, action: { $in: ['like', 'superlike'] } }
        ]
      }),
      Swipe.countDocuments({ userId, action: 'like' }),
      Swipe.countDocuments({ userId, action: 'pass' }),
      Swipe.countDocuments({ userId, action: 'superlike' }),
      Swipe.countDocuments({ targetUserId: userId, action: { $in: ['like', 'superlike'] } })
    ]);

    res.json({
      stats: {
        totalMatches,
        totalLikes,
        totalPasses,
        totalSuperLikes,
        receivedLikes
      }
    });
  } catch (error) {
    console.error('Get match stats error:', error);
    res.status(500).json({ message: 'Failed to get match statistics' });
  }
});

module.exports = router;
