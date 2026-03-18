import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    index: true,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  password: {
    type: String,
    // Optional for social login users
  },
  role: {
    type: String,
    enum: ['donor', 'ngo', 'admin'],
    default: 'donor',
  },
  city: String,
  state: String,
  address: String,
  pincode: String,
  latitude: Number,
  longitude: Number,
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  otp: String,
  otpExpires: Date,
  otpAttemptCount: {
    type: Number,
    default: 0,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  isFirstLogin: {
    type: Boolean,
    default: true,
  },
  pushSubscription: {
    type: Object,
  },
  donationPreferences: String,
  warnings: {
    type: Number,
    default: 0,
  },
  isSuspended: {
    type: Boolean,
    default: false,
  },
  smsEnabled: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default models.User || model('User', UserSchema);
