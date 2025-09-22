const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'sticker', 'gif'],
    default: 'text'
  },
  mediaUrl: {
    type: String,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

// Compound index for conversation queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

// Virtual for conversation ID (consistent ordering)
messageSchema.virtual('conversationId').get(function() {
  const ids = [this.senderId.toString(), this.receiverId.toString()].sort();
  return `${ids[0]}_${ids[1]}`;
});

// Method to mark as read
messageSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to soft delete
messageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(userId1, userId2, limit = 50, skip = 0) {
  return this.find({
    $or: [
      { senderId: userId1, receiverId: userId2 },
      { senderId: userId2, receiverId: userId1 }
    ],
    isDeleted: false
  })
  .populate('senderId', 'firstName lastName photos')
  .populate('receiverId', 'firstName lastName photos')
  .populate('replyTo', 'content senderId')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Static method to get user's conversations
messageSchema.statics.getUserConversations = function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { senderId: mongoose.Types.ObjectId(userId) },
          { receiverId: mongoose.Types.ObjectId(userId) }
        ],
        isDeleted: false
      }
    },
    {
      $addFields: {
        otherUserId: {
          $cond: {
            if: { $eq: ['$senderId', mongoose.Types.ObjectId(userId)] },
            then: '$receiverId',
            else: '$senderId'
          }
        }
      }
    },
    {
      $group: {
        _id: '$otherUserId',
        lastMessage: { $last: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$receiverId', mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$isRead', false] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        _id: 1,
        user: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          photos: 1,
          lastSeen: 1
        },
        lastMessage: {
          content: 1,
          type: 1,
          createdAt: 1,
          isRead: 1
        },
        unreadCount: 1
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    }
  ]);
};

// Static method to mark conversation as read
messageSchema.statics.markConversationAsRead = function(senderId, receiverId) {
  return this.updateMany(
    {
      senderId: receiverId,
      receiverId: senderId,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

// Static method to get unread count
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    receiverId: userId,
    isRead: false,
    isDeleted: false
  });
};

module.exports = mongoose.model('Message', messageSchema);
