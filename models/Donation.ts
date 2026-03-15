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
    enum: ['pending', 'accepted', 'picked_up', 'delivered', 'flagged'],
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
}, {
  timestamps: true,
});

export default models.Donation || model('Donation', DonationSchema);
