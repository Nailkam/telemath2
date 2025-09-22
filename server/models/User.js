const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  age: {
    type: Number,
    min: 18,
    max: 100
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  lookingFor: {
    type: String,
    enum: ['male', 'female', 'both'],
    required: true
  },
  bio: {
    type: String,
    maxlength: 500,
    trim: true
  },
  photos: [{
    url: String,
    isMain: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now }
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    city: String,
    country: String
  },
  interests: [{
    type: String,
    trim: true
  }],
  preferences: {
    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 100 }
    },
    maxDistance: { type: Number, default: 50 }, // in kilometers
    showMe: {
      type: String,
      enum: ['male', 'female', 'both'],
      default: 'both'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  settings: {
    notifications: {
      newMatches: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      likes: { type: Boolean, default: true }
    },
    privacy: {
      showAge: { type: Boolean, default: true },
      showDistance: { type: Boolean, default: true },
      showOnlineStatus: { type: Boolean, default: true }
    }
  },
  subscription: {
    type: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    expiresAt: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ location: '2dsphere' });
userSchema.index({ age: 1, gender: 1 });
userSchema.index({ isActive: 1, lastSeen: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName || ''}`.trim();
});

// Method to update last seen
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save();
};

// Method to check if user is online (seen within last 5 minutes)
userSchema.methods.isOnline = function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastSeen > fiveMinutesAgo;
};

// Method to get main photo
userSchema.methods.getMainPhoto = function() {
  const mainPhoto = this.photos.find(photo => photo.isMain);
  return mainPhoto ? mainPhoto.url : (this.photos[0] ? this.photos[0].url : null);
};

// Method to add photo
userSchema.methods.addPhoto = function(url, isMain = false) {
  if (isMain) {
    // Remove main flag from other photos
    this.photos.forEach(photo => photo.isMain = false);
  }
  
  this.photos.push({ url, isMain });
  return this.save();
};

// Method to remove photo
userSchema.methods.removePhoto = function(photoId) {
  this.photos = this.photos.filter(photo => photo._id.toString() !== photoId);
  return this.save();
};

// Method to set main photo
userSchema.methods.setMainPhoto = function(photoId) {
  this.photos.forEach(photo => {
    photo.isMain = photo._id.toString() === photoId;
  });
  return this.save();
};

// Static method to find potential matches
userSchema.statics.findPotentialMatches = function(userId, limit = 20) {
  return this.aggregate([
    {
      $match: {
        _id: { $ne: mongoose.Types.ObjectId(userId) },
        isActive: true
      }
    },
    {
      $lookup: {
        from: 'swipes',
        let: { targetUserId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$userId', mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$targetUserId', '$$targetUserId'] }
                ]
              }
            }
          }
        ],
        as: 'swipe'
      }
    },
    {
      $match: {
        swipe: { $size: 0 } // No previous swipe
      }
    },
    {
      $sample: { size: limit }
    }
  ]);
};

module.exports = mongoose.model('User', userSchema);
