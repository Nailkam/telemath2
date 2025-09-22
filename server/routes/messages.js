const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Swipe = require('../models/Swipe');

const router = express.Router();

// Get user's conversations
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Message.getUserConversations(req.user._id);
    
    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Failed to get conversations' });
  }
});

// Get conversation with specific user
router.get('/conversation/:userId',
  [
    body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    body('skip').optional().isInt({ min: 0 }).withMessage('Skip must be non-negative')
  ],
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 50, skip = 0 } = req.query;

      // Verify that users are matched
      const isMatch = await Swipe.checkMatch(req.user._id, userId);
      if (!isMatch) {
        return res.status(403).json({ message: 'Users are not matched' });
      }

      const messages = await Message.getConversation(
        req.user._id, 
        userId, 
        parseInt(limit), 
        parseInt(skip)
      );

      // Mark messages as read
      await Message.markConversationAsRead(userId, req.user._id);

      res.json({ 
        messages: messages.reverse(), // Reverse to show oldest first
        hasMore: messages.length === parseInt(limit)
      });

    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ message: 'Failed to get conversation' });
    }
  }
);

// Send message
router.post('/send',
  [
    body('receiverId').isMongoId().withMessage('Invalid receiver ID'),
    body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters'),
    body('type').optional().isIn(['text', 'image', 'sticker', 'gif']).withMessage('Invalid message type'),
    body('mediaUrl').optional().isURL().withMessage('Invalid media URL'),
    body('replyTo').optional().isMongoId().withMessage('Invalid reply message ID')
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

      const { receiverId, content, type = 'text', mediaUrl, replyTo } = req.body;
      const senderId = req.user._id;

      // Check if user is trying to message themselves
      if (senderId.toString() === receiverId) {
        return res.status(400).json({ message: 'Cannot send message to yourself' });
      }

      // Verify that users are matched
      const isMatch = await Swipe.checkMatch(senderId, receiverId);
      if (!isMatch) {
        return res.status(403).json({ message: 'Users are not matched' });
      }

      // Validate reply message if provided
      if (replyTo) {
        const replyMessage = await Message.findOne({
          _id: replyTo,
          $or: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId }
          ]
        });

        if (!replyMessage) {
          return res.status(400).json({ message: 'Invalid reply message' });
        }
      }

      // Create new message
      const message = new Message({
        senderId,
        receiverId,
        content,
        type,
        mediaUrl,
        replyTo
      });

      await message.save();

      // Populate sender info for response
      await message.populate('senderId', 'firstName lastName photos');

      res.status(201).json({
        message: 'Message sent successfully',
        data: {
          id: message._id,
          content: message.content,
          type: message.type,
          mediaUrl: message.mediaUrl,
          sender: {
            id: message.senderId._id,
            firstName: message.senderId.firstName,
            lastName: message.senderId.lastName,
            photos: message.senderId.photos
          },
          createdAt: message.createdAt,
          replyTo: message.replyTo
        }
      });

    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  }
);

// Mark conversation as read
router.put('/conversation/:userId/read', async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify that users are matched
    const isMatch = await Swipe.checkMatch(req.user._id, userId);
    if (!isMatch) {
      return res.status(403).json({ message: 'Users are not matched' });
    }

    await Message.markConversationAsRead(userId, req.user._id);

    res.json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error('Mark conversation as read error:', error);
    res.status(500).json({ message: 'Failed to mark conversation as read' });
  }
});

// Delete message
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      senderId: req.user._id
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await message.softDelete();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

// Get unread message count
router.get('/unread/count', async (req, res) => {
  try {
    const unreadCount = await Message.getUnreadCount(req.user._id);
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
});

// Search messages
router.get('/search', async (req, res) => {
  try {
    const { query, userId, limit = 20, skip = 0 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const searchQuery = {
      $or: [
        { senderId: req.user._id },
        { receiverId: req.user._id }
      ],
      content: { $regex: query.trim(), $options: 'i' },
      isDeleted: false
    };

    if (userId) {
      searchQuery.$and = [
        {
          $or: [
            { senderId: req.user._id, receiverId: userId },
            { senderId: userId, receiverId: req.user._id }
          ]
        }
      ];
    }

    const messages = await Message.find(searchQuery)
      .populate('senderId', 'firstName lastName')
      .populate('receiverId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json({ 
      messages,
      hasMore: messages.length === parseInt(limit)
    });

  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ message: 'Failed to search messages' });
  }
});

// Report message
router.post('/:messageId/report',
  [
    body('reason').isIn(['spam', 'harassment', 'inappropriate', 'other']).withMessage('Invalid report reason'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
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

      const { messageId } = req.params;
      const { reason, description } = req.body;

      const message = await Message.findOne({
        _id: messageId,
        receiverId: req.user._id
      });

      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      // Here you would typically save the report to a reports collection
      // For now, we'll just log it
      console.log(`Message ${messageId} reported by ${req.user._id} for ${reason}: ${description}`);

      res.json({ message: 'Message reported successfully' });
    } catch (error) {
      console.error('Report message error:', error);
      res.status(500).json({ message: 'Failed to report message' });
    }
  }
);

module.exports = router;
