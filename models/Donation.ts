import mongoose, { Schema, model, models } from 'mongoose';

const DonationSchema = new Schema({
  donorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  foodType: {
    type: String,
    required: true,
  },
  quantity: {
    type: String,
    required: true,
  },
  foodImage: {
    type: String,
    required: true,
  },
  preparedTime: {
    type: Date,
    required: true,
  },
  expiryTime: {
    type: Date,
    required: true,
  },
  pickupAddress: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
    index: true,
  },
  state: {
    type: String,
  },
  pincode: {
    type: String,
  },
  description: {
    type: String,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['pending', 'pending_request', 'accepted', 'pickup_in_progress', 'delivered', 'completed', 'flagged'],
    default: 'pending',
    index: true,
  },
  perishabilityScore: {
    type: Number,
    default: 0,
  },
  prioritizationRank: {
    type: Number,
    default: 0,
    index: true,
  },
  liveLatitude: {
    type: Number,
    default: null,
  },
  liveLongitude: {
    type: Number,
    default: null,
  },
  liveLocationUpdatedAt: {
    type: Date,
    default: null,
  },
  verificationCode: {
    type: String,
  },
  imageVerification: {
    aiConfidence: { type: Number, default: 0 },
    aiCategory: { type: String, default: '' },
    exifPresent: { type: Boolean, default: false },
    exifData: {
      cameraModel: String,
      captureDate: String,
      deviceName: String,
      gpsLatitude: Number,
      gpsLongitude: Number,
    },
    isSuspicious: { type: Boolean, default: false },
  },
  ngoVerification: [{
    ngoId: { type: Schema.Types.ObjectId, ref: 'User' },
    vote: { type: String, enum: ['valid', 'fake'] },
    createdAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

// Use different approach for model export to handle HMR better
const Donation = models.Donation || model('Donation', DonationSchema);
export default Donation;
