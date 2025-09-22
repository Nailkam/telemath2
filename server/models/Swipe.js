const mongoose = require('mongoose');

const swipeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['like', 'pass', 'superlike'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate swipes
swipeSchema.index({ userId: 1, targetUserId: 1 }, { unique: true });

// Index for finding matches
swipeSchema.index({ targetUserId: 1, action: 1 });

// Static method to check if users have matched
swipeSchema.statics.checkMatch = async function(userId1, userId2) {
  const swipes = await this.find({
    $or: [
      { userId: userId1, targetUserId: userId2 },
      { userId: userId2, targetUserId: userId1 }
    ],
    action: { $in: ['like', 'superlike'] }
  });

  return swipes.length === 2;
};

// Static method to get user's matches
swipeSchema.statics.getMatches = function(userId) {
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        action: { $in: ['like', 'superlike'] }
      }
    },
    {
      $lookup: {
        from: 'swipes',
        let: { targetUserId: '$targetUserId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$targetUserId', mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$userId', '$$targetUserId'] },
                  { $in: ['$action', ['like', 'superlike']] }
                ]
              }
            }
          }
        ],
        as: 'mutualSwipe'
      }
    },
    {
      $match: {
        mutualSwipe: { $size: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'targetUserId',
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
        targetUserId: 1,
        action: 1,
        createdAt: 1,
        user: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          age: 1,
          photos: 1,
          lastSeen: 1
        }
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ]);
};

module.exports = mongoose.model('Swipe', swipeSchema);
