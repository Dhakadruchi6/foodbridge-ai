import mongoose, { Schema, model, models } from 'mongoose';

const DeliverySchema = new Schema({
  donationId: {
    type: Schema.Types.ObjectId,
    ref: 'Donation',
    required: true,
  },
  ngoId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pickupTime: {
    type: Date,
  },
  deliveryTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'on_the_way', 'arrived', 'collected', 'delivered', 'completed', 'rejected'],
    default: 'pending',
  },
  collectedAt: {
    type: Date,
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
  isLive: {
    type: Boolean,
    default: false,
  },
  distributionStatus: {
    type: String,
    enum: ['pending', 'assigned', 'on_the_way', 'delivered'],
    default: 'pending',
  },
  hungerSpotId: {
    type: Schema.Types.ObjectId,
    ref: 'HungerSpot',
    default: null,
  },
}, {
  timestamps: true,
});

export default models.Delivery || model('Delivery', DeliverySchema);
